// ===== VELTECH HOTEL - ADMIN DASHBOARD JS =====

if (!requireAdmin()) { /* redirect handled */ }

const user = getUser();
if (user) document.getElementById('adminBadge').textContent = user.name;

// Tab navigation
document.querySelectorAll('.sidebar-link[data-tab]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const tab = link.dataset.tab;
    switchTab(tab);
  });
});

function switchTab(tab) {
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  document.getElementById(`tab-${tab}`).classList.add('active');
  const titles = { dashboard: 'Dashboard', bookings: 'Bookings', rooms: 'Room Management', users: 'Users' };
  document.getElementById('pageTitle').textContent = titles[tab] || tab;

  if (tab === 'bookings') loadBookings();
  else if (tab === 'rooms') loadAdminRooms();
  else if (tab === 'users') loadUsers();
}

function toggleSidebar() {
  document.getElementById('adminSidebar').classList.toggle('open');
}

// ===== DASHBOARD =====
async function loadDashboard() {
  try {
    const stats = await apiFetch('/admin/stats');
    document.getElementById('statUsers').textContent = stats.totalUsers;
    document.getElementById('statBookings').textContent = stats.totalBookings;
    document.getElementById('statRooms').textContent = stats.totalRooms;
    document.getElementById('statRevenue').textContent = formatCurrency(stats.totalRevenue);

    // Status chart
    const statusColors = { pending: '#fbbf24', confirmed: '#6ee7b7', 'checked-in': '#93c5fd', 'checked-out': '#c4b5fd', cancelled: '#fca5a5' };
    const total = stats.statusCounts.reduce((s, c) => s + c.count, 0) || 1;
    const chartEl = document.getElementById('statusChart');
    chartEl.className = 'status-chart';
    chartEl.innerHTML = stats.statusCounts.length ? stats.statusCounts.map(s => `
      <div class="status-bar-item">
        <div class="status-bar-label">
          <span style="text-transform:capitalize">${s._id}</span>
          <span>${s.count}</span>
        </div>
        <div class="status-bar-track">
          <div class="status-bar-fill" style="width:${(s.count/total*100).toFixed(1)}%; background:${statusColors[s._id] || '#888'}"></div>
        </div>
      </div>
    `).join('') : '<p style="color:var(--text-muted); padding:20px; font-size:0.88rem;">No booking data yet</p>';

    // Recent bookings
    const bookings = await apiFetch('/admin/bookings');
    const recent = bookings.slice(0, 5);
    const recentEl = document.getElementById('recentBookings');
    recentEl.style.padding = '0 24px 16px';
    recentEl.innerHTML = recent.length ? recent.map(b => `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid rgba(255,255,255,0.04);">
        <div>
          <div style="font-size:0.9rem; color:var(--white); font-weight:500;">${b.fullName}</div>
          <div style="font-size:0.78rem; color:var(--text-muted);">${b.roomId?.title || 'Room'} · ${formatDate(b.checkInDate)}</div>
        </div>
        <span class="badge badge-${b.bookingStatus}">${b.bookingStatus}</span>
      </div>
    `).join('') : '<p style="color:var(--text-muted); padding:20px 0; font-size:0.88rem;">No bookings yet</p>';
  } catch (err) {
    showToast('Failed to load dashboard', 'error');
  }
}

// ===== BOOKINGS =====
let allBookings = [];

async function loadBookings() {
  try {
    allBookings = await apiFetch('/admin/bookings');
    renderBookings(allBookings);
  } catch (err) {
    showToast('Failed to load bookings', 'error');
  }
}

function renderBookings(bookings) {
  const tbody = document.getElementById('bookingsBody');
  if (!bookings.length) {
    tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">📋</div><h3>No bookings found</h3></div></td></tr>';
    return;
  }
  tbody.innerHTML = bookings.map(b => `
    <tr>
      <td>
        <div class="table-guest-name">${b.fullName}</div>
        <div class="table-guest-email">${b.email}</div>
      </td>
      <td>${b.roomId?.title || '—'}</td>
      <td>${formatDate(b.checkInDate)}</td>
      <td>${formatDate(b.checkOutDate)}</td>
      <td style="color:var(--gold); font-weight:600;">${formatCurrency(b.totalAmount)}</td>
      <td><span class="badge badge-${b.bookingStatus}">${b.bookingStatus}</span></td>
      <td>
        <select class="admin-select" style="font-size:0.78rem; padding:6px 10px;" onchange="updateStatus('${b._id}', this.value)">
          <option value="">Update</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="checked-in">Checked In</option>
          <option value="checked-out">Checked Out</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </td>
    </tr>
  `).join('');
}

function filterBookings() {
  const search = document.getElementById('bookingSearch').value.toLowerCase();
  const status = document.getElementById('bookingStatusFilter').value;
  let filtered = allBookings;
  if (status) filtered = filtered.filter(b => b.bookingStatus === status);
  if (search) filtered = filtered.filter(b =>
    b.fullName.toLowerCase().includes(search) ||
    b.email.toLowerCase().includes(search) ||
    (b.roomId?.title || '').toLowerCase().includes(search)
  );
  renderBookings(filtered);
}

