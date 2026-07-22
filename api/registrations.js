/**
 * Vercel Serverless Function: /api/registrations
 * Methods: GET (admin list / health), POST (public upsert), PATCH/DELETE (admin)
 */

const {
  getAdminKey,
  listRegistrations,
  upsertRegistration,
  updateRegistration,
  deleteRegistration,
  storageMode,
} = require("./lib/store");

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Admin-Key");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
}

function requireAdmin(req) {
  const key = req.headers["x-admin-key"] || "";
  return Boolean(key && key === getAdminKey());
}

function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string" && req.body) {
    try {
      return JSON.parse(req.body);
    } catch (_err) {
      return {};
    }
  }
  return {};
}

module.exports = async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    return res.end();
  }

  try {
    if (req.method === "GET" && (req.query?.health === "1" || req.query?.health === 1)) {
      return res.status(200).json({ ok: true, storage: storageMode() });
    }

    if (req.method === "POST") {
      const body = readBody(req);
      const saved = await upsertRegistration(body, { merge: true });
      return res.status(200).json({ ok: true, registration: saved, storage: storageMode() });
    }

    if (req.method === "GET") {
      if (!requireAdmin(req)) {
        return res.status(401).json({ ok: false, error: "Unauthorized" });
      }
      const status = req.query?.status || "all";
      const q = req.query?.q || "";
      const rows = await listRegistrations({ status, q });
      return res.status(200).json({ ok: true, registrations: rows, storage: storageMode() });
    }

    if (req.method === "PATCH") {
      if (!requireAdmin(req)) {
        return res.status(401).json({ ok: false, error: "Unauthorized" });
      }
      const body = readBody(req);
      const localId = body.localId || body.local_id;
      if (!localId) {
        return res.status(400).json({ ok: false, error: "localId required" });
      }
      const updated = await updateRegistration(localId, body);
      if (!updated) {
        return res.status(404).json({ ok: false, error: "Not found" });
      }
      return res.status(200).json({ ok: true, registration: updated });
    }

    if (req.method === "DELETE") {
      if (!requireAdmin(req)) {
        return res.status(401).json({ ok: false, error: "Unauthorized" });
      }
      const body = readBody(req);
      const localId = body.localId || body.local_id || req.query?.localId || req.query?.local_id;
      if (!localId) {
        return res.status(400).json({ ok: false, error: "localId required" });
      }
      await deleteRegistration(localId);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ ok: false, error: "Method not allowed" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: err.message || "Server error" });
  }
};
