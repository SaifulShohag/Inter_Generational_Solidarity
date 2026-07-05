const API       = window.location.origin;
const TOKEN_KEY = 'vfa_token';
const ROLE_KEY  = 'vfa_role';
const USER_KEY  = 'vfa_api_user';

const token = localStorage.getItem(TOKEN_KEY);
if (!token || localStorage.getItem(ROLE_KEY) !== 'volunteer') {
  window.location.href = '/index.html';
}
const user      = JSON.parse(localStorage.getItem(USER_KEY) || '{}');
const firstName = (user.name || '').split(' ')[0] || 'Bénévole';
const userId    = user.id;

document.getElementById('user-av').textContent    = (user.name || 'V')[0].toUpperCase();
document.getElementById('user-name').textContent  = user.name || 'Bénévole';
document.getElementById('topbar-title').textContent = `Bonjour, ${firstName} ! 👋`;

document.getElementById('logout-link').addEventListener('click', e => {
  e.preventDefault();
  ['vfa_token','vfa_role','vfa_api_user','vfa_session_id'].forEach(k => localStorage.removeItem(k));
  window.location.href = '/index.html';
});

const catIcon   = { medical:'🏥', grocery:'🛒', cleaning:'🧹', transport:'🚗', other:'💬' };

let userLat = null;
let userLng = null;

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

navigator.geolocation?.getCurrentPosition(
  pos => { userLat = pos.coords.latitude; userLng = pos.coords.longitude; },
  () => {}
);
const priBar    = { urgent:'#dc2626', medium:'var(--warning)', low:'var(--success)' };
const priBadge  = {
  urgent: '<span class="badge priority-urgent">🔴 Urgent</span>',
  medium: '<span class="badge priority-medium">🟡 Moyen</span>',
  low:    '<span class="badge priority-low">🟢 Faible</span>',
};

// ── Stats ──
function loadStats() {
  const grid = document.getElementById('stats-grid');
  const statDefs = [
    { icon:'✅', label:'Missions réalisées', value: user.total_reviews || 0,  color:'var(--accent-light)',  iconColor:'var(--accent)' },
    { icon:'⭐', label:'Note moyenne',        value:`${(user.avg_rating||0).toFixed(1)}★`, color:'var(--warning-light)', iconColor:'var(--warning)' },
    { icon:'👥', label:'Avis reçus',          value: user.total_reviews || 0,  color:'var(--success-light)', iconColor:'var(--success)' },
    { icon:'📅', label:'Membre depuis',        value: new Date(user.created_at||Date.now()).toLocaleDateString('fr-FR',{month:'short',year:'numeric'}), color:'#f5f3ff', iconColor:'#7c3aed' },
  ];
  grid.innerHTML = statDefs.map(s => `
    <div class="stat-card-el stat-card animate-slide">
      <div class="stat-icon" style="background:${s.color};color:${s.iconColor}">${s.icon}</div>
      <div class="stat-value">${s.value}</div>
      <div class="stat-label">${s.label}</div>
    </div>`).join('');

  const reviews  = user.total_reviews || 0;
  const nextLvl  = Math.ceil((reviews + 1) / 5) * 5;
  const pct      = Math.round((reviews % 5) / 5 * 100);
  document.getElementById('total-missions').textContent = reviews;
  document.getElementById('progress-bar').style.width   = `${pct}%`;
  document.getElementById('level-hint').textContent     = `${nextLvl - reviews} mission${nextLvl - reviews !== 1 ? 's' : ''} avant le prochain niveau`;
}

// ── Render a mission card ──
function missionCard(r, statusLabel = null) {
  const ic  = catIcon[r.category] || '💬';
  const pb  = priBadge[r.priority] || priBadge.medium;
  const bar = priBar[r.priority]   || priBar.medium;
  const dt  = new Date(r.scheduled_at).toLocaleDateString('fr-FR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
  const statusChip = statusLabel ? `<span class="badge badge-blue" style="margin-left:6px">${statusLabel}</span>` : '';
  return `
    <div class="mission-item animate-slide" onclick="window.location.href='/mission-detail.html?id=${r.id}'">
      <div style="height:4px;background:${bar}"></div>
      <div class="mission-body">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px">
          <div style="flex:1">
            <div class="mission-title">${ic} ${r.title} ${statusChip}</div>
            <div class="mission-desc">${r.description}</div>
          </div>
          ${pb}
        </div>
        <div class="mission-meta">
          <span>📅 ${dt}</span>
          <span>📍 ${r.location_text}</span>
        </div>
      </div>
      <div class="mission-actions">
        <button class="btn btn-primary btn-sm" style="flex:1" onclick="event.stopPropagation();window.location.href='/mission-detail.html?id=${r.id}'">Voir →</button>
      </div>
    </div>`;
}

// ── Available (pending) missions ──
async function loadPendingMissions() {
  const res = await fetch(`${API}/requests?status=pending&limit=4`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return;
  const requests = await res.json();
  document.getElementById('missions-count').textContent = `${requests.length} mission${requests.length !== 1 ? 's' : ''} disponible${requests.length !== 1 ? 's' : ''} près de vous`;

  if (!requests.length) {
    document.getElementById('missions-list').innerHTML = '<div style="text-align:center;padding:32px 20px;color:var(--muted)"><div style="font-size:2rem;margin-bottom:8px">🎉</div><p>Tout est à jour !</p></div>';
    return;
  }

  // Sort by distance if geolocation available
  let sorted = requests;
  if (userLat !== null) {
    sorted = requests.map(r => ({
      ...r,
      _dist: (r.latitude && r.longitude) ? haversineKm(userLat, userLng, r.latitude, r.longitude) : Infinity
    })).sort((a, b) => a._dist - b._dist);
  }

  document.getElementById('missions-list').innerHTML = sorted.map(r => missionCard(r)).join('');
}

// ── My accepted / in-progress missions ──
async function loadMyMissions() {
  const section = document.getElementById('my-missions-section');
  const list    = document.getElementById('my-missions-list');

  // Fetch accepted and in_progress
  const [resAcc, resInp] = await Promise.all([
    fetch(`${API}/requests?status=accepted&limit=20`,    { headers: { Authorization: `Bearer ${token}` } }),
    fetch(`${API}/requests?status=in_progress&limit=20`, { headers: { Authorization: `Bearer ${token}` } }),
  ]);

  const accepted    = resAcc.ok    ? await resAcc.json()    : [];
  const in_progress = resInp.ok    ? await resInp.json()    : [];
  const all         = [...in_progress, ...accepted];

  if (!all.length) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';

  // For each, fetch assignment to check if this volunteer owns it
  const mine = [];
  await Promise.all(all.map(async r => {
    try {
      const d = await fetch(`${API}/requests/${r.id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!d.ok) return;
      const { assignment } = await d.json();
      if (assignment && assignment.volunteer_id === userId) mine.push({ r, assignment });
    } catch {}
  }));

  if (!mine.length) {
    section.style.display = 'none';
    return;
  }

  document.getElementById('my-missions-count').textContent = `${mine.length} mission${mine.length !== 1 ? 's' : ''} en cours`;
  list.innerHTML = mine.map(({ r }) => missionCard(r, r.status === 'in_progress' ? '🔵 En cours' : '✅ Acceptée')).join('');
}

loadStats();
loadPendingMissions();
loadMyMissions();
