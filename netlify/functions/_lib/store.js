/**
 * Registration store: Neon Postgres when DATABASE_URL is set,
 * otherwise a JSON file under /data (local) or /tmp (serverless).
 */

const fs = require("fs");
const path = require("path");

const STATUSES = new Set([
  "awaiting_payment",
  "payment_submitted",
  "verified",
  "admitted",
  "rejected",
]);

function getAdminKey() {
  return process.env.ADMIN_KEY || "CTF-Admin-2026";
}

function filePath() {
  if (process.env.DATA_FILE) return process.env.DATA_FILE;
  // Prefer project data/ locally; /tmp on ephemeral serverless if no Neon
  const local = path.join(process.cwd(), "data", "registrations.json");
  try {
    const dir = path.dirname(local);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return local;
  } catch (_err) {
    return path.join("/tmp", "ctf-registrations.json");
  }
}

function readFileStore() {
  const fp = filePath();
  try {
    if (!fs.existsSync(fp)) return [];
    const raw = JSON.parse(fs.readFileSync(fp, "utf8"));
    return Array.isArray(raw) ? raw : [];
  } catch (_err) {
    return [];
  }
}

function writeFileStore(rows) {
  const fp = filePath();
  fs.mkdirSync(path.dirname(fp), { recursive: true });
  fs.writeFileSync(fp, JSON.stringify(rows.slice(0, 500), null, 2), "utf8");
}

function rowFromDb(r) {
  if (!r) return null;
  return {
    localId: r.local_id,
    id: r.complaint_id || null,
    status: r.status,
    name: r.name || "",
    email: r.email || "",
    organization: r.organization || "",
    service: r.service || "",
    subject: r.subject || "",
    details: r.details || "",
    summary: r.summary || "",
    hasProof: r.has_proof || "",
    proofDetails: r.proof_details || "",
    contactMethod: r.contact_method || "",
    txHash: r.tx_hash || "",
    adminNotes: r.admin_notes || "",
    submittedAt: r.submitted_at || null,
    paidAt: r.paid_at || null,
    verifiedAt: r.verified_at || null,
    admittedAt: r.admitted_at || null,
    rejectedAt: r.rejected_at || null,
    updatedAt: r.updated_at || null,
  };
}

