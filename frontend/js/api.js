const API_BASE = '';

const parseJsonResponse = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

async function apiFetch(path, opts = {}){
  const headers = opts.headers || {};
  const token = localStorage.getItem('token');
  if (token) headers['Authorization'] = 'Bearer ' + token;
  headers['Content-Type'] = 'application/json';
  const res = await fetch('/api' + path, { ...opts, headers });
  if (!res.ok) {
    const data = await parseJsonResponse(res);
    if (res.status === 401) {
      if (typeof clearSession === 'function') clearSession();
      else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      window.location.href = '/login.html';
    }
    throw new Error(data?.message || data?.error || 'API error');
  }
  return await parseJsonResponse(res);
}
