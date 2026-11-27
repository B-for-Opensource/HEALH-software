const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://127.0.0.1:8000';
const WS_BASE = API_BASE.replace(/^http/, 'ws');

export function getAuthToken(): string | null {
  try {
    const raw = localStorage.getItem('heal-auth-storage');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.state?.token) return parsed.state.token;
    }
  } catch {}
  return localStorage.getItem('heal_token');
}

export function getActiveBranchHeader(): string {
  return sessionStorage.getItem('HEAL_ACTIVE_BRANCH_TAB') || localStorage.getItem('HEAL_ACTIVE_BRANCH') || 'krn-branch-001';
}

export async function apiRequest<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Branch-Id': getActiveBranchHeader(),
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    const refreshToken = localStorage.getItem('heal_refresh_token');
    if (refreshToken) {
      const refRes = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (refRes.ok) {
        const refJson = await refRes.json();
        if (refJson?.data?.token) {
          localStorage.setItem('heal_token', refJson.data.token);
          if (refJson.data.refresh_token) {
            localStorage.setItem('heal_refresh_token', refJson.data.refresh_token);
          }
          headers['Authorization'] = `Bearer ${refJson.data.token}`;
          const retryRes = await fetch(`${API_BASE}${path}`, { ...options, headers });
          const retryData = await retryRes.json();
          if (!retryRes.ok) throw new Error(retryData?.detail || 'API request failed');
          return retryData?.data ?? retryData;
        }
      }
    }
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.detail || json?.message || `HTTP ${res.status}`);
  }
  return json?.data !== undefined ? json.data : json;
}

export function connectPipelineWebSocket(onEvent: (event: string, data: any) => void): () => void {
  let ws: WebSocket | null = null;
  let closed = false;
  try {
    ws = new WebSocket(`${WS_BASE}/ws/pipeline`);
    ws.onmessage = (evt) => {
      try {
        const parsed = JSON.parse(evt.data);
        if (parsed?.event) onEvent(parsed.event, parsed.data);
      } catch {}
    };
  } catch {}
  return () => {
    closed = true;
    if (ws && !closed) ws.close();
    try { ws?.close(); } catch {}
  };
}

export { API_BASE };
