const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const gravatar = require('gravatar');
const path = require('path');
const fs = require('fs/promises');
const jimp = require('jimp');
const User = require('../../models/user');
const authMiddleware = require('../../middlewares/auth');
const upload = require('../../middlewares/upload');

const userSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
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

    const avatarURL = gravatar.url(email, {
      s: '250',
      r: 'g',
      d: 'mp'
    }, true);

    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = new User({
      email,
      password: hashedPassword,
      avatarURL,
    });

    await newUser.save();

    res.status(201).json({
      user: {
        email: newUser.email,
        subscription: newUser.subscription,
        avatarURL: newUser.avatarURL,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { error } = userSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ message: 'Email or password is wrong' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    user.token = token;
    await user.save();

    res.json({
      token,
      user: {
        email: user.email,
        subscription: user.subscription,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Logout
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { token: null });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update avatar
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

      const image = await jimp.read(tempUpload);
      await image
        .resize(250, 250)
        .writeAsync(avatarPath);

      await fs.unlink(tempUpload);

      if (req.user.avatarURL) {
        const oldAvatarPath = path.join(process.cwd(), 'public', req.user.avatarURL.replace('/', ''));
        await fs.unlink(oldAvatarPath).catch(err => {
          console.error('Error deleting old avatar:', err.message);
          // Continuăm execuția chiar dacă ștergerea avatarului vechi eșuează
        });
      }

      const avatarURL = `/avatars/${uniqueFileName}`;
      await User.findByIdAndUpdate(req.user._id, { avatarURL });

      res.json({ avatarURL });
    } catch (error) {
      console.error('Avatar update error:', error);
      await fs.unlink(req.file.path).catch(err => {
        console.error('Error deleting temp file:', err.message);
      });
      res.status(500).json({ message: 'Error updating avatar' });
    }
  }
);

module.exports = router;