const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../database');
const { protect } = require('../middleware/auth');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

router.post('/signup', (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'All fields are required' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const existing = query.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const hashed = bcrypt.hashSync(password, 12);
    const result = query.run("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'customer')", [name, email, hashed]);
    const user = { id: result.lastInsertRowid, name, email, role: 'customer' };
    res.status(201).json({ token: generateToken(user.id), user });
  } catch (err) {
    console.error('Signup error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const user = query.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });

    const match = bcrypt.compareSync(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid email or password' });

    res.json({ token: generateToken(user.id), user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/me', protect, (req, res) => res.json({ user: req.user }));

module.exports = router;
