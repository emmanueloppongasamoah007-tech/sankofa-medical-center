/**
 * auth.js — Navbar session state for Sankofa Medical Center
 * When logged in: shows a welcome widget with user name, role badge, and logout.
 * When logged out: shows a Login link.
 */
(function () {
  'use strict';

  function updateNav() {
    const area = document.getElementById('nav-user-area');
    if (!area) return;

    const user = JSON.parse(localStorage.getItem('sm_loggedInUser') || 'null');

    if (user) {
      // First name only for brevity
      const firstName = user.name ? user.name.split(' ')[0] : user.name;

      area.innerHTML = `
        <div class="nav-user">
          <div class="nav-user-info">
            <span class="nav-user-name">Welcome, ${firstName}</span>
            <span class="nav-user-role">Client</span>
          </div>
          <button class="nav-user-logout" id="nav-logout-btn" aria-label="Logout">Logout</button>
        </div>
      `;

      document.getElementById('nav-logout-btn').addEventListener('click', function () {
        localStorage.removeItem('sm_loggedInUser');
        window.location.href = 'login.html';
      });

    } else {
      area.innerHTML = `<a href="login.html" class="nav-auth">Login</a>`;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateNav);
  } else {
    updateNav();
  }
})();
