const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const api = {
  async get(path: string) {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const error: any = new Error('API Error');
      try { error.response = { data: await res.json() }; } catch { error.response = { data: { message: res.statusText } }; }
      throw error;
    }
    return { data: await res.json() };
  },

  async post(path: string, body?: any) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const error: any = new Error('API Error');
      try { error.response = { data: await res.json() }; } catch { error.response = { data: { message: res.statusText } }; }
      throw error;
    }
    return { data: await res.json() };
  },

  async patch(path: string, body?: any) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'PATCH',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const error: any = new Error('API Error');
      try { error.response = { data: await res.json() }; } catch { error.response = { data: { message: res.statusText } }; }
      throw error;
    }
    return { data: await res.json() };
  },

  async delete(path: string) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const error: any = new Error('API Error');
      try { error.response = { data: await res.json() }; } catch { error.response = { data: { message: res.statusText } }; }
      throw error;
    }
    return { data: await res.json() };
  },
};

export default api;
