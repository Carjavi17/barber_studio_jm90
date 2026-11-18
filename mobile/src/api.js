import { API_URL } from './config';

let authToken = null;
let onSessionExpired = null;

export function setAuthToken(token) {
  authToken = token;
}

// App.js registers a function that logs the user out
export function setSessionExpiredHandler(handler) {
  onSessionExpired = handler;
}

export async function apiRequest(path, { method = 'GET', body } = {}) {
  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor. Revisa tu conexión.');
  }

  const data = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.error || 'Ocurrió un error inesperado';

    // 401 while logged in = the session is no longer valid.
    // Checked at response time, so only the first of several requests triggers the logout.
    if (response.status === 401 && authToken && onSessionExpired) {
      onSessionExpired(message);
    }

    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data;
}