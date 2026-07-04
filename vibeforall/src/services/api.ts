const API_BASE = (import.meta as { env: Record<string, string> }).env.VITE_API_URL ?? 'http://localhost:8000';

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
        if (content.startsWith('[DONE]') || content.startsWith('[ERROR]')) continue;
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
