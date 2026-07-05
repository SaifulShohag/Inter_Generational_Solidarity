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

const ACTIVE_STATUSES = ['pending', 'accepted', 'in_progress'];
const PAST_STATUSES   = ['completed', 'cancelled'];

const urlParams = new URLSearchParams(window.location.search);
let activeTab   = urlParams.get('tab') === 'past' ? 'past' : 'active';

let allItems           = [];
let reviewedRequestIds = new Set();
let assignmentMap      = {};
let sessionMap         = {};

function setTab(tab) {
  activeTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tab);
  });
  render();
}

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => setTab(btn.dataset.tab));
});

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

function meetingCodeHtml(code) {
  if (!code) return '';
  return `
    <div style="background:linear-gradient(135deg,#f0f9ff,#e0f2fe);border:2px solid #0ea5e9;border-radius:12px;padding:12px 14px;text-align:center;margin-bottom:10px">
      <p style="font-size:.72rem;font-weight:700;color:#0369a1;letter-spacing:.1em;margin-bottom:4px">🤝 CODE DE RENCONTRE</p>
      <p style="font-size:1.7rem;font-weight:800;letter-spacing:.2em;color:#0c4a6e;font-family:monospace;margin:0">${code}</p>
      <p style="font-size:.72rem;color:#0369a1;margin-top:4px">Demandez ce code à votre bénévole pour confirmer la mise en relation</p>
    </div>`;
}

function render() {
  const statuses = activeTab === 'active' ? ACTIVE_STATUSES : PAST_STATUSES;
  const filtered = allItems.filter(r => statuses.includes(r.status));

  const label = document.getElementById('count-label');
  if (activeTab === 'active') {
    label.textContent = `${filtered.length} demande${filtered.length !== 1 ? 's' : ''} en cours`;
  } else {
    const done = filtered.filter(r => r.status === 'completed').length;
    label.textContent = `${done} fois aidée · ${filtered.length} demande${filtered.length !== 1 ? 's' : ''} passée${filtered.length !== 1 ? 's' : ''}`;
  }

  const list   = document.getElementById('list');
  list.innerHTML = '';
  const toWire = [];

  if (!filtered.length) {
    list.innerHTML = `<div class="empty-state">
      <div class="icon">${activeTab === 'active' ? '🌱' : '📚'}</div>
      <p style="font-size:1.1rem;font-weight:700;margin-bottom:8px">${activeTab === 'active' ? 'Aucune demande en cours' : 'Aucune demande passée'}</p>
      <p>${activeTab === 'active' ? 'Créez une demande via le chat' : 'Vos demandes terminées apparaîtront ici'}</p>
    </div>`;
    return;
  }

  filtered.forEach(r => {
    const sc  = statusCfg[r.status]     || statusCfg.pending;
    const pc  = priorityCfg[r.priority] || priorityCfg.medium;
    const ic  = catIcon[r.category]     || '💬';
    const dt  = new Date(r.scheduled_at).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' });
    const created = new Date(r.created_at).toLocaleDateString('fr-FR', { day:'numeric', month:'short' });
    const assignment = assignmentMap[r.id];
    const sessionId  = sessionMap[r.id];
    const chatUrl    = sessionId ? `/chat.html?session=${sessionId}` : '/chat.html';

    let footer = '';
    if (r.status === 'completed') {
      footer = reviewedRequestIds.has(r.id) ? alreadyReviewedHtml() : starWidget(r.id);
      if (!reviewedRequestIds.has(r.id)) toWire.push(r.id);
    } else if (['accepted', 'in_progress'].includes(r.status)) {
      footer = `
        ${meetingCodeHtml(assignment?.meeting_code)}
        <button class="continue-btn" onclick="window.location.href='${chatUrl}'">💬 Voir la conversation</button>`;
    } else if (r.status === 'pending') {
      footer = `
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <button class="continue-btn" onclick="window.location.href='${chatUrl}'">💬 Voir la conversation</button>
          <button class="btn btn-ghost btn-sm" style="color:#dc2626;border-color:#fca5a5" id="cancel-btn-${r.id}">Annuler la demande</button>
        </div>`;
    }

    const card = document.createElement('div');
    card.id = `card-${r.id}`;
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

  filtered.filter(r => r.status === 'pending').forEach(r => {
    const btn = document.getElementById(`cancel-btn-${r.id}`);
    if (btn) btn.addEventListener('click', () => cancelRequest(r.id));
  });
}

async function load() {
  const [reqRes, revRes, sesRes] = await Promise.all([
    fetch(`${API}/requests/mine`, { headers: { Authorization: `Bearer ${token}` } }),
    fetch(`${API}/users/${userId}/reviews?as_reviewer=true`, { headers: { Authorization: `Bearer ${token}` } }),
    fetch(`${API}/conversations`, { headers: { Authorization: `Bearer ${token}` } }),
  ]);

  if (!reqRes.ok) {
    document.getElementById('list').innerHTML = '<div class="empty-state"><div class="icon">⚠️</div><p>Impossible de charger les demandes.</p></div>';
    return;
  }

  allItems = await reqRes.json();
  const myReviews = revRes.ok ? await revRes.json() : [];
  reviewedRequestIds = new Set(myReviews.map(rv => rv.request_id));

  if (sesRes.ok) {
    const sessions = await sesRes.json();
    sessions.forEach(s => { if (s.request_id) sessionMap[s.request_id] = s.session_id; });
  }

  await Promise.all(
    allItems
      .filter(r => ['accepted', 'in_progress'].includes(r.status))
      .map(async r => {
        try {
          const d = await fetch(`${API}/requests/${r.id}`, { headers: { Authorization: `Bearer ${token}` } });
          if (d.ok) {
            const { assignment } = await d.json();
            if (assignment) assignmentMap[r.id] = assignment;
          }
        } catch {}
      })
  );

  setTab(activeTab);
}

async function cancelRequest(reqId) {
  if (!confirm('Êtes-vous sûr de vouloir annuler cette demande ?')) return;
  const btn = document.getElementById(`cancel-btn-${reqId}`);
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner spinner-dark"></span>'; }

  const res = await fetch(`${API}/requests/${reqId}/cancel`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}` }
  });

  if (res.ok) {
    allItems = allItems.filter(r => r.id !== reqId);
    render();
  } else {
    if (btn) { btn.disabled = false; btn.textContent = 'Annuler la demande'; }
    const err = await res.json().catch(() => ({}));
    alert(err.detail || 'Impossible d\'annuler cette demande.');
  }
}

load();
