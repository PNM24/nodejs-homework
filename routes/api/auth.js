const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const User = require('../../models/user');
const authMiddleware = require('../../middlewares/auth');

const JWT_SECRET = 'secretkey123';

// Schema Joi pentru validare înregistrare/login
const userSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

// Schema Joi pentru actualizarea abonamentului
const subscriptionSchema = Joi.object({
  subscription: Joi.string().valid('starter', 'pro', 'business').required(),
});

// Înregistrare
router.post('/signup', async (req, res) => {
  const { error } = userSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const { email, password } = req.body;
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({ message: 'Email in use' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUser = new User({ email, password: hashedPassword, subscription: 'starter' });
  await newUser.save();

  return res.status(201).json({
    user: {
      email: newUser.email,
      subscription: newUser.subscription,
    },
  });
});

// Login
router.post('/login', async (req, res) => {
  const { error } = userSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: 'Email or password is wrong' });
  }

  const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });
  user.token = token;
  await user.save();

  return res.status(200).json({
    token,
    user: {
      email: user.email,
      subscription: user.subscription,
    },
  });
});

// Logout
router.get('/logout', authMiddleware, async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  user.token = null;
  await user.save();
  return res.status(204).send();
});

// Obține utilizatorul curent
router.get('/current', authMiddleware, async (req, res) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  return res.status(200).json({
    email: user.email,
    subscription: user.subscription,
  });
});

// Actualizare abonament
router.patch('/users', authMiddleware, async (req, res) => {
  const { error } = subscriptionSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const { subscription } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  user.subscription = subscription;
  await user.save();
  return res.status(200).json({
    message: 'Subscription updated successfully',
    subscription: user.subscription,
  });
});

module.exports = router;
