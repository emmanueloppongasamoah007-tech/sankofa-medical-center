/* ============================================================
   admin.js — Admin Dashboard Logic (Login, View, Cancel)
   Hospital Booking System
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ------------------------------------------------------------------
     1. Constants & Credential config (hardcoded as specified)
  ------------------------------------------------------------------ */
  const ADMIN_USER = 'admin';
  const ADMIN_PASS = 'admin123';
  const SESSION_KEY = 'hb_admin_session'; // sessionStorage key

  /* ------------------------------------------------------------------
     2. Element references
  ------------------------------------------------------------------ */
  const loginScreen    = document.getElementById('login-screen');
  const dashScreen     = document.getElementById('dashboard-screen');
  const loginForm      = document.getElementById('login-form');
  const loginError     = document.getElementById('login-error');
  const logoutBtn      = document.getElementById('logout-btn');
  const clearAllBtn    = document.getElementById('clear-all-btn');

  // Stats
  const statTotal      = document.getElementById('stat-total');
  const statToday      = document.getElementById('stat-today');
  const statDepts      = document.getElementById('stat-depts');
  const statUpcoming   = document.getElementById('stat-upcoming');

  // Table
  const tableBody      = document.getElementById('table-body');
  const tableCount     = document.getElementById('table-count');
  const searchInput    = document.getElementById('search-input');
  const deptFilter     = document.getElementById('dept-filter');

  // Topbar clock
  const topbarTime     = document.getElementById('topbar-time');

  /* ------------------------------------------------------------------
     3. Auth — check session on page load
  ------------------------------------------------------------------ */
  function isLoggedIn() {
    return sessionStorage.getItem(SESSION_KEY) === 'true';
  }

  function showDashboard() {
    loginScreen.style.display  = 'none';
    dashScreen.style.display   = 'block';
    loadDashboard();
  }

  function showLogin() {
    loginScreen.style.display  = 'flex';
    dashScreen.style.display   = 'none';
  }

  // Restore session if user refreshes
  if (isLoggedIn()) {
    showDashboard();
  } else {
    showLogin();
  }

  /* ------------------------------------------------------------------
     4. Login form handler
  ------------------------------------------------------------------ */
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const usernameVal = document.getElementById('admin-username').value.trim();
      const passwordVal = document.getElementById('admin-password').value;

      if (usernameVal === ADMIN_USER && passwordVal === ADMIN_PASS) {
        // Save session and show dashboard
        sessionStorage.setItem(SESSION_KEY, 'true');
        loginError.style.display = 'none';
        showDashboard();
      } else {
        // Show error feedback
        loginError.style.display = 'flex';
        // Shake animation on the card
        const card = document.querySelector('.login-card');
        card.style.animation = 'shake 0.5s ease';
        setTimeout(() => card.style.animation = '', 500);
        // Clear password field for security
        document.getElementById('admin-password').value = '';
      }
    });
  }

  /* ------------------------------------------------------------------
     5. Logout handler
  ------------------------------------------------------------------ */
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem(SESSION_KEY);
      showLogin();
      // Reset login form
      if (loginForm) loginForm.reset();
    });
  }

  /* ------------------------------------------------------------------
     6. Load / refresh dashboard
  ------------------------------------------------------------------ */
  function loadDashboard() {
    const appointments = getAppointments();
    updateStats(appointments);
    populateDeptFilter(appointments);
    renderTable(appointments);
    startClock();
  }

  /* ------------------------------------------------------------------
     7. Retrieve appointments from localStorage
  ------------------------------------------------------------------ */
  function getAppointments() {
    return JSON.parse(localStorage.getItem('hb_appointments') || '[]');
  }

  function saveAppointments(data) {
    localStorage.setItem('hb_appointments', JSON.stringify(data));
  }

  /* ------------------------------------------------------------------
     8. Stats calculation
  ------------------------------------------------------------------ */
  function updateStats(appointments) {
    const todayStr = getTodayString();

    // Total count
    const total = appointments.length;

    // Today's appointments
    const todayCount = appointments.filter(a => a.date === todayStr).length;

    // Unique departments used
    const depts = new Set(appointments.map(a => a.department)).size;

    // Upcoming (from today onwards)
    const todayObj = new Date(todayStr + 'T00:00:00');
    const upcoming = appointments.filter(a => new Date(a.date + 'T00:00:00') >= todayObj).length;

    // Update DOM
    animateCount(statTotal,    total);
    animateCount(statToday,    todayCount);
    animateCount(statDepts,    depts);
    animateCount(statUpcoming, upcoming);
  }

  /**
   * Animate a counter from 0 to target value.
   */
  function animateCount(el, target) {
    if (!el) return;
    let start = 0;
    const duration = 600;
    const step = Math.ceil(target / (duration / 16));
    const interval = setInterval(() => {
      start = Math.min(start + step, target);
      el.textContent = start;
      if (start >= target) clearInterval(interval);
    }, 16);
  }

  /* ------------------------------------------------------------------
     9. Populate department filter dropdown
  ------------------------------------------------------------------ */
  function populateDeptFilter(appointments) {
    if (!deptFilter) return;
    const existing = Array.from(deptFilter.options).map(o => o.value);
    const depts = [...new Set(appointments.map(a => a.department))];

    depts.forEach(d => {
      if (!existing.includes(d)) {
        const opt = document.createElement('option');
        opt.value = d;
        opt.textContent = appointments.find(a => a.department === d)?.departmentLabel || d;
        deptFilter.appendChild(opt);
      }
    });
  }

  /* ------------------------------------------------------------------
     10. Render appointments table
  ------------------------------------------------------------------ */
  function renderTable(appointments) {
    if (!tableBody) return;

    // Apply search filter
    const query   = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const deptVal = deptFilter  ? deptFilter.value                        : '';

    let filtered = appointments.filter(a => {
      const matchSearch = !query || [
        a.fullName, a.email, a.phone, a.departmentLabel, a.date
      ].some(v => v?.toLowerCase().includes(query));

      const matchDept = !deptVal || a.department === deptVal;

      return matchSearch && matchDept;
    });

    // Sort by date descending (newest first)
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Update count label
    if (tableCount) {
      tableCount.textContent = `Showing ${filtered.length} of ${appointments.length} appointment${appointments.length !== 1 ? 's' : ''}`;
    }

    tableBody.innerHTML = '';

    if (filtered.length === 0) {
      // Empty state row
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="padding:0; border:none;">
            <div class="empty-state">
              <div class="empty-icon">📋</div>
              <h4>${query || deptVal ? 'No matching appointments found' : 'No appointments yet'}</h4>
              <p>${query || deptVal ? 'Try adjusting your search or filter.' : 'Booked appointments will appear here.'}</p>
            </div>
          </td>
        </tr>`;
      return;
    }

    const todayStr = getTodayString();

    filtered.forEach(appt => {
      const isToday = appt.date === todayStr;
      const row = document.createElement('tr');

      row.innerHTML = `
        <td><strong>${escapeHTML(appt.fullName)}</strong><br>
            <small style="color:var(--text-light);font-size:0.78rem;">${escapeHTML(appt.ref || '')}</small>
        </td>
        <td>${escapeHTML(appt.email)}</td>
        <td>${escapeHTML(appt.phone)}</td>
        <td><span class="dept-badge">${escapeHTML(appt.departmentLabel || appt.department)}</span></td>
        <td>
          ${escapeHTML(formatDate(appt.date))}
          ${isToday ? '<span class="today-badge">📅 Today</span>' : ''}
        </td>
        <td>${escapeHTML(formatTime(appt.time))}</td>
        <td>
          <button
            class="btn btn-danger"
            data-id="${appt.id}"
            title="Cancel this appointment"
            aria-label="Cancel appointment for ${escapeHTML(appt.fullName)}"
          >🗑 Cancel</button>
        </td>`;

      tableBody.appendChild(row);
    });

    // Attach cancel button listeners
    tableBody.querySelectorAll('.btn-danger[data-id]').forEach(btn => {
      btn.addEventListener('click', handleCancel);
    });
  }

  /* ------------------------------------------------------------------
     11. Cancel (delete) an appointment
  ------------------------------------------------------------------ */
  function handleCancel(e) {
    const id       = Number(e.currentTarget.dataset.id);
    const appts    = getAppointments();
    const target   = appts.find(a => a.id === id);

    if (!target) return;

    // Confirm before deleting
    const confirmed = confirm(
      `Are you sure you want to cancel the appointment for:\n\n` +
      `${target.fullName}\n${formatDate(target.date)} at ${formatTime(target.time)}\n\n` +
      `This action cannot be undone.`
    );

    if (!confirmed) return;

    const updated = appts.filter(a => a.id !== id);
    saveAppointments(updated);
    loadDashboard(); // Re-render everything
  }

  /* ------------------------------------------------------------------
     12. Clear all appointments
  ------------------------------------------------------------------ */
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', () => {
      const appts = getAppointments();
      if (appts.length === 0) {
        alert('There are no appointments to clear.');
        return;
      }

      const confirmed = confirm(
        `⚠️ Are you sure you want to delete ALL ${appts.length} appointment(s)?\n\nThis cannot be undone.`
      );

      if (!confirmed) return;

      localStorage.removeItem('hb_appointments');
      loadDashboard();
    });
  }

  /* ------------------------------------------------------------------
     13. Search & Filter — live re-render
  ------------------------------------------------------------------ */
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderTable(getAppointments());
    });
  }

  if (deptFilter) {
    deptFilter.addEventListener('change', () => {
      renderTable(getAppointments());
    });
  }

  /* ------------------------------------------------------------------
     14. Live clock in topbar
  ------------------------------------------------------------------ */
  function startClock() {
    if (!topbarTime) return;

    function tick() {
      const now = new Date();
      topbarTime.textContent = now.toLocaleString('en-US', {
        weekday: 'short',
        month:   'short',
        day:     'numeric',
        hour:    '2-digit',
        minute:  '2-digit',
      });
    }

    tick();
    setInterval(tick, 1000);
  }

  /* ------------------------------------------------------------------
     15. Utility helpers (local copies so admin page is self-contained
         even if loaded without validation.js — though it is linked)
  ------------------------------------------------------------------ */
  function getTodayString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function formatTime(timeStr) {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
  }

  /** Escape HTML to prevent XSS when rendering user-supplied data */
  function escapeHTML(str) {
    if (typeof str !== 'string') return str ?? '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

});

/* ------------------------------------------------------------------
   CSS shake keyframe (injected via JS for self-containment)
------------------------------------------------------------------ */
(function injectShake() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%       { transform: translateX(-10px); }
      40%       { transform: translateX(10px); }
      60%       { transform: translateX(-6px); }
      80%       { transform: translateX(6px); }
    }
  `;
  document.head.appendChild(style);
})();