function normalizeIncoming(body = {}) {
  const localId =
    body.localId ||
    body.local_id ||
    `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  let status = body.status || "awaiting_payment";
  if (!STATUSES.has(status)) status = "awaiting_payment";

  return {
    localId,
    id: body.id || body.complaintId || body.complaint_id || null,
    status,
    name: String(body.name || "").trim(),
    email: String(body.email || "").trim(),
    organization: String(body.organization || "").trim(),
    service: String(body.service || "").trim(),
    subject: String(body.subject || "").trim(),
    details: String(body.details || "").trim(),
    summary: String(body.summary || "").trim(),
    hasProof: String(body.hasProof || body.has_proof || "").trim(),
    proofDetails: String(body.proofDetails || body.proof_details || "").trim(),
    contactMethod: String(body.contactMethod || body.contact_method || "").trim(),
    txHash: String(body.txHash || body.tx_hash || "").trim(),
    adminNotes: String(body.adminNotes || body.admin_notes || "").trim(),
    submittedAt: body.submittedAt || body.submitted_at || new Date().toISOString(),
    paidAt: body.paidAt || body.paid_at || null,
    verifiedAt: body.verifiedAt || body.verified_at || null,
    admittedAt: body.admittedAt || body.admitted_at || null,
    rejectedAt: body.rejectedAt || body.rejected_at || null,
    updatedAt: new Date().toISOString(),
  };
}

function getSql() {
  const url = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;
  if (!url) return null;
  // Lazy require so file-store mode works without the package in odd runtimes
  const { neon } = require("@neondatabase/serverless");
  return neon(url);
}

async function ensureSchema(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS registrations (
      local_id TEXT PRIMARY KEY,
      complaint_id TEXT,
      status TEXT NOT NULL DEFAULT 'awaiting_payment',
      name TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      organization TEXT NOT NULL DEFAULT '',
      service TEXT NOT NULL DEFAULT '',
      subject TEXT NOT NULL DEFAULT '',
      details TEXT NOT NULL DEFAULT '',
      summary TEXT NOT NULL DEFAULT '',
      has_proof TEXT NOT NULL DEFAULT '',
      proof_details TEXT NOT NULL DEFAULT '',
      contact_method TEXT NOT NULL DEFAULT '',
      tx_hash TEXT NOT NULL DEFAULT '',
      admin_notes TEXT NOT NULL DEFAULT '',
      submitted_at TIMESTAMPTZ,
      paid_at TIMESTAMPTZ,
      verified_at TIMESTAMPTZ,
      admitted_at TIMESTAMPTZ,
      rejected_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

async function listRegistrations({ status, q } = {}) {
  const sql = getSql();
  if (sql) {
    await ensureSchema(sql);
    const rows = await sql`SELECT * FROM registrations ORDER BY COALESCE(submitted_at, created_at) DESC NULLS LAST LIMIT 500`;
    let list = rows.map(rowFromDb);
    if (status && status !== "all") list = list.filter((r) => r.status === status);
    if (q) {
      const needle = q.toLowerCase();
      list = list.filter((r) =>
        [r.id, r.localId, r.name, r.email, r.organization, r.service, r.subject, r.summary, r.txHash]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(needle)
      );
    }
    return list;
  }

  let list = readFileStore();
  if (status && status !== "all") list = list.filter((r) => r.status === status);
  if (q) {
    const needle = q.toLowerCase();
    list = list.filter((r) =>
      [r.id, r.localId, r.name, r.email, r.organization, r.service, r.subject, r.summary, r.txHash]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }
  return list.sort((a, b) => String(b.submittedAt || "").localeCompare(String(a.submittedAt || "")));
}

async function upsertRegistration(body, { merge = true } = {}) {
  const incoming = normalizeIncoming(body);
  const sql = getSql();

  if (sql) {
    await ensureSchema(sql);
    const existing = await sql`SELECT * FROM registrations WHERE local_id = ${incoming.localId} LIMIT 1`;
    const prev = existing[0] ? rowFromDb(existing[0]) : null;
    const next = merge && prev ? { ...prev, ...incoming, localId: prev.localId } : incoming;

    await sql`
      INSERT INTO registrations (
        local_id, complaint_id, status, name, email, organization, service, subject,
        details, summary, has_proof, proof_details, contact_method, tx_hash, admin_notes,
        submitted_at, paid_at, verified_at, admitted_at, rejected_at, updated_at
      ) VALUES (
        ${next.localId}, ${next.id}, ${next.status}, ${next.name}, ${next.email},
        ${next.organization}, ${next.service}, ${next.subject}, ${next.details}, ${next.summary},
        ${next.hasProof}, ${next.proofDetails}, ${next.contactMethod}, ${next.txHash}, ${next.adminNotes},
        ${next.submittedAt}, ${next.paidAt}, ${next.verifiedAt}, ${next.admittedAt}, ${next.rejectedAt},
        ${next.updatedAt}
      )
      ON CONFLICT (local_id) DO UPDATE SET
        complaint_id = EXCLUDED.complaint_id,
        status = EXCLUDED.status,
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        organization = EXCLUDED.organization,
        service = EXCLUDED.service,
        subject = EXCLUDED.subject,
        details = EXCLUDED.details,
        summary = EXCLUDED.summary,
        has_proof = EXCLUDED.has_proof,
        proof_details = EXCLUDED.proof_details,
        contact_method = EXCLUDED.contact_method,
        tx_hash = EXCLUDED.tx_hash,
        admin_notes = EXCLUDED.admin_notes,
        submitted_at = EXCLUDED.submitted_at,
        paid_at = EXCLUDED.paid_at,
        verified_at = EXCLUDED.verified_at,
        admitted_at = EXCLUDED.admitted_at,
        rejected_at = EXCLUDED.rejected_at,
        updated_at = EXCLUDED.updated_at
    `;
    return next;
  }

  const rows = readFileStore();
  const idx = rows.findIndex((r) => r.localId === incoming.localId || (incoming.id && r.id === incoming.id));
  if (idx >= 0) {
    rows[idx] = merge ? { ...rows[idx], ...incoming, localId: rows[idx].localId } : incoming;
    writeFileStore(rows);
    return rows[idx];
  }
  rows.unshift(incoming);
  writeFileStore(rows);
  return incoming;
}

async function updateRegistration(localId, patch) {
  if (!localId) throw new Error("localId is required");
  const sql = getSql();
  const allowedStatus = patch.status && STATUSES.has(patch.status) ? patch.status : undefined;

  if (sql) {
    await ensureSchema(sql);
    const existing = await sql`SELECT * FROM registrations WHERE local_id = ${localId} LIMIT 1`;
    if (!existing[0]) return null;
    const prev = rowFromDb(existing[0]);
    const next = {
      ...prev,
      ...normalizeIncoming({ ...prev, ...patch, localId }),
      localId,
      status: allowedStatus || prev.status,
      updatedAt: new Date().toISOString(),
    };
    if (patch.status === "verified") next.verifiedAt = patch.verifiedAt || new Date().toISOString();
    if (patch.status === "admitted") next.admittedAt = patch.admittedAt || new Date().toISOString();
    if (patch.status === "rejected") next.rejectedAt = patch.rejectedAt || new Date().toISOString();
    if (patch.adminNotes !== undefined) next.adminNotes = String(patch.adminNotes);

    await sql`
      UPDATE registrations SET
        complaint_id = ${next.id},
        status = ${next.status},
        name = ${next.name},
        email = ${next.email},
        organization = ${next.organization},
        service = ${next.service},
        subject = ${next.subject},
        details = ${next.details},
        summary = ${next.summary},
        has_proof = ${next.hasProof},
        proof_details = ${next.proofDetails},
        contact_method = ${next.contactMethod},
        tx_hash = ${next.txHash},
        admin_notes = ${next.adminNotes},
        submitted_at = ${next.submittedAt},
        paid_at = ${next.paidAt},
        verified_at = ${next.verifiedAt},
        admitted_at = ${next.admittedAt},
        rejected_at = ${next.rejectedAt},
        updated_at = ${next.updatedAt}
      WHERE local_id = ${localId}
    `;
    return next;
  }

  const rows = readFileStore();
  const idx = rows.findIndex((r) => r.localId === localId);
  if (idx < 0) return null;
  const prev = rows[idx];
  const next = {
    ...prev,
    ...patch,
    localId,
    status: allowedStatus || prev.status,
    updatedAt: new Date().toISOString(),
  };
  if (patch.status === "verified") next.verifiedAt = patch.verifiedAt || new Date().toISOString();
  if (patch.status === "admitted") next.admittedAt = patch.admittedAt || new Date().toISOString();
  if (patch.status === "rejected") next.rejectedAt = patch.rejectedAt || new Date().toISOString();
  rows[idx] = next;
  writeFileStore(rows);
  return next;
}

async function deleteRegistration(localId) {
  const sql = getSql();
  if (sql) {
    await ensureSchema(sql);
    await sql`DELETE FROM registrations WHERE local_id = ${localId}`;
    return true;
  }
  const rows = readFileStore().filter((r) => r.localId !== localId);
  writeFileStore(rows);
  return true;
}

function storageMode() {
  return process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL ? "neon" : "file";
}

module.exports = {
  getAdminKey,
  listRegistrations,
  upsertRegistration,
  updateRegistration,
  deleteRegistration,
  storageMode,
  STATUSES,
};
