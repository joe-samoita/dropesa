const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/signup', async (req, res) => {
  try {
    const { phone, name } = req.body;

    if (!phone || !name) {
      return res.status(400).json({ error: 'phone and name are required' });
    }

    // Check if user exists
    let user = await User.findOne({ phone });
    if (user) {
      // User exists, return login token
      const token = jwt.sign({ userId: user._id, phone: user.phone }, process.env.JWT_SECRET, {
        expiresIn: '30d',
      });
      return res.json({ token, user: { id: user._id, phone: user.phone, name: user.name } });
    }

    // Create new user
    user = new User({ phone, name });
    await user.save();

    const token = jwt.sign({ userId: user._id, phone: user.phone }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });

    res.status(201).json({ token, user: { id: user._id, phone: user.phone, name: user.name } });
  } catch (error) {
    console.error('Signup error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-pin');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
