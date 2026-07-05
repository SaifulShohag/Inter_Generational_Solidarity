const API         = window.location.origin;
const TOKEN_KEY   = 'vfa_token';
const ROLE_KEY    = 'vfa_role';
const USER_KEY    = 'vfa_api_user';
const SESSION_KEY = 'vfa_session_id';

// ── Auth guard ──
const token = localStorage.getItem(TOKEN_KEY);
const role  = localStorage.getItem(ROLE_KEY);
if (!token || role !== 'elderly') { window.location.href = '/index.html'; }
const user = JSON.parse(localStorage.getItem(USER_KEY) || '{}');
const userInitial = (user.name || 'U')[0].toUpperCase();

// ── DOM refs ──
const messagesEl    = document.getElementById('messages');
const msgInput      = document.getElementById('msg-input');
const sendBtn       = document.getElementById('send-btn');
const micBtn        = document.getElementById('mic-btn');
const transcriptEl  = document.getElementById('transcript-hint');
const historyList   = document.getElementById('history-list');
const successBanner = document.getElementById('success-banner');
const ttsToggleBtn  = document.getElementById('tts-toggle');

// ── Language detection for TTS ──
function detectLang(text) {
  const sample = text.slice(0, 300).toLowerCase();
  const scores = {
    'fr-FR': (sample.match(/\b(je|tu|il|nous|vous|ils|est|sont|avec|pour|dans|sur|une|les|des|mon|ma|ce|qui|que|pas|plus|bien|mais|bonjour|merci|votre|vous)\b/g) || []).length,
    'en-US': (sample.match(/\b(the|is|are|was|were|have|has|will|would|can|could|should|this|that|your|with|from|they|their|hello|thank|please|request)\b/g) || []).length,
    'ar-SA': (sample.match(/[\u0600-\u06FF]/g) || []).length,
    'es-ES': (sample.match(/\b(el|la|los|las|es|son|con|para|que|por|una|del|hola|gracias|su|muy)\b/g) || []).length,
  };
  // Pick the language with the highest score; fall back to browser language
  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return best[1] > 0 ? best[0] : (navigator.language || 'fr-FR');
}

// ── TTS toggle ──
const TTS_KEY = 'vfa_tts';
let ttsEnabled = localStorage.getItem(TTS_KEY) !== 'off';

function updateTtsBtn() {
  ttsToggleBtn.textContent = ttsEnabled ? '🔊' : '🔇';
  ttsToggleBtn.title = ttsEnabled ? 'Désactiver la lecture vocale' : 'Activer la lecture vocale';
  ttsToggleBtn.style.opacity = ttsEnabled ? '1' : '0.5';
}
updateTtsBtn();

ttsToggleBtn.addEventListener('click', () => {
  ttsEnabled = !ttsEnabled;
  localStorage.setItem(TTS_KEY, ttsEnabled ? 'on' : 'off');
  if (!ttsEnabled) window.speechSynthesis?.cancel();
  updateTtsBtn();
});

// ── State ──
let currentSessionId = null;
let isBusy = false;

// ── Auto-resize textarea ──
msgInput.addEventListener('input', () => {
  msgInput.style.height = 'auto';
  msgInput.style.height = Math.min(msgInput.scrollHeight, 140) + 'px';
});

// ── Helpers ──
function fmt(ts) {
  return new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}
function now() {
  return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}
function scrollBottom() {
  messagesEl.scrollTo({ top: messagesEl.scrollHeight, behavior: 'smooth' });
}
function setComposerEnabled(enabled) {
  msgInput.disabled  = !enabled;
  sendBtn.disabled   = !enabled;
}

// ── Add message bubble ──
function addBubble(role, text, animate = true) {
  const row = document.createElement('div');
  row.className = `msg-row ${role} ${animate ? 'animate-slide' : ''}`;

  const avatarEl = document.createElement('div');
  avatarEl.className = `msg-avatar ${role === 'user' ? 'user' : 'bot'}`;
  avatarEl.textContent = role === 'user' ? userInitial : '🤖';

  const content = document.createElement('div');
  content.className = 'msg-content';

  const bubble = document.createElement('div');
  bubble.className = `bubble bubble-${role === 'user' ? 'user' : 'agent'}`;
  bubble.textContent = text;

  const time = document.createElement('div');
  time.className = 'bubble-time';
  time.textContent = now();

  content.appendChild(bubble);
  content.appendChild(time);
  row.appendChild(avatarEl);
  row.appendChild(content);
  messagesEl.appendChild(row);
  scrollBottom();
  return bubble;
}

// ── Streaming agent bubble ──
function addStreamingBubble() {
  const row = document.createElement('div');
  row.className = 'msg-row agent animate-slide';
  row.id = 'streaming-row';

  const avatarEl = document.createElement('div');
  avatarEl.className = 'msg-avatar bot';
  avatarEl.textContent = '🤖';

  const content = document.createElement('div');
  content.className = 'msg-content';

  const bubble = document.createElement('div');
  bubble.className = 'bubble bubble-agent';
  bubble.id = 'streaming-bubble';

  content.appendChild(bubble);
  row.appendChild(avatarEl);
  row.appendChild(content);
  messagesEl.appendChild(row);
  scrollBottom();
  return bubble;
}

