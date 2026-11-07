const DIRECT_BACKEND_ORIGIN = 'http://localhost:3001';

// Helper to safely parse JSON and prevent 'Unexpected token <, "<!DOCTYPE "... is not valid JSON'
async function safeParseJson(res) {
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await res.text();
    if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
      throw new Error('HTML_FALLBACK');
    }
    throw new Error(
      `Respon server bukan JSON (${res.status}). Pastikan server Backend sudah berjalan.`
    );
  }
  return res.json();
}

/**
 * Fetches an API endpoint.
 * 1. Tries relative path `/api/...` (via Vite proxy or same-origin production).
 * 2. If Vite dev server returns index.html (`<!DOCTYPE html>`) because Vite wasn't restarted,
 *    automatically falls back to `http://localhost:3001/api/...`.
 */
export async function apiFetch(path, options = {}) {
  try {
    const res = await fetch(path, options);
    const data = await safeParseJson(res);
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    // Fallback to direct Backend port 3001 if Vite returned HTML or connection failed
    try {
      const fallbackUrl = `${DIRECT_BACKEND_ORIGIN}${path}`;
      const res2 = await fetch(fallbackUrl, options);
      const data2 = await safeParseJson(res2);
      return { ok: res2.ok, status: res2.status, data: data2 };
    } catch {
      if (err.message === 'HTML_FALLBACK') {
        throw new Error(
          'Server Backend (port 3001) belum aktif atau perlu di-restart. Jalankan ulang "npm run dev" di terminal.'
        );
      }
      throw new Error(
        'Tidak dapat terhubung ke Server Backend (http://localhost:3001). Pastikan "npm run dev" sudah dijalankan.'
      );
    }
  }
}

/**
 * Resolves image URL so `/uploads/...` works even if Vite proxy isn't restarted yet.
 */
export function resolveImageUrl(url) {
  if (!url) return '';
  if (
    url.startsWith('/uploads/') &&
    typeof window !== 'undefined' &&
    window.location.port &&
    window.location.port !== '3001'
  ) {
    return `${DIRECT_BACKEND_ORIGIN}${url}`;
  }
  return url;
}

