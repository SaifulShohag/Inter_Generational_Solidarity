const API       = window.location.origin;
const TOKEN_KEY = 'vfa_token';
const ROLE_KEY  = 'vfa_role';
const USER_KEY  = 'vfa_api_user';

const token = localStorage.getItem(TOKEN_KEY);
if (!token || localStorage.getItem(ROLE_KEY) !== 'volunteer') {
  window.location.href = '/index.html';
}
const user   = JSON.parse(localStorage.getItem(USER_KEY) || '{}');
const userId = user.id;

// ── Reviewed request IDs (fetched from API) ──
let reviewedRequestIds = new Set();

document.getElementById('user-av').textContent   = (user.name || 'V')[0].toUpperCase();
document.getElementById('user-name').textContent = user.name || 'Bénévole';
document.getElementById('logout-link').addEventListener('click', e => {
  e.preventDefault();
  ['vfa_token','vfa_role','vfa_api_user','vfa_session_id'].forEach(k => localStorage.removeItem(k));
  window.location.href = '/index.html';
});

const catIcon  = { medical:'🏥', grocery:'🛒', cleaning:'🧹', transport:'🚗', other:'💬' };
const catBg    = { medical:'#fef2f2', grocery:'#f0fdf4', cleaning:'#eff6ff', transport:'#fefce8', other:'#f5f3ff' };
const statusCfg = {
  pending:     { label:'En attente',   cls:'badge-orange' },
  accepted:    { label:'Acceptée',     cls:'badge-blue'   },
  in_progress: { label:'En cours',     cls:'badge-blue'   },
  completed:   { label:'Terminée',     cls:'badge-green'  },
  cancelled:   { label:'Annulée',      cls:'badge-gray'   },
};
const priBar = { urgent:'#dc2626', medium:'var(--warning)', low:'var(--success)' };

let allMissions = [];   // { r, assignment }
let activeTab   = 'all';

// ── Tabs ──
document.getElementById('tab-row').addEventListener('click', e => {
  const btn = e.target.closest('.tab-btn');
  if (!btn) return;
  activeTab = btn.dataset.status;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.status === activeTab));
  render();
});