function addTypingIndicator() {
  const row = document.createElement('div');
  row.className = 'msg-row agent';
  row.id = 'typing-row';

  const avatarEl = document.createElement('div');
  avatarEl.className = 'msg-avatar bot';
  avatarEl.textContent = '🤖';

  const wrap = document.createElement('div');
  wrap.className = 'typing-wrap';
  [0,1,2].forEach(i => {
    const d = document.createElement('div');
    d.className = 'typing-dot';
    wrap.appendChild(d);
  });

  row.appendChild(avatarEl);
  row.appendChild(wrap);
  messagesEl.appendChild(row);
  scrollBottom();
}
function removeTypingIndicator() {
  document.getElementById('typing-row')?.remove();
  document.getElementById('streaming-row')?.remove();
}

// ── Load previous sessions — returns the list for init() to use ──
async function loadSessions() {
  historyList.innerHTML = '<div class="history-empty">Chargement…</div>';
  try {
    const res  = await fetch(`${API}/conversations`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error();
    const sessions = await res.json();

    if (!sessions.length) {
      historyList.innerHTML = '<div class="history-empty">Aucune conversation pour l\'instant.</div>';
      return sessions;
    }
    historyList.innerHTML = '';
    sessions.forEach(s => {
      const item = document.createElement('div');
      item.className = 'session-item';
      if (s.session_id === currentSessionId) item.classList.add('active');
      item.dataset.sid = s.session_id;

      const label = s.request_id
        ? `✅ Demande #${s.request_id}`
        : `💬 ${s.message_count} message${s.message_count !== 1 ? 's' : ''}`;

      const date = new Date(s.updated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

      item.innerHTML = `
        <div class="session-item-title">${label}</div>
        <div class="session-item-meta">
          <span class="badge badge-${s.status === 'completed' ? 'green' : 'blue'}">${s.status === 'completed' ? '✅ Terminé' : '🔵 Actif'}</span>
          <span>${date}</span>
        </div>`;
      item.addEventListener('click', () => loadSession(s.session_id));
      historyList.appendChild(item);
    });
    return sessions;
  } catch {
    historyList.innerHTML = '<div class="history-empty">Impossible de charger les conversations.</div>';
    return [];
  }
}

// ── Load a specific session's history ──
async function loadSession(sessionId) {
  currentSessionId = sessionId;
  messagesEl.innerHTML = '';
  setComposerEnabled(false);
  successBanner.style.display = 'none';

  // Highlight active in sidebar
  document.querySelectorAll('.session-item').forEach(el => {
    el.classList.toggle('active', el.dataset.sid === sessionId);
  });

  try {
    const res  = await fetch(`${API}/conversations/${sessionId}/history`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      if (res.status === 404) { await startNewSession(); return; }
      throw new Error();
    }
    const data = await res.json();

    data.messages.forEach(m => {
      if (m.role === 'tool') return;          // skip tool result messages
      if (!m.content || !m.content.trim()) return;  // skip null/empty (tool-call-only turns)
      addBubble(m.role === 'user' ? 'user' : 'agent', m.content, false);
    });

    if (data.status === 'completed' && data.request_id) {
      await verifyAndShowSuccess(data.request_id);
    }

    setComposerEnabled(true);
  } catch {
    addSystemMsg('⚠️ Impossible de charger cette conversation.');
    setComposerEnabled(true);
  }
}

// ── Start a brand-new session ──
async function startNewSession() {
  currentSessionId = null;
  messagesEl.innerHTML = '';
  successBanner.style.display = 'none';
  setComposerEnabled(false);

  try {
    const res  = await fetch(`${API}/conversations/start`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    currentSessionId = data.session_id;

    addBubble('agent', 'Bonjour ! Je suis votre assistant. Comment puis-je vous aider aujourd\'hui ? 😊', true);
    setComposerEnabled(true);
    await loadSessions();
  } catch (e) {
    addSystemMsg('⚠️ Impossible de démarrer une conversation. Vérifiez votre connexion.');
  }
}

// ── Verify request exists in DB before showing success banner ──
async function verifyAndShowSuccess(requestId) {
  try {
    const res = await fetch(`${API}/requests/${requestId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const { request } = await res.json();
      if (request && request.id) {
        successBanner.style.display = 'flex';
      }
    }
  } catch {}
}

function addSystemMsg(text) {
  const p = document.createElement('p');
  p.style.cssText = 'text-align:center;font-size:.82rem;color:var(--muted);padding:8px 0';
  p.textContent = text;
  messagesEl.appendChild(p);
}

// ── Send message ──
async function sendMessage(text) {
  if (!text.trim() || isBusy || !currentSessionId) return;
  isBusy = true;
  setComposerEnabled(false);

  addBubble('user', text);
  addTypingIndicator();

  let streamingBubble = null;
  let fullReply = '';
  let requestCreated = false;

  try {
    const res = await fetch(`${API}/conversations/${currentSessionId}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ text })
    });

    if (!res.ok || !res.body) {
      if (res.status === 404) {
        removeTypingIndicator();
        await startNewSession();
        return;
      }
      throw new Error('Échec de l\'envoi.');
    }

    const reader  = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    // Create bubble lazily — only when first real content token arrives
    // This avoids empty bubbles when the model starts with a tool call

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let boundary = buffer.indexOf('\n\n');
      while (boundary !== -1) {
        const block = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        for (const line of block.split('\n')) {
          if (!line.startsWith('data:')) continue;
          const content = line.startsWith('data: ') ? line.slice(6) : line.slice(5);
          if (content.startsWith('[DONE]')) {
            requestCreated = content.includes('request_created=True');
            continue;
          }
          if (content.startsWith('[ERROR]')) {
            removeTypingIndicator();
            addBubble('agent', '⚠️ Une erreur est survenue.');
            return;
          }
          // First real token — swap typing indicator for streaming bubble
          if (!streamingBubble) {
            removeTypingIndicator();
            streamingBubble = addStreamingBubble();
          }
          fullReply += content;
          streamingBubble.textContent = fullReply + '▍';
          scrollBottom();
        }
        boundary = buffer.indexOf('\n\n');
      }
    }

    if (streamingBubble) {
      // Remove cursor; if reply ended up empty, remove the bubble entirely
      if (fullReply.trim()) {
        streamingBubble.textContent = fullReply;
      } else {
        document.getElementById('streaming-row')?.remove();
        streamingBubble = null;
      }
    } else {
      // Model replied with pure tool call and no final text — remove typing indicator
      removeTypingIndicator();
    }
    if (requestCreated) {
      // Re-fetch the session to get the real request_id from DB — never trust SSE alone
      try {
        const confirm = await fetch(`${API}/conversations/${currentSessionId}/history`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (confirm.ok) {
          const session = await confirm.json();
          if (session.status === 'completed' && session.request_id) {
            await verifyAndShowSuccess(session.request_id);
          }
        }
      } catch {}
      await loadSessions();
    }

    // TTS (only if enabled)
    if (ttsEnabled && fullReply && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(fullReply);
      u.lang = detectLang(fullReply);
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    }

  } catch (err) {
    removeTypingIndicator();
    if (streamingBubble) streamingBubble.textContent = '⚠️ Erreur. Veuillez réessayer.';
    else addBubble('agent', '⚠️ Erreur. Veuillez réessayer.');
  } finally {
    isBusy = false;
    setComposerEnabled(true);
    msgInput.focus();
  }
}

