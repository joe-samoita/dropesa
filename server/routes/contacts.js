const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Contact = require('../models/Contact');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Generate pairing token/QR
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const pairingToken = uuidv4();
    const payload = {
      token: pairingToken,
      userId: user._id,
      phone: user.phone,
      name: user.name,
    };

    res.json(payload);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Accept pairing by token
router.post('/accept', authMiddleware, async (req, res) => {
  try {
    const { pairingToken, pairedUserData } = req.body;

    if (!pairedUserData) {
      return res.status(400).json({ error: 'pairedUserData is required' });
    }

    // Find or create paired user
    let pairedUser = await User.findOne({ phone: pairedUserData.phone });
    if (!pairedUser) {
      pairedUser = new User({
        phone: pairedUserData.phone,
        name: pairedUserData.name,
      });
      await pairedUser.save();
    }

    // Check if already paired
    let existing = await Contact.findOne({
      userId: req.user.userId,
      pairedUserId: pairedUser._id,
    });

    if (!existing) {
      // Create bidirectional pairing
      const contact1 = new Contact({
        userId: req.user.userId,
        pairedUserId: pairedUser._id,
        pairingToken,
        status: 'PAIRED',
      });
      const contact2 = new Contact({
        userId: pairedUser._id,
        pairedUserId: req.user.userId,
        pairingToken,
        status: 'PAIRED',
      });
      await contact1.save();
      await contact2.save();
    }

    const contacts = await Contact.find({ userId: req.user.userId }).populate('pairedUserId', 'phone name');
    res.status(201).json({ message: 'Contact paired', contacts });
  } catch (error) {
    console.error('Pairing error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get paired contacts
router.get('/', authMiddleware, async (req, res) => {
  try {
    const contacts = await Contact.find({ userId: req.user.userId })
      .populate('pairedUserId', 'phone name')
      .sort({ createdAt: -1 });

    res.json(contacts.map(c => ({
      id: c._id,
      phone: c.pairedUserId.phone,
      name: c.pairedUserId.name,
      status: c.status,
      createdAt: c.createdAt,
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
