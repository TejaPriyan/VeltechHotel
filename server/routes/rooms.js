const express = require('express');
const router = express.Router();
const { query } = require('../database');
const { protect, adminOnly } = require('../middleware/auth');

const parseRoom = (room) => {
  if (!room) return null;
  try { room.amenities = JSON.parse(room.amenities); } catch { room.amenities = []; }
  room.available = room.available === 1 || room.available === true;
  room._id = String(room.id);
  return room;
};

router.get('/', (req, res) => {
  try {
    const rooms = query.all('SELECT * FROM rooms ORDER BY id ASC');
    res.json(rooms.map(parseRoom));
  } catch (err) {
    console.error('Get rooms error:', err.message);
    res.status(500).json({ message: 'Failed to fetch rooms' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const room = query.get('SELECT * FROM rooms WHERE id = ?', [req.params.id]);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json(parseRoom(room));
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', protect, adminOnly, (req, res) => {
  try {
    const { title, description, price, image, amenities, capacity } = req.body;
    if (!title || !description || !price || !image) return res.status(400).json({ message: 'Required fields missing' });
    const result = query.run('INSERT INTO rooms (title,description,price,image,amenities,capacity) VALUES (?,?,?,?,?,?)',
      [title, description, price, image, JSON.stringify(amenities || []), capacity || 2]);
    const room = query.get('SELECT * FROM rooms WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json(parseRoom(room));
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', protect, adminOnly, (req, res) => {
  try {
    const { title, description, price, image, amenities, capacity, available } = req.body;
    query.run('UPDATE rooms SET title=?,description=?,price=?,image=?,amenities=?,capacity=?,available=? WHERE id=?',
      [title, description, price, image, JSON.stringify(amenities || []), capacity, available ? 1 : 0, req.params.id]);
    const room = query.get('SELECT * FROM rooms WHERE id = ?', [req.params.id]);
    res.json(parseRoom(room));
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', protect, adminOnly, (req, res) => {
  try {
    query.run('DELETE FROM rooms WHERE id = ?', [req.params.id]);
    res.json({ message: 'Room deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
