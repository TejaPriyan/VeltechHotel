const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));
// Search Console Verification, Robots, and Sitemap routes
app.get('/google87bb3bc53ec346d2.html', (req, res) => {
  res.type('text/html').send('google-site-verification: google87bb3bc53ec346d2.html');
});
app.get('/robots.txt', (req, res) => {
  res.type('text/plain').sendFile(path.join(__dirname, '../client/robots.txt'));
});
app.get('/sitemap.xml', (req, res) => {
  res.type('application/xml').sendFile(path.join(__dirname, '../client/sitemap.xml'));
});


// Serve HTML pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../client/pages/index.html')));
app.get('/rooms', (req, res) => res.sendFile(path.join(__dirname, '../client/pages/rooms.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, '../client/pages/login.html')));
app.get('/signup', (req, res) => res.sendFile(path.join(__dirname, '../client/pages/signup.html')));
app.get('/welcome', (req, res) => res.sendFile(path.join(__dirname, '../client/pages/welcome.html')));
app.get('/booking', (req, res) => res.sendFile(path.join(__dirname, '../client/pages/booking.html')));
app.get('/profile', (req, res) => res.sendFile(path.join(__dirname, '../client/pages/profile.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, '../client/pages/admin.html')));

const PORT = process.env.PORT || 5001;

// Init SQLite first, then start server
const { initDb } = require('./database');
initDb().then(() => {
  // Mount routes AFTER db is ready
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/rooms', require('./routes/rooms'));
  app.use('/api/bookings', require('./routes/bookings'));
  app.use('/api/admin', require('./routes/admin'));

  app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
}).catch(err => {
  console.error('❌ Failed to init database:', err.message);
  process.exit(1);
});
