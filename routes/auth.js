const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const User = require('../models/User');

router.get('/signup', (req, res) => {
  res.render('signup');
});

router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
    });
    if (existingUser) return res.status(400).send('Username or Email already exists');

    const user = new User({ username, email, password });
    await user.save();

    res.redirect('/login');
  } catch (error) {
    res.status(500).send('Server error');
  }
});

router.get('/login', (req, res) => {
  res.render('login');
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).render('error', { message: "Something went wrong", user: res.locals.user })


    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(400).render('error', { message: "Something went wrong", user: res.locals.user })

    const payload = { id: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.cookie('token', token, { httpOnly: true });
    res.redirect('/books');
  } catch (error) {
    res.status(500).send('Server error');
  }
});

router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});

module.exports = router;
