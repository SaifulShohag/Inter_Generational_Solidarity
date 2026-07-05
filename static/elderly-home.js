const TOKEN_KEY = 'vfa_token';
const ROLE_KEY  = 'vfa_role';
const USER_KEY  = 'vfa_api_user';

(function init() {
  const token = localStorage.getItem(TOKEN_KEY);
  const role  = localStorage.getItem(ROLE_KEY);
  if (!token || role !== 'elderly') {
    window.location.href = '/index.html';
    return;
  }

  // Greeting
  const user     = JSON.parse(localStorage.getItem(USER_KEY) || '{}');
  const name     = (user.name || '').split(' ')[0];
  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
  document.getElementById('greeting').textContent = `${greeting}, ${name} ! 👋`;

  // Logout (top bar button + bottom nav link)
  function logout(e) {
    e.preventDefault();
    ['vfa_token','vfa_role','vfa_api_user','vfa_session_id'].forEach(k => localStorage.removeItem(k));
    window.location.href = '/index.html';
  }
  document.getElementById('logout-btn').addEventListener('click', logout);
  document.getElementById('logout-link').addEventListener('click', logout);

  document.getElementById('delete-account-btn').addEventListener('click', async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible et supprimera toutes vos données.')) return;
    const t = localStorage.getItem('vfa_token');
    const res = await fetch(`${window.location.origin}/auth/me`, { method: 'DELETE', headers: { Authorization: `Bearer ${t}` } });
    if (res.ok) {
      ['vfa_token','vfa_role','vfa_api_user','vfa_session_id'].forEach(k => localStorage.removeItem(k));
      window.location.href = '/index.html';
    } else {
      alert('Impossible de supprimer le compte. Veuillez réessayer.');
    }
  });
})();