// ── Render ──
function render() {
  const filtered = activeTab === 'all'
    ? allMissions
    : allMissions.filter(({ r }) => r.status === activeTab);

  const total = allMissions.length;
  document.getElementById('count-label').textContent =
    `${total} mission${total !== 1 ? 's' : ''} acceptée${total !== 1 ? 's' : ''} au total`;

  const list = document.getElementById('list');

  if (!filtered.length) {
    list.innerHTML = `<div class="empty-state"><div class="icon">${activeTab === 'completed' ? '🏆' : '📭'}</div><p style="font-weight:700;font-size:1rem;margin-bottom:6px">${activeTab === 'completed' ? 'Aucune mission terminée encore' : 'Aucune mission dans cette catégorie'}</p><p style="font-size:.88rem">Vérifiez les autres onglets</p></div>`;
    return;
  }

  list.innerHTML = filtered.map(({ r }) => {
    const ic  = catIcon[r.category]  || '💬';
    const bg  = catBg[r.category]    || '#f5f3ff';
    const sc  = statusCfg[r.status]  || statusCfg.pending;
    const bar = priBar[r.priority]   || priBar.medium;
    const dt  = new Date(r.scheduled_at).toLocaleDateString('fr-FR', { weekday:'short', day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' });

    const actions = buildActions(r);

    return `
    <div class="mission-card animate-slide">
      <div style="height:4px;background:${bar}"></div>
      <div class="mission-header">
        <div class="mission-icon" style="background:${bg}">${ic}</div>
        <div class="mission-body">
          <div class="mission-title">${r.title}</div>
          <div class="mission-desc">${r.description}</div>
          <div class="mission-meta">
            <span>📅 ${dt}</span>
            <span>📍 ${r.location_text}</span>
          </div>
        </div>
        <span class="badge ${sc.cls}">${sc.label}</span>
      </div>
      <div class="mission-footer" id="footer-${r.id}">
        ${actions}
      </div>
    </div>`;
  }).join('');

  filtered.forEach(({ r }) => bindFooterButtons(r.id, r.status));
  document.getElementById('count-label').textContent = `${allMissions.length} mission${allMissions.length !== 1 ? 's' : ''} acceptée${allMissions.length !== 1 ? 's' : ''} au total`;
}

// ── Build footer actions per status ──
function buildActions(r) {
  if (r.status === 'accepted' || r.status === 'in_progress') {
    return `
      <a class="btn btn-ghost btn-sm" href="/mission-detail.html?id=${r.id}">Détails →</a>
      <button class="btn btn-success btn-sm" style="flex:1" id="complete-${r.id}">✅ Marquer terminée</button>`;
  }
  if (r.status === 'completed') {
    if (reviewedRequestIds.has(r.id)) {
      return `<div style="color:var(--success);font-weight:600;font-size:.88rem;width:100%;text-align:center">💖 Déjà évalué — merci !</div>`;
    }
    return buildReviewWidget(r.id);
  }
  return `<a class="btn btn-ghost btn-sm" href="/mission-detail.html?id=${r.id}">Voir les détails →</a>`;
}

function buildReviewWidget(reqId) {
  return `
    <div id="review-box-${reqId}" style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;width:100%">
      <span style="font-size:.88rem;font-weight:600;color:var(--muted)">⭐ Notez le bénéficiaire :</span>
      <div style="display:flex;gap:3px" id="stars-${reqId}">
        ${[1,2,3,4,5].map(v => `<button class="star-r" data-v="${v}" data-req="${reqId}" style="background:none;border:none;font-size:1.4rem;color:#d1d5db;cursor:pointer;padding:2px;transition:color .1s">★</button>`).join('')}
      </div>
      <button class="btn btn-primary btn-sm" id="review-btn-${reqId}" disabled>Envoyer</button>
    </div>`;
}

// ── Wire footer buttons ──
function bindFooterButtons(reqId, status) {
  const completeBtn = document.getElementById(`complete-${reqId}`);
  if (completeBtn) {
    completeBtn.addEventListener('click', () => completeRequest(reqId));
  }

  const stars     = document.querySelectorAll(`#stars-${reqId} .star-r`);
  const reviewBtn = document.getElementById(`review-btn-${reqId}`);
  let rating      = 0;

  stars.forEach(s => {
    s.addEventListener('mouseover', () => stars.forEach(b => b.style.color = parseInt(b.dataset.v) <= parseInt(s.dataset.v) ? '#f59e0b' : '#d1d5db'));
    s.addEventListener('mouseout',  () => stars.forEach(b => b.style.color = parseInt(b.dataset.v) <= rating ? '#f59e0b' : '#d1d5db'));
    s.addEventListener('click', () => {
      rating = parseInt(s.dataset.v);
      stars.forEach(b => b.style.color = parseInt(b.dataset.v) <= rating ? '#f59e0b' : '#d1d5db');
      if (reviewBtn) reviewBtn.disabled = false;
    });
  });

  if (reviewBtn) {
    reviewBtn.addEventListener('click', () => submitReview(reqId, rating, reviewBtn));
  }
}

// ── Complete request ──
async function completeRequest(reqId) {
  const btn = document.getElementById(`complete-${reqId}`);
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>'; }

  const res = await fetch(`${API}/requests/${reqId}/complete`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}` }
  });

  if (res.ok) {
    // Update in local state
    const item = allMissions.find(({ r }) => r.id === reqId);
    if (item) item.r.status = 'completed';
    render();
  } else {
    if (btn) { btn.disabled = false; btn.textContent = '✅ Marquer terminée'; }
  }
}

// ── Submit review ──
async function submitReview(reqId, rating, btn) {
  if (!rating) return;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner spinner-dark"></span>';

  const res = await fetch(`${API}/requests/${reqId}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ rating, comment: '' })
  });

  const box = document.getElementById(`review-box-${reqId}`);
  if (res.ok || res.status === 409) {
    reviewedRequestIds.add(reqId);
    if (box) box.outerHTML = `<div style="color:var(--success);font-weight:600;font-size:.88rem;width:100%;text-align:center">💖 Déjà évalué — merci !</div>`;
  } else {
    btn.disabled = false;
    btn.textContent = 'Envoyer';
  }
}

// ── Load all missions across statuses ──
async function load() {
  const statuses = ['accepted', 'in_progress', 'completed'];

  // Fetch all statuses in parallel
  const results = await Promise.all(
    statuses.map(s =>
      fetch(`${API}/requests?status=${s}&limit=50`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : [])
        .catch(() => [])
    )
  );

  const candidates = results.flat();
  if (!candidates.length) {
    allMissions = [];
    render();
    return;
  }

  // Cross-reference assignments to filter to this volunteer's missions
  const checked = await Promise.all(
    candidates.map(async r => {
      try {
        const d = await fetch(`${API}/requests/${r.id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!d.ok) return null;
        const { assignment } = await d.json();
        if (assignment && assignment.volunteer_id === userId) return { r, assignment };
      } catch {}
      return null;
    })
  );

  allMissions = checked.filter(Boolean);

  const order = { in_progress: 0, accepted: 1, completed: 2 };
  allMissions.sort((a, b) => (order[a.r.status] ?? 3) - (order[b.r.status] ?? 3));

  // Fetch reviews already submitted BY this volunteer — no localStorage needed
  const revRes = await fetch(`${API}/users/${userId}/reviews?as_reviewer=true`, {
    headers: { Authorization: `Bearer ${token}` }
  }).catch(() => null);
  if (revRes && revRes.ok) {
    const myReviews    = await revRes.json();
    reviewedRequestIds = new Set(myReviews.map(rv => rv.request_id));
  }

  render();
}

load();
