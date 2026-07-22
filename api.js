/**
 * Shared client API helper for site + admin pages.
 */
(function (global) {
  const DEFAULT_ADMIN_KEY = "CTF-Admin-2026";

  function apiBase() {
    // Prefer same-origin Vercel /api or Express /api
    // When opened as file:// fall back to local API
    if (location.protocol === "file:") {
      return "http://127.0.0.1:8787/api";
    }
    return `${location.origin}/api`;
  }

  async function request(path, options = {}) {
    const url = `${apiBase()}${path}`;
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };
    const res = await fetch(url, { ...options, headers });
    let data = null;
    try {
      data = await res.json();
    } catch (_err) {
      data = { ok: false, error: "Invalid JSON response" };
    }
    if (!res.ok) {
      const err = new Error(data?.error || `HTTP ${res.status}`);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  global.CTF_API = {
    DEFAULT_ADMIN_KEY,
    apiBase,
    health: () => request("/registrations?health=1"),
    submit: (registration) =>
      request("/registrations", {
        method: "POST",
        body: JSON.stringify(registration),
      }),
    list: (adminKey, { status = "all", q = "" } = {}) =>
      request(`/registrations?status=${encodeURIComponent(status)}&q=${encodeURIComponent(q)}`, {
        headers: { "X-Admin-Key": adminKey },
      }),
    update: (adminKey, patch) =>
      request("/registrations", {
        method: "PATCH",
        headers: { "X-Admin-Key": adminKey },
        body: JSON.stringify(patch),
      }),
    remove: (adminKey, localId) =>
      request("/registrations", {
        method: "DELETE",
        headers: { "X-Admin-Key": adminKey },
        body: JSON.stringify({ localId }),
      }),
  };
})(window);
