const API   = window.location.origin;
const TOKEN_KEY   = 'vfa_token';
const ROLE_KEY    = 'vfa_role';
const USER_KEY    = 'vfa_api_user';
const SESSION_KEY = 'vfa_session_id';

const params  = new URLSearchParams(window.location.search);
const uiRole  = params.get('role') || 'volunteer';           // 'volunteer' | 'elderly'
const apiRole = uiRole === 'elderly' ? 'requester' : 'volunteer';

// Theme
const isElderly = uiRole === 'elderly';
document.getElementById('auth-icon').textContent   = isElderly ? '👴' : '🤝';
document.getElementById('role-label').textContent  = isElderly ? 'Senior' : 'Bénévole';
document.getElementById('role-label').style.color  = isElderly ? 'var(--success)' : 'var(--accent)';
document.querySelector('.toggle-btn').style.color  = isElderly ? 'var(--success)' : 'var(--accent)';

let mode = 'login';   // 'login' | 'register'

function setMode(m) {
  mode = m;
  const isReg = m === 'register';
  document.getElementById('auth-title').textContent       = isReg ? 'Créer un compte' : 'Bon retour !';
  document.getElementById('auth-sub').innerHTML           = `${isReg ? 'Inscription' : 'Connexion'} en tant que <strong id="role-label" style="color:${isElderly ? 'var(--success)' : 'var(--accent)'}">${isElderly ? 'Senior' : 'Bénévole'}</strong>`;
  document.getElementById('name-wrap').style.display      = isReg ? 'flex' : 'none';
  document.getElementById('pw-hint').style.display        = isReg ? 'block' : 'none';
  document.getElementById('btn-label').textContent        = isReg ? "S'inscrire" : 'Se connecter';
  document.getElementById('toggle-text').textContent      = isReg ? 'Déjà un compte ?' : 'Pas encore de compte ?';
  document.getElementById('toggle-btn').textContent       = isReg ? 'Se connecter' : 'Créer un compte';
  document.getElementById('password').autocomplete        = isReg ? 'new-password' : 'current-password';
  document.getElementById('name').required                = isReg;
  document.getElementById('password').minLength           = isReg ? 8 : 1;
  clearStatus();
}

document.getElementById('toggle-btn').addEventListener('click', () => setMode(mode === 'login' ? 'register' : 'login'));

// Password toggle
document.getElementById('pw-toggle').addEventListener('click', () => {
  const inp = document.getElementById('password');
  inp.type = inp.type === 'password' ? 'text' : 'password';
});

function showStatus(msg, type) {
  const el = document.getElementById('status-msg');
  el.className = `alert alert-${type}`;
  el.textContent = msg;
  el.style.display = 'block';
}
function clearStatus() {
  const el = document.getElementById('status-msg');
  el.style.display = 'none';
}

function setBusy(busy) {
  document.getElementById('submit-btn').disabled   = busy;
  document.getElementById('btn-spin').style.display = busy ? 'inline-block' : 'none';
  document.getElementById('btn-label').style.display = busy ? 'none' : 'inline';
}

document.getElementById('auth-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearStatus();
  setBusy(true);

  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const name     = document.getElementById('name').value.trim();

  try {
    let res, data;

    if (mode === 'login') {
      res  = await fetch(`${API}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
    } else {
      res  = await fetch(`${API}/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role: apiRole })
      });
    }

    data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const detail = data.detail || data.message || 'Une erreur est survenue.';
      throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
    }

    // Save auth state
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(ROLE_KEY,  uiRole);
    localStorage.setItem(USER_KEY,  JSON.stringify(data.user));
    localStorage.removeItem(SESSION_KEY);   // fresh session on new login

    showStatus(`Bienvenue, ${data.user.name} ! Redirection…`, 'success');
    setTimeout(() => {
      window.location.href = uiRole === 'volunteer' ? '/volunteer-dashboard.html' : '/elderly-home.html';
    }, 600);

  } catch (err) {
    showStatus(err.message, 'error');
  } finally {
    setBusy(false);
  }
});
