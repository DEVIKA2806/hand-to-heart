const express = require('express');
const Contact = require('../models/Contact');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { name, email, message, phone } = req.body;
    const c = new Contact({ name, email, message, phone });
    await c.save();
    res.status(201).json({ message: 'Received' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