async function updateStatus(id, status) {
  if (!status) return;
  try {
    await apiFetch(`/admin/bookings/${id}/status`, { method: 'PUT', body: JSON.stringify({ bookingStatus: status }) });
    showToast(`Status updated to ${status}`, 'success');
    loadBookings();
    loadDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ===== ROOMS =====
let adminRooms = [];

async function loadAdminRooms() {
  try {
    adminRooms = await apiFetch('/rooms');
    const tbody = document.getElementById('roomsBody');
    tbody.innerHTML = adminRooms.map(r => `
      <tr>
        <td><img src="${r.image}" alt="${r.title}" class="table-room-img"></td>
        <td>
          <div style="font-weight:500; color:var(--white);">${r.title}</div>
          <div style="font-size:0.78rem; color:var(--text-muted);">Capacity: ${r.capacity}</div>
        </td>
        <td style="color:var(--gold); font-weight:600;">${formatCurrency(r.price)}</td>
        <td>${r.capacity} guests</td>
        <td><span class="badge ${r.available ? 'badge-available' : 'badge-unavailable'}">${r.available ? 'Available' : 'Unavailable'}</span></td>
        <td>
          <div style="display:flex; gap:8px;">
            <button class="btn btn-ghost btn-sm" onclick="editRoom('${r._id}')">Edit</button>
            <button class="btn btn-ghost btn-sm" onclick="toggleAvailability('${r._id}')">${r.available ? 'Disable' : 'Enable'}</button>
            <button class="btn btn-danger btn-sm" onclick="deleteRoom('${r._id}')">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    showToast('Failed to load rooms', 'error');
  }
}

function openRoomModal(roomId) {
  document.getElementById('roomModal').classList.add('open');
  document.getElementById('roomForm').reset();
  document.getElementById('roomEditId').value = '';
  document.getElementById('modalTitle').textContent = 'Add New Room';
  document.getElementById('roomSubmitBtn').textContent = 'Add Room';
}

function closeRoomModal(e) {
  if (e && e.target !== document.getElementById('roomModal')) return;
  document.getElementById('roomModal').classList.remove('open');
}

function editRoom(id) {
  const room = adminRooms.find(r => r._id === id);
  if (!room) return;
  document.getElementById('roomEditId').value = id;
  document.getElementById('rTitle').value = room.title;
  document.getElementById('rPrice').value = room.price;
  document.getElementById('rDesc').value = room.description;
  document.getElementById('rImage').value = room.image;
  document.getElementById('rCapacity').value = room.capacity;
  document.getElementById('rAmenities').value = room.amenities.join(', ');
  document.getElementById('modalTitle').textContent = 'Edit Room';
  document.getElementById('roomSubmitBtn').textContent = 'Save Changes';
  document.getElementById('roomModal').classList.add('open');
}

document.getElementById('roomForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const editId = document.getElementById('roomEditId').value;
  const btn = document.getElementById('roomSubmitBtn');
  btn.innerHTML = '<span class="spinner"></span>';
  btn.disabled = true;

  const payload = {
    title: document.getElementById('rTitle').value.trim(),
    price: parseInt(document.getElementById('rPrice').value),
    description: document.getElementById('rDesc').value.trim(),
    image: document.getElementById('rImage').value.trim(),
    capacity: parseInt(document.getElementById('rCapacity').value),
    amenities: document.getElementById('rAmenities').value.split(',').map(a => a.trim()).filter(Boolean)
  };

  try {
    if (editId) {
      await apiFetch(`/admin/rooms/${editId}`, { method: 'PUT', body: JSON.stringify(payload) });
      showToast('Room updated', 'success');
    } else {
      await apiFetch('/admin/rooms', { method: 'POST', body: JSON.stringify(payload) });
      showToast('Room added', 'success');
    }
    document.getElementById('roomModal').classList.remove('open');
    loadAdminRooms();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.innerHTML = editId ? 'Save Changes' : 'Add Room';
    btn.disabled = false;
  }
});

async function toggleAvailability(id) {
  try {
    await apiFetch(`/admin/rooms/${id}/availability`, { method: 'PUT' });
    showToast('Room availability updated', 'success');
    loadAdminRooms();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteRoom(id) {
  if (!confirm('Delete this room? This cannot be undone.')) return;
  try {
    await apiFetch(`/admin/rooms/${id}`, { method: 'DELETE' });
    showToast('Room deleted', 'success');
    loadAdminRooms();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ===== USERS =====
async function loadUsers() {
  try {
    const users = await apiFetch('/admin/users');
    const tbody = document.getElementById('usersBody');
    tbody.innerHTML = users.length ? users.map(u => `
      <tr>
        <td>
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="width:34px; height:34px; border-radius:50%; background:var(--gold); display:flex; align-items:center; justify-content:center; font-weight:700; color:var(--dark); font-size:0.9rem; flex-shrink:0;">${u.name.charAt(0).toUpperCase()}</div>
            <span style="color:var(--white); font-weight:500;">${u.name}</span>
          </div>
        </td>
        <td style="color:var(--text-muted);">${u.email}</td>
        <td><span class="badge badge-confirmed">${u.role}</span></td>
        <td style="color:var(--text-muted);">${formatDate(u.createdAt)}</td>
      </tr>
    `).join('') : '<tr><td colspan="4"><div class="empty-state"><div class="empty-icon">👥</div><h3>No users yet</h3></div></td></tr>';
  } catch (err) {
    showToast('Failed to load users', 'error');
  }
}

// Init
loadDashboard();
