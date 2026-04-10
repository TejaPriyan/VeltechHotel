// ===== VELTECH HOTEL - SHARED UTILITIES =====
const API = '/api';

// Auth helpers
const getToken = () => localStorage.getItem('vt_token');
const getUser = () => { try { return JSON.parse(localStorage.getItem('vt_user')); } catch { return null; } };
const setAuth = (token, user) => { localStorage.setItem('vt_token', token); localStorage.setItem('vt_user', JSON.stringify(user)); };
const clearAuth = () => { localStorage.removeItem('vt_token'); localStorage.removeItem('vt_user'); };
const isLoggedIn = () => !!getToken();
const isAdmin = () => { const u = getUser(); return u && u.role === 'admin'; };

// API fetch wrapper
const apiFetch = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers };
  const res = await fetch(`${API}${endpoint}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};

// Toast notifications
const showToast = (message, type = 'info') => {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(100%)'; toast.style.transition = 'all 0.3s'; setTimeout(() => toast.remove(), 300); }, 3500);
};

// Format currency
const formatCurrency = (amount) => `₹${amount.toLocaleString('en-IN')}`;

// Format date
const formatDate = (date) => new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

// Navbar setup
const setupNavbar = () => {
  const user = getUser();
  const navLinks = document.getElementById('nav-links');
  if (!navLinks) return;

  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  let links = `
    <li><a href="/rooms" class="${currentPage === 'rooms.html' ? 'active' : ''}">Rooms</a></li>
    <li><a href="/#amenities">Amenities</a></li>
    <li><a href="/#contact">Contact</a></li>
  `;

  if (user) {
    links += `<li><a href="/profile">My Bookings</a></li>`;
    if (user.role === 'admin') links += `<li><a href="/admin">Admin</a></li>`;
    links += `<li><a href="#" onclick="logout()" class="btn-nav">Logout</a></li>`;
  } else {
    links += `<li><a href="/login">Login</a></li>`;
    links += `<li><a href="/signup" class="btn-nav">Sign Up</a></li>`;
  }

  navLinks.innerHTML = links;

  // Scroll effect
  window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 50);
  });

  // Hamburger
  const hamburger = document.getElementById('hamburger');
  if (hamburger) {
    hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
  }
};

// Logout
const logout = () => {
  clearAuth();
  showToast('Logged out successfully', 'info');
  setTimeout(() => window.location.href = '/', 800);
};

// Redirect if not logged in
const requireAuth = () => {
  if (!isLoggedIn()) { window.location.href = '/login'; return false; }
  return true;
};

// Redirect if not admin
const requireAdmin = () => {
  if (!isLoggedIn() || !isAdmin()) { window.location.href = '/'; return false; }
  return true;
};

// Navbar HTML template
const navbarHTML = () => `
<nav class="navbar" id="navbar">
  <a href="/" class="nav-brand">
    <div>
      <span class="brand-name">VELTECH</span>
      <span class="brand-sub">Hotel & Suites</span>
    </div>
  </a>
  <ul class="nav-links" id="nav-links"></ul>
  <div class="hamburger" id="hamburger">
    <span></span><span></span><span></span>
  </div>
</nav>
`;

// Footer HTML template
const footerHTML = () => `
<footer class="footer">
  <div class="footer-grid">
    <div class="footer-brand">
      <div class="brand-name">VELTECH HOTEL</div>
      <p>Experience the pinnacle of luxury and comfort. Where every stay becomes an unforgettable memory.</p>
      <p style="color: var(--text-muted); font-size:0.85rem;">📞 +91 7981404021</p>
    </div>
    <div class="footer-col">
      <h4>Quick Links</h4>
      <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/rooms">Rooms</a></li>
        <li><a href="/booking">Book Now</a></li>
        <li><a href="/profile">My Bookings</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h4>Amenities</h4>
      <ul>
        <li><a href="#">Swimming Pool</a></li>
        <li><a href="#">Spa & Wellness</a></li>
        <li><a href="#">Fine Dining</a></li>
        <li><a href="#">Fitness Center</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h4>Contact</h4>
      <ul>
        <li><a href="#">Chennai, Tamil Nadu</a></li>
        <li><a href="#">+91 7981404021</a></li>
        <li><a href="#">info@veltechhotel.com</a></li>
      </ul>
    </div>
  </div>
  <div class="footer-bottom">
    <span>© 2025 VELTECH Hotel. All rights reserved.</span>
    <span>Designed by Teja Priyan</span>
  </div>
</footer>
`;
