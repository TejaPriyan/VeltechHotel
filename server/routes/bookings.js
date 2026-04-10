const express = require('express');
const router = express.Router();
const { query } = require('../database');
const { protect } = require('../middleware/auth');

const fmt = (b) => {
  if (!b) return null;
  b._id = String(b.id);
  b.userId = b.user_id;
  b.fullName = b.full_name;
  b.checkInDate = b.check_in_date;
  b.checkOutDate = b.check_out_date;
  b.specialRequest = b.special_request;
  b.idProofType = b.id_proof_type;
  b.idProofNumber = b.id_proof_number;
  b.totalAmount = b.total_amount;
  b.bookingStatus = b.booking_status;
  b.createdAt = b.created_at;
  if (b.room_title) b.roomId = { _id: String(b.room_id), id: b.room_id, title: b.room_title, price: b.room_price, image: b.room_image };
  return b;
};

router.post('/', protect, (req, res) => {
  try {
    const { fullName, email, phone, roomId, checkInDate, checkOutDate, guests, specialRequest, idProofType, idProofNumber } = req.body;
    if (!fullName || !email || !phone || !roomId || !checkInDate || !checkOutDate || !idProofType || !idProofNumber)
      return res.status(400).json({ message: 'All required fields must be filled' });

    const room = query.get('SELECT * FROM rooms WHERE id = ?', [roomId]);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (!room.available) return res.status(400).json({ message: 'Room is not available' });

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    if (checkOut <= checkIn) return res.status(400).json({ message: 'Check-out must be after check-in' });

    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    const totalAmount = nights * room.price;

    const result = query.run(
      `INSERT INTO bookings (user_id,full_name,email,phone,room_id,check_in_date,check_out_date,guests,special_request,id_proof_type,id_proof_number,total_amount,booking_status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,'pending')`,
      [req.user.id, fullName, email, phone, roomId, checkInDate, checkOutDate, guests || 1, specialRequest || '', idProofType, idProofNumber, totalAmount]
    );

    const booking = fmt(query.get('SELECT * FROM bookings WHERE id = ?', [result.lastInsertRowid]));
    booking.roomId = { _id: String(room.id), title: room.title, price: room.price, image: room.image };
    res.status(201).json({ message: 'Booking confirmed!', booking });
  } catch (err) {
    console.error('Booking error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/my', protect, (req, res) => {
  try {
    const bookings = query.all(
      `SELECT b.*, r.title as room_title, r.price as room_price, r.image as room_image
       FROM bookings b LEFT JOIN rooms r ON b.room_id = r.id
       WHERE b.user_id = ? ORDER BY b.created_at DESC`,
      [req.user.id]
    );
    res.json(bookings.map(fmt));
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id/cancel', protect, (req, res) => {
  try {
    const booking = query.get('SELECT * FROM bookings WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.booking_status === 'checked-in' || booking.booking_status === 'checked-out')
      return res.status(400).json({ message: 'Cannot cancel this booking' });
    query.run("UPDATE bookings SET booking_status='cancelled' WHERE id=?", [req.params.id]);
    res.json({ message: 'Booking cancelled' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
