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

function meetingCodeHtml(code) {
  if (!code) return '';
  return `
    <div style="background:linear-gradient(135deg,#f0f9ff,#e0f2fe);border:2px solid #0ea5e9;border-radius:16px;padding:18px 20px;text-align:center;margin-bottom:4px">
      <p style="font-size:.78rem;font-weight:700;color:#0369a1;letter-spacing:.1em;margin-bottom:6px">🤝 CODE DE RENCONTRE</p>
      <p style="font-size:2.2rem;font-weight:800;letter-spacing:.25em;color:#0c4a6e;font-family:monospace">${code}</p>
      <p style="font-size:.78rem;color:#0369a1;margin-top:6px">Montrez ce code au bénéficiaire pour confirmer que vous êtes le bon bénévole</p>
    </div>`;
}

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
    <div class="banner">
      <img src="https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&h=300&fit=crop&q=70" alt="${r.title}">
      <div class="banner-overlay"></div>
      <button class="back-btn" onclick="history.back()">←</button>
      <div class="urgency-badge">
        <span class="${pc.cls}">${pc.label}</span>
      </div>
    </div>

    <div class="content animate-slide">
      <div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <span style="font-size:1.4rem">${ic}</span>
          <span class="badge badge-gray">${cl}</span>
        </div>
        <h1 style="font-size:1.5rem">${r.title}</h1>
        <p style="color:var(--muted);font-size:.83rem;margin-top:4px">Demande #${r.id} · Créée le ${new Date(r.created_at).toLocaleDateString('fr-FR')}</p>
      </div>

      <div class="requester-card">
        <div class="avatar avatar-lg" style="background:var(--accent-light);color:var(--accent)">👴</div>
        <div class="req-info">
          <div class="req-label">Demande d'aide</div>
          <div class="req-name">Bénéficiaire #${r.requester_id}</div>
        </div>
      </div>

      <div>
        <h3 style="margin-bottom:10px">Description de la mission</h3>
        <p style="color:#374151;line-height:1.65;font-size:.95rem">${r.description}</p>
      </div>

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

      <div class="warning-box">
        <span>⚠️</span>
        <p>En acceptant cette mission, vous vous engagez à vous présenter à l'heure. Si vous ne pouvez pas venir, merci d'annuler au moins 2 heures à l'avance.</p>
      </div>

      ${assignment ? `
        ${meetingCodeHtml(assignment.meeting_code)}
        <div class="alert alert-info" style="display:flex;align-items:center;justify-content:space-between;gap:12px">
          <span>✅ Mission acceptée${assignment.eta_minutes ? ` · Arrivée dans ${assignment.eta_minutes} min` : ''}</span>
          ${r.status === 'accepted' || r.status === 'in_progress' ? `<button class="btn btn-success btn-sm" id="complete-btn">Marquer terminée</button>` : ''}
          ${r.status === 'completed' ? `<span class="badge badge-green">✅ Terminée</span>` : ''}
        </div>
        ${r.status === 'accepted' || r.status === 'in_progress' ? `
          <div id="withdraw-section" style="margin-top:8px">
            <button class="btn btn-ghost btn-sm" style="color:#dc2626;border-color:#fca5a5" id="withdraw-toggle">
              Je ne peux plus faire cette mission
            </button>
          </div>` : ''}` : ''}

      <div id="accepted-state"></div>
    </div>

    <div class="sticky-footer" id="accept-footer" style="${assignment ? 'display:none' : ''}">
      <div class="eta-input">
        <label for="eta" style="font-size:.85rem;font-weight:600;color:#374151;display:block;margin-bottom:4px">À quelle heure pensez-vous arriver ?</label>
        <input id="eta" type="time" />
      </div>
      <button class="btn btn-ghost btn-lg" onclick="history.back()">Décliner</button>
      <button class="btn btn-success btn-lg" id="accept-btn">✅ Accepter</button>
    </div>`;

  document.getElementById('accept-btn')?.addEventListener('click', acceptMission);
  document.getElementById('complete-btn')?.addEventListener('click', completeMission);

  document.getElementById('withdraw-toggle')?.addEventListener('click', () => {
    const sec = document.getElementById('withdraw-section');
    sec.innerHTML = `
      <div style="background:#fff5f5;border:1px solid #fca5a5;border-radius:12px;padding:14px;margin-top:4px">
        <p style="font-size:.85rem;font-weight:600;color:#dc2626;margin-bottom:8px">Expliquez pourquoi vous vous retirez :</p>
        <textarea id="withdraw-reason" rows="3" placeholder="Ex : Je suis malade, je ne peux pas venir..." style="width:100%;border:1px solid #fca5a5;border-radius:8px;padding:8px;font-size:.9rem;resize:vertical;box-sizing:border-box"></textarea>
        <div style="display:flex;gap:8px;margin-top:10px">
          <button class="btn btn-ghost btn-sm" id="withdraw-cancel-btn">Annuler</button>
          <button class="btn btn-sm" style="background:#dc2626;color:#fff;flex:1" id="withdraw-confirm-btn">Confirmer le retrait</button>
        </div>
      </div>`;
    document.getElementById('withdraw-cancel-btn').addEventListener('click', () => {
      sec.innerHTML = `<button class="btn btn-ghost btn-sm" style="color:#dc2626;border-color:#fca5a5" id="withdraw-toggle">Je ne peux plus faire cette mission</button>`;
      document.getElementById('withdraw-toggle').addEventListener('click', arguments.callee.caller);
    });
    document.getElementById('withdraw-confirm-btn').addEventListener('click', withdrawMission);
  });
}

async function acceptMission() {
  const etaInput = document.getElementById('eta').value;
  let etaVal = 0;
  if (etaInput) {
    const [h, m] = etaInput.split(':').map(Number);
    const now = new Date();
    const arrival = new Date();
    arrival.setHours(h, m, 0, 0);
    if (arrival <= now) arrival.setDate(arrival.getDate() + 1);
    etaVal = Math.round((arrival - now) / 60000);
  }
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
    alert.textContent = err.detail || "Impossible d'accepter cette mission.";
    footer.insertAdjacentElement('beforebegin', alert);
    return;
  }

  const assignment = await res.json();
  document.getElementById('accept-footer').style.display = 'none';
  document.getElementById('accepted-state').innerHTML = `
    <div class="success-state animate-slide">
      <div class="emoji">🎉</div>
      <h3>Mission acceptée !</h3>
      ${meetingCodeHtml(assignment.meeting_code)}
      <p style="margin-top:12px">Le bénéficiaire a été notifié. Vous êtes formidable !</p>
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

async function withdrawMission() {
  const reason = document.getElementById('withdraw-reason')?.value?.trim();
  if (!reason || reason.length < 10) {
    alert('Veuillez écrire une explication d\'au moins 10 caractères.');
    return;
  }
  const btn = document.getElementById('withdraw-confirm-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';

  const res = await fetch(`${API}/requests/${id}/withdraw`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ reason })
  });

  if (res.ok) {
    document.getElementById('page').innerHTML = `
      <div class="content animate-slide" style="text-align:center;padding-top:60px">
        <div style="font-size:3rem;margin-bottom:16px">✅</div>
        <h2>Retrait confirmé</h2>
        <p style="color:var(--muted);margin-top:8px">La mission a été remise en ligne pour d'autres bénévoles.</p>
        <button class="btn btn-ghost btn-sm" style="margin-top:24px" onclick="window.location.href='/accepted-missions.html'">Mes missions</button>
      </div>`;
  } else {
    btn.disabled = false;
    btn.textContent = 'Confirmer le retrait';
    const err = await res.json().catch(() => ({}));
    alert(err.detail || 'Erreur lors du retrait.');
  }
}

load();
