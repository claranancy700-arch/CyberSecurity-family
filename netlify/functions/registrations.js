const {
  getAdminKey,
  listRegistrations,
  upsertRegistration,
  updateRegistration,
  deleteRegistration,
  storageMode,
} = require("./_lib/store");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, X-Admin-Key",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Content-Type": "application/json",
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(body),
  };
}

function requireAdmin(event) {
  const key = event.headers["x-admin-key"] || event.headers["X-Admin-Key"] || "";
  return key && key === getAdminKey();
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  try {
    // Health / mode
    if (event.httpMethod === "GET" && event.queryStringParameters?.health === "1") {
      return json(200, { ok: true, storage: storageMode() });
    }

    // Public create / client update (submit + payment confirm)
    if (event.httpMethod === "POST") {
      const body = event.body ? JSON.parse(event.body) : {};
      // Clients may update their own draft by localId (payment confirm)
      const saved = await upsertRegistration(body, { merge: true });
      return json(200, { ok: true, registration: saved, storage: storageMode() });
    }

    // Admin list
    if (event.httpMethod === "GET") {
      if (!requireAdmin(event)) return json(401, { ok: false, error: "Unauthorized" });
      const status = event.queryStringParameters?.status || "all";
      const q = event.queryStringParameters?.q || "";
      const rows = await listRegistrations({ status, q });
      return json(200, { ok: true, registrations: rows, storage: storageMode() });
    }

    // Admin update status / notes
    if (event.httpMethod === "PATCH") {
      if (!requireAdmin(event)) return json(401, { ok: false, error: "Unauthorized" });
      const body = event.body ? JSON.parse(event.body) : {};
      const localId = body.localId || body.local_id;
      if (!localId) return json(400, { ok: false, error: "localId required" });
      const updated = await updateRegistration(localId, body);
      if (!updated) return json(404, { ok: false, error: "Not found" });
      return json(200, { ok: true, registration: updated });
    }

    // Admin delete
    if (event.httpMethod === "DELETE") {
      if (!requireAdmin(event)) return json(401, { ok: false, error: "Unauthorized" });
      const body = event.body ? JSON.parse(event.body) : {};
      const localId =
        body.localId ||
        body.local_id ||
        event.queryStringParameters?.localId ||
        event.queryStringParameters?.local_id;
      if (!localId) return json(400, { ok: false, error: "localId required" });
      await deleteRegistration(localId);
      return json(200, { ok: true });
    }

    return json(405, { ok: false, error: "Method not allowed" });
  } catch (err) {
    console.error(err);
    return json(500, { ok: false, error: err.message || "Server error" });
  }
};
