# VELTECH Hotel — Full Stack Hotel Management System

## Tech Stack
- Frontend: HTML, CSS, JavaScript
- Backend: Node.js + Express
- Database: MongoDB + Mongoose
- Auth: JWT + bcrypt

## How to Run

### 1. Make sure MongoDB is running locally (port 27017)

### 2. Install dependencies
Open a terminal in the `server` folder:
```
npm install
```

### 3. Create admin account (run once)
```
node utils/createAdmin.js
```
Admin login: `admin@veltechhotel.com` / `admin123`

### 4. Start the server
```
npm start
```
or with auto-reload:
```
npm run dev
```

### 5. Open browser
`http://localhost:5000`

## Pages
- `/` — Homepage
- `/rooms` — Room listing with filters
- `/booking` — Book a room
- `/login` — Login
- `/signup` — Sign up
- `/welcome` — Post-signup welcome
- `/profile` — My bookings
- `/admin` — Admin dashboard (admin only)
