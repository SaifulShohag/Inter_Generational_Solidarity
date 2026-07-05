const TOKEN_KEY = 'vfa_token';
const ROLE_KEY  = 'vfa_role';

function go(role) {
  // If already logged in with this role, skip auth
  const token = localStorage.getItem(TOKEN_KEY);
  const saved  = localStorage.getItem(ROLE_KEY);
  if (token && saved === role) {
    window.location.href = role === 'volunteer' ? '/volunteer-dashboard.html' : '/elderly-home.html';
    return;
  }
  window.location.href = `/login.html?role=${role}`;
}
