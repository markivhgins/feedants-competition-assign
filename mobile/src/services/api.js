const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000/api').replace(/\/$/, '');
const USER_ID = process.env.EXPO_PUBLIC_USER_ID || 'demo-user-001';

async function parseResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `Request failed with ${response.status}`);
  return payload;
}

export async function getCompetition(slug) {
  const response = await fetch(`${API_BASE_URL}/competitions/${slug}?userId=${encodeURIComponent(USER_ID)}&_=${Date.now()}`,
    { cache: 'no-store' }
  );
  return parseResponse(response);
}

export async function registerCompetition(slug) {
  const response = await fetch(`${API_BASE_URL}/competitions/${slug}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: USER_ID })
  });
  return parseResponse(response);
}

export async function submitCompetition(slug, file) {
  const formData = new FormData();
  formData.append('userId', USER_ID);
  formData.append('file', file);
  const response = await fetch(`${API_BASE_URL}/competitions/${slug}/submission`, {
    method: 'POST',
    body: formData
  });
  return parseResponse(response);
}
