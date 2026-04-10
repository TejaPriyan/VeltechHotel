const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = process.env.NODE_ENV === 'production'
  ? '/data/veltech.db'
  : path.join(__dirname, 'veltech.db');

let db = null;

// Save DB to disk
const saveDb = () => {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
};

// Wrap sql.js to look like better-sqlite3 (synchronous API)
const initDb = async () => {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer',
      phone TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      price INTEGER NOT NULL,
      image TEXT NOT NULL,
      amenities TEXT DEFAULT '[]',
      capacity INTEGER DEFAULT 2,
      available INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      room_id INTEGER NOT NULL,
      check_in_date TEXT NOT NULL,
      check_out_date TEXT NOT NULL,
      guests INTEGER DEFAULT 1,
      special_request TEXT DEFAULT '',
      id_proof_type TEXT NOT NULL,
      id_proof_number TEXT NOT NULL,
      total_amount INTEGER NOT NULL,
      booking_status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed rooms
  const roomCount = db.exec('SELECT COUNT(*) as c FROM rooms')[0]?.values[0][0] || 0;
  if (roomCount === 0) {
    const rooms = [
      ['Deluxe Room', 'Spacious and elegant with premium comfort, king-size bed, and city views.', 3999, '/hotel1.png', JSON.stringify(['King Bed', 'Free WiFi', 'AC', 'TV', 'Mini Bar']), 2],
      ['Executive Suite', 'Designed for business travelers and families with a separate living area.', 5499, '/hotel2.jpg', JSON.stringify(['King Bed', 'Free WiFi', 'AC', 'TV', 'Work Desk', 'Lounge Area']), 3],
      ['Premium Suite', 'Luxury with breathtaking views, king-size bed, and premium bath amenities.', 7499, '/hotel3.jpg', JSON.stringify(['King Bed', 'Free WiFi', 'AC', 'Smart TV', 'Jacuzzi', 'Balcony']), 2],
      ['Family Room', 'Perfect for family vacations with extra beds and spacious layout.', 4999, '/hotel4.jpeg', JSON.stringify(['2 Queen Beds', 'Free WiFi', 'AC', 'TV', 'Kids Area']), 4],
      ['Luxury Suite', 'Top-tier comfort, elegance, and modern decor with panoramic views.', 9999, '/hotel5.jpeg', JSON.stringify(['King Bed', 'Free WiFi', 'AC', 'Smart TV', 'Private Pool', 'Butler Service']), 2],
      ['Standard Room', 'Affordable comfort with all essential amenities for a pleasant stay.', 2499, '/hotel6.jpeg', JSON.stringify(['Queen Bed', 'Free WiFi', 'AC', 'TV']), 2],
      ['Royal Suite', 'Elegant interiors, exclusive private facilities, and royal treatment.', 12999, '/hotel7.jpeg', JSON.stringify(['King Bed', 'Free WiFi', 'AC', 'Smart TV', 'Private Terrace', 'Spa Access', 'Butler Service']), 2],
    ];
    rooms.forEach(r => db.run('INSERT INTO rooms (title,description,price,image,amenities,capacity) VALUES (?,?,?,?,?,?)', r));
    console.log('✅ Rooms seeded');
  }

  // Seed admin
  const adminRows = db.exec("SELECT id FROM users WHERE email='admin@veltechhotel.com'");
  if (!adminRows.length || !adminRows[0].values.length) {
    const hashed = bcrypt.hashSync('admin123', 12);
    db.run("INSERT INTO users (name,email,password,role) VALUES (?,?,?,'admin')", ['Admin', 'admin@veltechhotel.com', hashed]);
    console.log('✅ Admin seeded: admin@veltechhotel.com / admin123');
  }

  saveDb();
  console.log('✅ SQLite database ready');
  return db;
};

// Synchronous query helpers (sql.js is sync internally, we wrap for convenience)
const query = {
  // Returns array of row objects
  all: (sql, params = []) => {
    const result = db.exec(sql, params);
    if (!result.length) return [];
    const { columns, values } = result[0];
    return values.map(row => {
      const obj = {};
      columns.forEach((col, i) => obj[col] = row[i]);
      return obj;
    });
  },
  // Returns single row object or null
  get: (sql, params = []) => {
    const rows = query.all(sql, params);
    return rows[0] || null;
  },
  // Runs INSERT/UPDATE/DELETE, returns { lastInsertRowid, changes }
  run: (sql, params = []) => {
    db.run(sql, params);
    const lastId = db.exec('SELECT last_insert_rowid() as id')[0]?.values[0][0];
    saveDb();
    return { lastInsertRowid: lastId };
  }
};

module.exports = { initDb, query, saveDb };
