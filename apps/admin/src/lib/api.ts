const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Shared refresh state to prevent concurrent refresh attempts
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('admin_refresh');
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      // Refresh token expired — force logout
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_refresh');
      localStorage.removeItem('admin_user');
      window.location.href = '/';
      return null;
    }

    const data = await res.json();
    const newAccess = data.data?.accessToken || data.accessToken;
    const newRefresh = data.data?.refreshToken || data.refreshToken;

    if (newAccess) {
      localStorage.setItem('admin_token', newAccess);
      if (newRefresh) localStorage.setItem('admin_refresh', newRefresh);
      return newAccess;
    }
    return null;
  } catch {
    return null;
  }
}

async function getRefreshedToken(): Promise<string | null> {
  if (isRefreshing && refreshPromise) return refreshPromise;
  isRefreshing = true;
  refreshPromise = refreshAccessToken().finally(() => {
    isRefreshing = false;
    refreshPromise = null;
  });
  return refreshPromise;
}

async function fetchWithRefresh(path: string, options: RequestInit = {}): Promise<Response> {
  const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json', ...options.headers };
  let res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    const newToken = await getRefreshedToken();
    if (newToken) {
      const retryHeaders = { ...headers, Authorization: `Bearer ${newToken}` };
      res = await fetch(`${API_BASE}${path}`, { ...options, headers: retryHeaders });
    }
  }

  return res;
}

function parseError(res: Response) {
  const error: any = new Error('API Error');
  return res.json()
    .then((data) => { error.response = { data }; throw error; })
    .catch((e) => { if (e === error) throw e; error.response = { data: { message: res.statusText } }; throw error; });
}

const api = {
  async get(path: string) {
    const res = await fetchWithRefresh(path);
    if (!res.ok) return parseError(res);
    return { data: await res.json() };
  },

  async post(path: string, body?: any) {
    const res = await fetchWithRefresh(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) return parseError(res);
    return { data: await res.json() };
  },

  async patch(path: string, body?: any) {
    const res = await fetchWithRefresh(path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) return parseError(res);
    return { data: await res.json() };
  },

  async put(path: string, body?: any) {
    const res = await fetchWithRefresh(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) return parseError(res);
    return { data: await res.json() };
  },

  async delete(path: string) {
    const res = await fetchWithRefresh(path, { method: 'DELETE' });
    if (!res.ok) return parseError(res);
    return { data: await res.json() };
  },
};

export default api;
