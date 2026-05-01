const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/users/search?email=
router.get('/search', auth, async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: 'Email query required' });
    const users = await User.find({ email: { $regex: email, $options: 'i' }, _id: { $ne: req.user._id } }).limit(5);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/users/me
router.put('/me', auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (name) req.user.name = name;
    await req.user.save();
    res.json({ user: req.user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
