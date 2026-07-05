const API       = window.location.origin;
const TOKEN_KEY = 'vfa_token';
const ROLE_KEY  = 'vfa_role';
const USER_KEY  = 'vfa_api_user';

const token = localStorage.getItem(TOKEN_KEY);
if (!token || localStorage.getItem(ROLE_KEY) !== 'elderly') {
  window.location.href = '/index.html';
}
const user   = JSON.parse(localStorage.getItem(USER_KEY) || '{}');
const userId = user.id;

const catIcon = { medical:'🏥', grocery:'🛒', cleaning:'🧹', transport:'🚗', other:'💬' };
const statusCfg = {
  pending:     { label:'En attente',   cls:'badge-orange', bar:'#f59e0b' },
  accepted:    { label:'Acceptée',     cls:'badge-blue',   bar:'var(--accent)' },
  in_progress: { label:'En cours',     cls:'badge-blue',   bar:'var(--accent)' },
  completed:   { label:'Terminée',     cls:'badge-green',  bar:'var(--success)' },
  cancelled:   { label:'Annulée',      cls:'badge-gray',   bar:'#9ca3af' },
};
const priorityCfg = {
  low:    { label:'🟢 Faible',  cls:'priority-low'   },
  medium: { label:'🟡 Moyenne', cls:'priority-medium' },
  urgent: { label:'🔴 Urgente', cls:'priority-urgent' },
};

function starWidget(reqId) {
  return `
    <div id="review-box-${reqId}" style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
      <span style="font-size:.88rem;font-weight:600;color:var(--muted)">⭐ Notez votre bénévole :</span>
      <div style="display:flex;gap:3px" id="stars-${reqId}">
        ${[1,2,3,4,5].map(v => `<button class="star-r" data-v="${v}" style="background:none;border:none;font-size:1.4rem;color:#d1d5db;cursor:pointer;padding:2px;transition:color .1s">★</button>`).join('')}
      </div>
      <button class="btn btn-primary btn-sm" id="rev-btn-${reqId}" disabled>Envoyer</button>
    </div>`;
}

function alreadyReviewedHtml() {
  return `<div style="color:var(--success);font-weight:600;font-size:.88rem">💖 Déjà évalué — merci !</div>`;
}

function wireStars(reqId) {
  const stars  = document.querySelectorAll(`#stars-${reqId} .star-r`);
  const revBtn = document.getElementById(`rev-btn-${reqId}`);
  let rating   = 0;

  stars.forEach(s => {
    s.addEventListener('mouseover', () => stars.forEach(b => b.style.color = parseInt(b.dataset.v) <= parseInt(s.dataset.v) ? '#f59e0b' : '#d1d5db'));
    s.addEventListener('mouseout',  () => stars.forEach(b => b.style.color = parseInt(b.dataset.v) <= rating ? '#f59e0b' : '#d1d5db'));
    s.addEventListener('click', () => {
      rating = parseInt(s.dataset.v);
      stars.forEach(b => b.style.color = parseInt(b.dataset.v) <= rating ? '#f59e0b' : '#d1d5db');
      if (revBtn) revBtn.disabled = false;
    });
  });

  if (revBtn) {
    revBtn.addEventListener('click', async () => {
      if (!rating) return;
      revBtn.disabled = true;
      revBtn.innerHTML = '<span class="spinner spinner-dark"></span>';
      const res = await fetch(`${API}/requests/${reqId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rating, comment: '' })
      });
      const box = document.getElementById(`review-box-${reqId}`);
      if (res.ok || res.status === 409) {
        if (box) box.outerHTML = alreadyReviewedHtml();
      } else {
        revBtn.disabled = false;
        revBtn.textContent = 'Envoyer';
      }
    });
  }
}

async function load() {
  // Fetch requests, already-submitted reviews, and sessions — all in parallel
  const [reqRes, revRes, sessRes] = await Promise.all([
    fetch(`${API}/requests/mine`,                                  { headers: { Authorization: `Bearer ${token}` } }),
    fetch(`${API}/users/${userId}/reviews?as_reviewer=true`,       { headers: { Authorization: `Bearer ${token}` } }),
    fetch(`${API}/conversations`,                                  { headers: { Authorization: `Bearer ${token}` } }),
  ]);

  if (!reqRes.ok) {
    document.getElementById('list').innerHTML = '<div class="empty-state"><div class="icon">⚠️</div><p>Impossible de charger les demandes.</p></div>';
    return;
  }

  const items    = await reqRes.json();
  const myReviews = revRes.ok ? await revRes.json() : [];
  const sessions  = sessRes.ok ? await sessRes.json() : [];

  // Map requestId → sessionId for the "View conversation" link
  const reqToSession = {};
  sessions.forEach(s => { if (s.request_id) reqToSession[s.request_id] = s.session_id; });

  const reviewedRequestIds = new Set(myReviews.map(rv => rv.request_id));

  const label = document.getElementById('count-label');
  const done  = items.filter(i => i.status === 'completed').length;
  label.textContent = `${done} fois aidée · ${items.length} demande${items.length !== 1 ? 's' : ''} au total`;

  if (!items.length) {
    document.getElementById('list').innerHTML = '<div class="empty-state"><div class="icon">🌱</div><p style="font-size:1.1rem;font-weight:700;margin-bottom:8px">Aucune demande pour l\'instant</p><p>Votre première demande apparaîtra ici</p></div>';
    return;
  }

  const list   = document.getElementById('list');
  list.innerHTML = '';
  const toWire = [];

  items.forEach(r => {
    const sc  = statusCfg[r.status]     || statusCfg.pending;
    const pc  = priorityCfg[r.priority] || priorityCfg.medium;
    const ic  = catIcon[r.category]     || '💬';
    const dt  = new Date(r.scheduled_at).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' });
    const created = new Date(r.created_at).toLocaleDateString('fr-FR', { day:'numeric', month:'short' });

    // Get the session for this request to link directly to the right conversation
    const sessionId = reqToSession[r.id];
    const chatLink  = sessionId
      ? `/chat.html?session=${sessionId}`
      : '/chat.html';

    let footer = '';
    if (r.status === 'completed') {
      footer = reviewedRequestIds.has(r.id) ? alreadyReviewedHtml() : starWidget(r.id);
      if (!reviewedRequestIds.has(r.id)) toWire.push(r.id);
    } else if (['pending','accepted','in_progress'].includes(r.status)) {
      footer = `<button class="continue-btn" onclick="window.location.href='${chatLink}'">💬 Voir la conversation</button>`;
    }

    const card = document.createElement('div');
    card.className = 'hist-item animate-slide';
    card.innerHTML = `
      <div class="status-bar" style="background:${sc.bar}"></div>
      <div class="hist-body">
        <div class="hist-head">
          <div>
            <div class="hist-title">${ic} ${r.title}</div>
            <div class="hist-desc">${r.description}</div>
          </div>
          <span class="badge ${sc.cls}">${sc.label}</span>
        </div>
        <div class="hist-meta">
          <span>📅 ${dt}</span>
          <span>📍 ${r.location_text}</span>
          <span>✏️ ${created}</span>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;${footer ? 'margin-bottom:12px' : ''}">
          <span class="badge ${pc.cls}">${pc.label}</span>
        </div>
        ${footer ? `<div id="footer-${r.id}">${footer}</div>` : ''}
      </div>`;
    list.appendChild(card);
  });

  toWire.forEach(id => wireStars(id));
}

load();
