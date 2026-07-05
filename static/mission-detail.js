const API       = window.location.origin;
const TOKEN_KEY = 'vfa_token';
const ROLE_KEY  = 'vfa_role';

const token = localStorage.getItem(TOKEN_KEY);
if (!token || localStorage.getItem(ROLE_KEY) !== 'volunteer') {
  window.location.href = '/index.html';
}

const id = new URLSearchParams(window.location.search).get('id');
if (!id) window.location.href = '/missions.html';

const catIcon  = { medical:'🏥', grocery:'🛒', cleaning:'🧹', transport:'🚗', other:'💬' };
const catLabel = { medical:'Médical', grocery:'Courses', cleaning:'Ménage', transport:'Transport', other:'Autre' };
const priCfg   = {
  urgent: { label:'🔴 Urgent',  cls:'badge priority-urgent', bar:'#dc2626' },
  medium: { label:'🟡 Moyen',   cls:'badge priority-medium', bar:'var(--warning)' },
  low:    { label:'🟢 Faible',  cls:'badge priority-low',    bar:'var(--success)' },
};

async function load() {
  const res = await fetch(`${API}/requests/${id}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    document.getElementById('loading').innerHTML = '<p>Mission introuvable. <a href="/missions.html">Retour aux missions</a></p>';
    return;
  }

  const { request: r, assignment } = await res.json();
  const ic  = catIcon[r.category]  || '💬';
  const cl  = catLabel[r.category] || 'Autre';
  const pc  = priCfg[r.priority]   || priCfg.medium;
  const dt  = new Date(r.scheduled_at).toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' });

  const page = document.getElementById('page');
  page.innerHTML = `
    <!-- Banner -->
    <div class="banner">
      <img src="https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&h=300&fit=crop&q=70" alt="${r.title}">
      <div class="banner-overlay"></div>
      <button class="back-btn" onclick="history.back()">←</button>
      <div class="urgency-badge">
        <span class="${pc.cls}">${pc.label}</span>
      </div>
    </div>

    <div class="content animate-slide">
      <!-- Title -->
      <div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <span style="font-size:1.4rem">${ic}</span>
          <span class="badge badge-gray">${cl}</span>
        </div>
        <h1 style="font-size:1.5rem">${r.title}</h1>
        <p style="color:var(--muted);font-size:.83rem;margin-top:4px">Demande #${r.id} · Créée le ${new Date(r.created_at).toLocaleDateString('fr-FR')}</p>
      </div>

      <!-- Requester -->
      <div class="requester-card">
        <div class="avatar avatar-lg" style="background:var(--accent-light);color:var(--accent)">👴</div>
        <div class="req-info">
          <div class="req-label">Demande d'aide</div>
          <div class="req-name">Bénéficiaire #${r.requester_id}</div>
        </div>
      </div>

      <!-- Description -->
      <div>
        <h3 style="margin-bottom:10px">Description de la mission</h3>
        <p style="color:#374151;line-height:1.65;font-size:.95rem">${r.description}</p>
      </div>

      <!-- Detail grid -->
      <div class="detail-grid">
        <div class="detail-box">
          <div class="label">📅 Date prévue</div>
          <div class="value">${dt}</div>
        </div>
        <div class="detail-box">
          <div class="label">📍 Lieu</div>
          <div class="value">${r.location_text}</div>
        </div>
      </div>

      <!-- Warning -->
      <div class="warning-box">
        <span>⚠️</span>
        <p>En acceptant cette mission, vous vous engagez à vous présenter à l'heure. Si vous ne pouvez pas venir, merci d'annuler au moins 2 heures à l'avance.</p>
      </div>

      <!-- Status info if already assigned -->
      ${assignment ? `
        <div class="alert alert-info" style="display:flex;align-items:center;justify-content:space-between;gap:12px">
          <span>✅ Mission acceptée${assignment.eta_minutes ? ` · ETA : ${assignment.eta_minutes} min` : ''}</span>
          ${r.status === 'accepted' || r.status === 'in_progress' ? `<button class="btn btn-success btn-sm" id="complete-btn">Marquer terminée</button>` : ''}
          ${r.status === 'completed' ? `<span class="badge badge-green">✅ Terminée</span>` : ''}
        </div>` : ''}

      <div id="accepted-state"></div>
    </div>

    <!-- Sticky footer -->
    <div class="sticky-footer" id="accept-footer" style="${assignment ? 'display:none' : ''}">
      <div class="eta-input">
        <input id="eta" type="number" min="0" max="240" placeholder="ETA en minutes (ex: 15)" />
      </div>
      <button class="btn btn-ghost btn-lg" onclick="history.back()">Décliner</button>
      <button class="btn btn-success btn-lg" id="accept-btn">✅ Accepter</button>
    </div>`;

  document.getElementById('accept-btn')?.addEventListener('click', acceptMission);
  document.getElementById('complete-btn')?.addEventListener('click', completeMission);
}

async function acceptMission() {
  const etaVal = parseInt(document.getElementById('eta').value || '0', 10);
  const btn = document.getElementById('accept-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';

  const res = await fetch(`${API}/requests/${id}/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ eta_minutes: etaVal })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    btn.disabled = false;
    btn.textContent = '✅ Accepter';
    const footer = document.getElementById('accept-footer');
    const alert = document.createElement('div');
    alert.className = 'alert alert-error';
    alert.style.cssText = 'margin:0 16px 12px';
    alert.textContent = err.detail || 'Impossible d\'accepter cette mission.';
    footer.insertAdjacentElement('beforebegin', alert);
    return;
  }

  // Show success state
  document.getElementById('accept-footer').style.display = 'none';
  document.getElementById('accepted-state').innerHTML = `
    <div class="success-state animate-slide">
      <div class="emoji">🎉</div>
      <h3>Mission acceptée !</h3>
      <p>Le bénéficiaire a été notifié. Vous êtes formidable !</p>
      <button class="btn btn-ghost btn-sm" style="margin-top:14px" onclick="window.location.href='/missions.html'">Retour aux missions</button>
    </div>`;
}

async function completeMission() {
  const btn = document.getElementById('complete-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>'; }
  const res = await fetch(`${API}/requests/${id}/complete`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}` }
  });
  if (res.ok) {
    document.getElementById('accepted-state').innerHTML = `
      <div class="success-state animate-slide">
        <div class="emoji">🏆</div>
        <h3>Mission terminée !</h3>
        <p>Merci pour votre aide. Vous faites une vraie différence !</p>
        <button class="btn btn-ghost btn-sm" style="margin-top:14px" onclick="window.location.href='/volunteer-dashboard.html'">Retour au tableau de bord</button>
      </div>`;
    document.getElementById('accept-footer').style.display = 'none';
    btn?.closest('.alert')?.remove();
  } else {
    if (btn) { btn.disabled = false; btn.textContent = 'Marquer terminée'; }
  }
}

load();
