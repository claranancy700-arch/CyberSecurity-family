/**
 * Local API server for CyberTech-Family registrations.
 * Mirrors Netlify function routes at /api/registrations
 *
 *   npm install
 *   npm run dev
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const {
  getAdminKey,
  listRegistrations,
  upsertRegistration,
  updateRegistration,
  deleteRegistration,
  storageMode,
} = require("./netlify/functions/_lib/store");

const app = express();
const PORT = Number(process.env.PORT || 8787);

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Static site
app.use(express.static(path.join(__dirname)));

function requireAdmin(req, res) {
  const key = req.get("X-Admin-Key") || "";
  if (!key || key !== getAdminKey()) {
    res.status(401).json({ ok: false, error: "Unauthorized" });
    return false;
  }
  return true;
}

app.get("/api/registrations", async (req, res) => {
  try {
    if (req.query.health === "1") {
      return res.json({ ok: true, storage: storageMode() });
    }
    if (!requireAdmin(req, res)) return;
    const rows = await listRegistrations({
      status: req.query.status || "all",
      q: req.query.q || "",
    });
    res.json({ ok: true, registrations: rows, storage: storageMode() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post("/api/registrations", async (req, res) => {
  try {
    const saved = await upsertRegistration(req.body || {}, { merge: true });
    res.json({ ok: true, registration: saved, storage: storageMode() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.patch("/api/registrations", async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const localId = req.body?.localId || req.body?.local_id;
    if (!localId) return res.status(400).json({ ok: false, error: "localId required" });
    const updated = await updateRegistration(localId, req.body || {});
    if (!updated) return res.status(404).json({ ok: false, error: "Not found" });
    res.json({ ok: true, registration: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.delete("/api/registrations", async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const localId = req.body?.localId || req.query.localId;
    if (!localId) return res.status(400).json({ ok: false, error: "localId required" });
    await deleteRegistration(localId);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, storage: storageMode(), adminKeySet: Boolean(process.env.ADMIN_KEY) });
});

app.listen(PORT, () => {
  console.log(`CTF server http://127.0.0.1:${PORT}`);
  console.log(`  storage: ${storageMode()}`);
  console.log(`  admin key: ${getAdminKey() === "CTF-Admin-2026" ? "default (change ADMIN_KEY)" : "from env"}`);
  console.log(`  site:  http://127.0.0.1:${PORT}/index.html`);
  console.log(`  admin: http://127.0.0.1:${PORT}/admin.html`);
});
