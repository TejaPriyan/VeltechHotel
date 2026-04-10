const express = require('express');
const router = express.Router();
const { query } = require('../database');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

const fmt = (b) => {
  if (!b) return null;
  b._id = String(b.id);
  b.fullName = b.full_name;
  b.checkInDate = b.check_in_date;
  b.checkOutDate = b.check_out_date;
  b.totalAmount = b.total_amount;
  b.bookingStatus = b.booking_status;
  b.createdAt = b.created_at;
  b.idProofType = b.id_proof_type;
  b.idProofNumber = b.id_proof_number;
  if (b.room_title) b.roomId = { _id: String(b.room_id), title: b.room_title, price: b.room_price, image: b.room_image };
  if (b.user_name) b.userId = { _id: String(b.user_id), name: b.user_name, email: b.user_email };
  return b;
};

router.get('/stats', (req, res) => {
  try {
    const totalUsers = query.get("SELECT COUNT(*) as c FROM users WHERE role='customer'").c;
    const totalBookings = query.get('SELECT COUNT(*) as c FROM bookings').c;
    const totalRooms = query.get('SELECT COUNT(*) as c FROM rooms').c;
    const rev = query.get("SELECT SUM(total_amount) as total FROM bookings WHERE booking_status IN ('confirmed','checked-in','checked-out')");
    const totalRevenue = rev?.total || 0;
    const statusCounts = query.all("SELECT booking_status as _id, COUNT(*) as count FROM bookings GROUP BY booking_status");
    res.json({ totalUsers, totalBookings, totalRooms, totalRevenue, statusCounts });
  } catch (err) {
    console.error('Stats error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/users', (req, res) => {
  try {
    const users = query.all("SELECT id, name, email, role, phone, created_at as createdAt FROM users WHERE role='customer' ORDER BY created_at DESC");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/bookings', (req, res) => {
  try {
    const { search, status } = req.query;
    let sql = `SELECT b.*, r.title as room_title, r.price as room_price, r.image as room_image,
                u.name as user_name, u.email as user_email
               FROM bookings b
               LEFT JOIN rooms r ON b.room_id = r.id
               LEFT JOIN users u ON b.user_id = u.id`;
    const params = [];
    if (status) { sql += ' WHERE b.booking_status = ?'; params.push(status); }
    sql += ' ORDER BY b.created_at DESC';

    let bookings = query.all(sql, params).map(fmt);
    if (search) {
      const s = search.toLowerCase();
      bookings = bookings.filter(b =>
        (b.fullName || '').toLowerCase().includes(s) ||
        (b.email || '').toLowerCase().includes(s) ||
        (b.roomId?.title || '').toLowerCase().includes(s)
      );
    }
    res.json(bookings);
  } catch (err) {
    console.error('Admin bookings error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/bookings/:id/status', (req, res) => {
  try {
    const { bookingStatus } = req.body;
    const valid = ['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled'];
    if (!valid.includes(bookingStatus)) return res.status(400).json({ message: 'Invalid status' });
    query.run('UPDATE bookings SET booking_status=? WHERE id=?', [bookingStatus, req.params.id]);
    const b = query.get(`SELECT b.*, r.title as room_title, r.price as room_price, r.image as room_image,
      u.name as user_name, u.email as user_email FROM bookings b
      LEFT JOIN rooms r ON b.room_id=r.id LEFT JOIN users u ON b.user_id=u.id WHERE b.id=?`, [req.params.id]);
    res.json(fmt(b));
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/rooms/:id/availability', (req, res) => {
  try {
    const room = query.get('SELECT * FROM rooms WHERE id=?', [req.params.id]);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    const newVal = room.available ? 0 : 1;
    query.run('UPDATE rooms SET available=? WHERE id=?', [newVal, req.params.id]);
    res.json({ ...room, available: newVal === 1, _id: String(room.id) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/rooms', (req, res) => {
  try {
    const { title, description, price, image, amenities, capacity } = req.body;
    if (!title || !description || !price || !image) return res.status(400).json({ message: 'Required fields missing' });
    const result = query.run('INSERT INTO rooms (title,description,price,image,amenities,capacity) VALUES (?,?,?,?,?,?)',
      [title, description, price, image, JSON.stringify(amenities || []), capacity || 2]);
    const room = query.get('SELECT * FROM rooms WHERE id=?', [result.lastInsertRowid]);
    try { room.amenities = JSON.parse(room.amenities); } catch { room.amenities = []; }
    room._id = String(room.id);
    res.status(201).json(room);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/rooms/:id', (req, res) => {
  try {
    const { title, description, price, image, amenities, capacity, available } = req.body;
    query.run('UPDATE rooms SET title=?,description=?,price=?,image=?,amenities=?,capacity=?,available=? WHERE id=?',
      [title, description, price, image, JSON.stringify(amenities || []), capacity, available ? 1 : 0, req.params.id]);
    const room = query.get('SELECT * FROM rooms WHERE id=?', [req.params.id]);
    try { room.amenities = JSON.parse(room.amenities); } catch { room.amenities = []; }
    room._id = String(room.id);
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/rooms/:id', (req, res) => {
  try {
    query.run('DELETE FROM rooms WHERE id=?', [req.params.id]);
    res.json({ message: 'Room deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
