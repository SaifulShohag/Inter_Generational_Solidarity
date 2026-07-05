const API       = window.location.origin;
const TOKEN_KEY = 'vfa_token';
const ROLE_KEY  = 'vfa_role';

const token = localStorage.getItem(TOKEN_KEY);
if (!token || localStorage.getItem(ROLE_KEY) !== 'volunteer') {
  window.location.href = '/index.html';
}

document.getElementById('logout-link').addEventListener('click', e => {
  e.preventDefault();
  ['vfa_token','vfa_role','vfa_api_user','vfa_session_id'].forEach(k => localStorage.removeItem(k));
  window.location.href = '/index.html';
});

const catIcon = { medical:'🏥', grocery:'🛒', cleaning:'🧹', transport:'🚗', other:'💬' };
const catLabel = { medical:'Médical', grocery:'Courses', cleaning:'Ménage', transport:'Transport', other:'Autre' };
const priCfg = {
  urgent: { label:'🔴 Urgent',  cls:'badge priority-urgent', bar:'#dc2626' },
  medium: { label:'🟡 Moyen',   cls:'badge priority-medium', bar:'var(--warning)' },
  low:    { label:'🟢 Faible',  cls:'badge priority-low',    bar:'var(--success)' },
};

let allRequests = [];
let activeCat = 'all';
let activePri = 'all';
let searchQ   = '';

// Build category chips
const cats = [
  { value:'all', icon:'🌟', label:'Tout' },
  { value:'transport', icon:'🚗', label:'Transport' },
  { value:'grocery',   icon:'🛒', label:'Courses' },
  { value:'medical',   icon:'🏥', label:'Médical' },
  { value:'cleaning',  icon:'🧹', label:'Ménage' },
  { value:'other',     icon:'💬', label:'Autre' },
];
const catFilter = document.getElementById('cat-filter');
cats.forEach(c => {
  const btn = document.createElement('button');
  btn.className = `filter-chip ${c.value === 'all' ? 'active' : ''}`;
  btn.dataset.val = c.value;
  btn.innerHTML = `${c.icon} ${c.label}`;
  btn.addEventListener('click', () => {
    activeCat = c.value;
    catFilter.querySelectorAll('.filter-chip').forEach(el => el.classList.toggle('active', el.dataset.val === c.value));
    render();
  });
  catFilter.appendChild(btn);
});

// Priority chips
const pris = [
  { value:'all', label:'Toutes urgences' },
  { value:'urgent', label:'🔴 Urgente' },
  { value:'medium', label:'🟡 Moyenne' },
  { value:'low',    label:'🟢 Faible' },
];
const priFilter = document.getElementById('pri-filter');
pris.forEach(p => {
  const btn = document.createElement('button');
  btn.className = `filter-chip active-accent ${p.value === 'all' ? 'active-accent' : ''}`;
  btn.dataset.val = p.value;
  btn.style.cssText = p.value === 'all' ? 'border-color:var(--accent);background:var(--accent-light);color:var(--accent)' : '';
  btn.textContent = p.label;
  btn.addEventListener('click', () => {
    activePri = p.value;
    priFilter.querySelectorAll('.filter-chip').forEach(el => {
      const isActive = el.dataset.val === p.value;
      el.style.cssText = isActive ? 'border-color:var(--accent);background:var(--accent-light);color:var(--accent)' : '';
    });
    render();
  });
  priFilter.appendChild(btn);
});

document.getElementById('search').addEventListener('input', e => { searchQ = e.target.value.toLowerCase(); render(); });

function render() {
  const filtered = allRequests.filter(r => {
    if (activeCat !== 'all' && r.category !== activeCat) return false;
    if (activePri !== 'all' && r.priority !== activePri) return false;
    if (searchQ && !r.title.toLowerCase().includes(searchQ) && !r.description.toLowerCase().includes(searchQ)) return false;
    return true;
  });

  document.getElementById('count-label').textContent = `${filtered.length} mission${filtered.length !== 1 ? 's' : ''} trouvée${filtered.length !== 1 ? 's' : ''}`;

  if (!filtered.length) {
    document.getElementById('missions-list').innerHTML = '<div class="empty-state"><div style="font-size:3rem;margin-bottom:14px">🔍</div><h3 style="margin-bottom:6px">Aucune mission trouvée</h3><p>Essayez de modifier vos filtres</p></div>';
    return;
  }

  document.getElementById('missions-list').innerHTML = filtered.map(r => {
    const ic  = catIcon[r.category] || '💬';
    const pc  = priCfg[r.priority]  || priCfg.medium;
    const dt  = new Date(r.scheduled_at).toLocaleDateString('fr-FR', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' });
    return `
    <div class="mission-item animate-slide" onclick="window.location.href='/mission-detail.html?id=${r.id}'">
      <div style="height:4px;background:${pc.bar}"></div>
      <div class="mission-body">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px">
          <div style="flex:1">
            <div class="mission-title">${ic} ${r.title}</div>
            <div class="mission-desc">${r.description}</div>
          </div>
          <span class="${pc.cls}">${pc.label}</span>
        </div>
        <div class="mission-meta">
          <span>📅 ${dt}</span>
          <span>📍 ${r.location_text}</span>
          <span>🏷️ ${catLabel[r.category] || 'Autre'}</span>
        </div>
      </div>
      <div class="mission-actions">
        <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation()">Décliner</button>
        <button class="btn btn-primary btn-sm" style="flex:1" onclick="event.stopPropagation();window.location.href='/mission-detail.html?id=${r.id}'">Voir la mission →</button>
      </div>
    </div>`;
  }).join('');
}

async function load() {
  const res = await fetch(`${API}/requests?status=pending&limit=50`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    document.getElementById('missions-list').innerHTML = '<div class="empty-state"><p>Impossible de charger les missions. Vérifiez votre connexion.</p></div>';
    return;
  }
  allRequests = await res.json();
  render();
}
load();
