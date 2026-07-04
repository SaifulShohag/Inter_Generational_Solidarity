const API_BASE = 'http://localhost:8000';

export interface ApiUser {
  id: number;
  name: string;
  email: string;
  role: 'requester' | 'volunteer';
  phone: string | null;
  avg_rating: number;
  total_reviews: number;
  created_at: string;
}

interface AuthResponse {
  token: string;
  user: ApiUser;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const detail = err.detail ?? err.message ?? `Erreur ${res.status}`;
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
  }
  return res.json();
}

export async function apiLogin(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse<AuthResponse>(res);
}

export async function apiRegister(
  name: string,
  email: string,
  password: string,
  role: 'requester' | 'volunteer',
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, role }),
  });
  return handleResponse<AuthResponse>(res);
}

export async function apiStartConversation(token: string): Promise<string> {
  const res = await fetch(`${API_BASE}/conversations/start`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await handleResponse<{ session_id: string }>(res);
  return data.session_id;
}

export async function apiSendMessage(
  token: string,
  sessionId: string,
  text: string,
): Promise<ReadableStreamDefaultReader<Uint8Array>> {
  const res = await fetch(`${API_BASE}/conversations/${sessionId}/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ text }),
  });
  if (!res.ok || !res.body) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? "Échec de l'envoi du message");
  }
  return res.body.getReader();
}

// ── Help Requests ────────────────────────────────────────────────────────────

export interface HelpRequestApi {
  id: number;
  requester_id: number;
  requester_name: string | null;
  title: string;
  description: string;
  category: 'medical' | 'grocery' | 'cleaning' | 'transport' | 'other';
  scheduled_at: string;
  location_text: string;
  latitude: number | null;
  longitude: number | null;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface AssignedMissionApi extends HelpRequestApi {
  accepted_at: string;
  completed_at: string | null;
}

export async function apiGetMissions(token: string): Promise<HelpRequestApi[]> {
  const res = await fetch(`${API_BASE}/requests?status=pending&limit=50`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<HelpRequestApi[]>(res);
}

export async function apiGetMyAssignments(token: string): Promise<AssignedMissionApi[]> {
  const res = await fetch(`${API_BASE}/requests/assigned-to-me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<AssignedMissionApi[]>(res);
}

export async function apiAcceptMission(token: string, requestId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/requests/${requestId}/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ eta_minutes: 0 }),
  });
  await handleResponse(res);
}

// ── SSE streaming ─────────────────────────────────────────────────────────────

export async function* streamResponse(
  reader: ReadableStreamDefaultReader<Uint8Array>,
): AsyncGenerator<string> {
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

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
        if (content.startsWith('[DONE]')) continue;
        if (content.startsWith('[ERROR]')) throw new Error(content.slice(7).trim() || 'Agent error');
        yield content;
      }
      boundary = buffer.indexOf('\n\n');
    }
  }

  if (buffer.trim()) {
    for (const line of buffer.split('\n')) {
      if (!line.startsWith('data:')) continue;
      const content = line.startsWith('data: ') ? line.slice(6) : line.slice(5);
      if (content.startsWith('[DONE]') || content.startsWith('[ERROR]')) continue;
      yield content;
    }
  }
}
