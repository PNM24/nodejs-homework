const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const gravatar = require('gravatar');
const path = require('path');
const fs = require('fs/promises');
const Joi = require('joi');
const User = require('../../models/user');
const { sendVerificationEmail } = require('../../services/emailService');
const authMiddleware = require('../../middlewares/auth');
const upload = require('../../middlewares/upload');

// Validation schemas
const userSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const emailSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'any.required': 'missing required field email'
  })
});

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { error } = userSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { email, password } = req.body;
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      return res.status(409).json({ message: 'Email in use' });
    }

    const verificationToken = uuidv4();
    const avatarURL = gravatar.url(email, { s: '250', r: 'g', d: 'mp' }, true);
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email,
      password: hashedPassword,
      subscription: 'starter',
      avatarURL,
      verificationToken,
      verify: false
    });

    await newUser.save();

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
    }

    res.status(201).json({
      user: {
        email: newUser.email,
        subscription: newUser.subscription,
        avatarURL: newUser.avatarURL
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    console.log('Login attempt for:', req.body.email); // logging

    const { error } = userSchema.validate(req.body);
    if (error) {
      console.log('Validation error:', error.details[0].message);
      return res.status(400).json({ message: error.details[0].message });
    }

    const { email, password } = req.body;
    
    // Find user and log result
    const user = await User.findOne({ email });
    console.log('User found:', user ? 'Yes' : 'No');

    if (!user) {
      return res.status(401).json({ message: 'Email or password is wrong' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Email or password is wrong' });
    }

    // Check verification
    console.log('User verified:', user.verify);
    if (!user.verify) {
      return res.status(401).json({ 
        message: 'Email not verified. Please verify your email first.' 
      });
    }

    // Generate token
    const payload = { id: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log('Token generated successfully');

    // Update user with token
    user.token = token;
    await user.save();

    res.json({
      token,
      user: {
        email: user.email,
        subscription: user.subscription
      }
    });

  } catch (error) {
    console.error('Login error details:', error);
    res.status(500).json({ 
      message: 'Login failed', 
      error: error.message 
    });
  }
});

// Logout
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { token: null });
    res.status(204).send();
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Logout failed' });
  }
});

// Verify Email
router.get('/verify/:verificationToken', async (req, res) => {
  try {
    const { verificationToken } = req.params;
    const user = await User.findOne({ verificationToken });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await User.findByIdAndUpdate(user._id, {
      verify: true,
      verificationToken: null
    });

    res.json({ message: 'Verification successful' });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ message: 'Verification failed' });
  }
});

// Resend Verification Email
router.post('/verify', async (req, res) => {
  try {
    const { error } = emailSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.verify) {
      return res.status(400).json({ message: 'Verification has already been passed' });
    }

    await sendVerificationEmail(email, user.verificationToken);
    res.json({ message: 'Verification email sent' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update Avatar
router.patch(
  '/avatars',
  authMiddleware,
  upload.single('avatar'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Avatar file is required' });
      }

      const { path: tempUpload, filename } = req.file;
      const uniqueFileName = `${req.user._id}_${filename}`;
      const avatarPath = path.join('public', 'avatars', uniqueFileName);

      await fs.rename(tempUpload, avatarPath);

      if (req.user.avatarURL) {
        const oldAvatarPath = path.join(process.cwd(), 'public', req.user.avatarURL.replace('/', ''));
        await fs.unlink(oldAvatarPath).catch(err => console.log('No old avatar to delete'));
      }

      const avatarURL = `/avatars/${uniqueFileName}`;
      await User.findByIdAndUpdate(req.user._id, { avatarURL });

      res.json({ avatarURL });
    } catch (error) {
      console.error('Avatar update error:', error);
      await fs.unlink(req.file.path).catch(err => console.log('Error deleting temp file'));
      res.status(500).json({ message: error.message });
    }
  }
);

// Get Current User
router.get('/current', authMiddleware, async (req, res) => {
  try {
    const { email, subscription } = req.user;
    res.json({
      email,
      subscription
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: error.message });
  }
});


// Schema de validare pentru subscription
const subscriptionSchema = Joi.object({
  subscription: Joi.string().valid('starter', 'pro', 'business').required(),
});

// Ruta pentru actualizare subscription
router.patch('/subscription', authMiddleware, async (req, res) => {
  try {
    const { error } = subscriptionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { subscription } = req.body;
    const { _id } = req.user;

    const updatedUser = await User.findByIdAndUpdate(
      _id,
      { subscription },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        email: updatedUser.email,
        subscription: updatedUser.subscription
      }
    });
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({ message: error.message });
  }
});
module.exports = router;