// ── Send button / Enter key ──
sendBtn.addEventListener('click', () => {
  const text = msgInput.value.trim();
  if (text) { msgInput.value = ''; msgInput.style.height = 'auto'; sendMessage(text); }
});
msgInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendBtn.click(); }
});

// ── New chat buttons ──
document.getElementById('new-chat-btn').addEventListener('click',  startNewSession);
document.getElementById('new-chat-btn2').addEventListener('click', startNewSession);

// ── Mic (Web Speech API) ──
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SR ? new SR() : null;
if (recognition) {
  recognition.lang = 'fr-FR';
  recognition.continuous = false;
  recognition.interimResults = true;

  recognition.onresult = e => {
    let final = '', interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) final += e.results[i][0].transcript;
      else interim += e.results[i][0].transcript;
    }
    const txt = (final || interim).trim();
    if (txt) { msgInput.value = txt; transcriptEl.textContent = txt; }
  };

  recognition.onend = () => {
    micBtn.classList.remove('listening');
    micBtn.title = 'Dicter';
    // If text was filled, auto-send
    const txt = msgInput.value.trim();
    if (txt) { msgInput.value = ''; msgInput.style.height = 'auto'; sendMessage(txt); }
  };

  recognition.onerror = e => {
    micBtn.classList.remove('listening');
    transcriptEl.textContent = `Micro indisponible (${e.error}). Tapez à la place.`;
  };

  micBtn.addEventListener('click', () => {
    if (micBtn.classList.contains('listening')) {
      recognition.stop();
    } else {
      window.speechSynthesis?.cancel();
      micBtn.classList.add('listening');
      transcriptEl.textContent = 'Écoute en cours…';
      try { recognition.start(); } catch {}
    }
  });
} else {
  micBtn.title = 'Micro non supporté dans ce navigateur';
  micBtn.style.opacity = '.4';
  micBtn.disabled = true;
}

// ── Init: load sessions from server, open right one or start new ──
(async function init() {
  const params = new URLSearchParams(window.location.search);

  if (params.get('mode') === 'voice') {
    setTimeout(() => { if (recognition) micBtn.click(); }, 800);
  }

  // If a specific session was requested (from "Voir la conversation"), load it directly
  const sessionParam = params.get('session');
  if (sessionParam) {
    await loadSessions();
    await loadSession(sessionParam);
    return;
  }

  // Otherwise find the most recent active session from server
  const sessions = await loadSessions();
  const active   = sessions?.find(s => s.status === 'active');

  if (active) {
    await loadSession(active.session_id);
  } else {
    await startNewSession();
  }
})();
