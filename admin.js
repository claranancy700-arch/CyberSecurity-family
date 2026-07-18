(() => {
  const SESSION_KEY = "ctf_admin_session";
  const SESSION_KEY_VALUE = "ctf_admin_key";
  // Fallback only if api.js not loaded
  const FALLBACK_KEY = "CTF-Admin-2026";

  const loginView = document.getElementById("adminLogin");
  const appView = document.getElementById("adminApp");
  const loginForm = document.getElementById("loginForm");
  const loginStatus = document.getElementById("loginStatus");
  const passwordInput = document.getElementById("adminPassword");

  const statTotal = document.getElementById("statTotal");
  const statAwaiting = document.getElementById("statAwaiting");
  const statPayment = document.getElementById("statPayment");
  const statAdmitted = document.getElementById("statAdmitted");
  const tableBody = document.getElementById("regTableBody");
  const statusFilter = document.getElementById("statusFilter");
  const searchInput = document.getElementById("searchInput");
  const detailEmpty = document.getElementById("detailEmpty");
  const detailContent = document.getElementById("detailContent");
  const detailFields = document.getElementById("detailFields");
  const detailStatus = document.getElementById("detailStatus");
  const storageBadge = document.getElementById("storageBadge");
  const storageBadgeTop = document.getElementById("storageBadgeTop");

  let selectedLocalId = null;
  let cache = [];

  const expectedKey = () =>
    (window.CTF_API && window.CTF_API.DEFAULT_ADMIN_KEY) || FALLBACK_KEY;

  const getAdminKey = () => sessionStorage.getItem(SESSION_KEY_VALUE) || "";

  const isAuthed = () => sessionStorage.getItem(SESSION_KEY) === "1" && Boolean(getAdminKey());

  const setAuthed = (on, key = "") => {
    if (on) {
      sessionStorage.setItem(SESSION_KEY, "1");
      sessionStorage.setItem(SESSION_KEY_VALUE, key);
    } else {
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_KEY_VALUE);
    }
  };

  const showApp = (on) => {
    if (loginView) loginView.hidden = on;
    if (appView) appView.hidden = !on;
  };

  const formatDate = (iso) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString();
    } catch (_err) {
      return iso;
    }
  };

  const statusLabel = (status) => {
    const map = {
      awaiting_payment: "Awaiting payment",
      payment_submitted: "Payment submitted",
      verified: "Payment verified",
      admitted: "Admitted",
      rejected: "Rejected",
    };
    return map[status] || status || "Unknown";
  };

  const escapeHtml = (value) =>
    String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const setDetailMessage = (text, ok = true) => {
    if (!detailStatus) return;
    detailStatus.hidden = false;
    detailStatus.className = `form-status ${ok ? "is-success" : "is-error"}`;
    detailStatus.textContent = text;
  };

  const updateStats = (rows) => {
    if (statTotal) statTotal.textContent = String(rows.length);
    if (statAwaiting) {
      statAwaiting.textContent = String(rows.filter((r) => r.status === "awaiting_payment").length);
    }
    if (statPayment) {
      statPayment.textContent = String(
        rows.filter((r) => r.status === "payment_submitted" || r.status === "verified").length
      );
    }
    if (statAdmitted) {
      statAdmitted.textContent = String(rows.filter((r) => r.status === "admitted").length);
    }
  };

  const getFiltered = () => {
    const status = statusFilter?.value || "all";
    const q = (searchInput?.value || "").trim().toLowerCase();
    return cache.filter((row) => {
      if (status !== "all" && row.status !== status) return false;
      if (!q) return true;
      const hay = [
        row.id,
        row.localId,
        row.name,
        row.email,
        row.organization,
        row.service,
        row.subject,
        row.summary,
        row.txHash,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  };

  const renderTable = () => {
    updateStats(cache);
    const rows = getFiltered();

    if (!tableBody) return;
    if (!rows.length) {
      tableBody.innerHTML = `<tr><td colspan="5" class="admin-empty">No matching registrations.</td></tr>`;
      return;
    }

    tableBody.innerHTML = rows
      .map((row) => {
        const selected = row.localId === selectedLocalId ? " is-selected" : "";
        return `
          <tr class="${selected}" data-local-id="${escapeHtml(row.localId || "")}">
            <td>${escapeHtml(formatDate(row.submittedAt || row.paidAt))}</td>
            <td>
              <strong>${escapeHtml(row.name || "—")}</strong><br />
              <span style="color:var(--muted)">${escapeHtml(row.email || "")}</span>
            </td>
            <td>${escapeHtml(row.service || "—")}</td>
            <td><span class="admin-status ${escapeHtml(row.status || "")}">${escapeHtml(
              statusLabel(row.status)
            )}</span></td>
            <td><code>${escapeHtml(row.id || "—")}</code></td>
          </tr>
        `;
      })
      .join("");
  };

  const field = (label, value) => {
    if (value === undefined || value === null || value === "") return "";
    return `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(String(value))}</dd></div>`;
  };

  const renderDetail = () => {
    const row = cache.find((r) => r.localId === selectedLocalId);

    if (!row) {
      if (detailEmpty) detailEmpty.hidden = false;
      if (detailContent) detailContent.hidden = true;
      return;
    }

    if (detailEmpty) detailEmpty.hidden = true;
    if (detailContent) detailContent.hidden = false;
    if (detailFields) {
      detailFields.innerHTML = [
        field("Complaint ID / Tax ID", row.id || "Not generated yet"),
        field("Status", statusLabel(row.status)),
        field("Submitted", formatDate(row.submittedAt)),
        field("Paid at", formatDate(row.paidAt)),
        field("Verified at", formatDate(row.verifiedAt)),
        field("Admitted at", formatDate(row.admittedAt)),
        field("Name", row.name),
        field("Email", row.email),
        field("Organization", row.organization),
        field("Service", row.service),
        field("Subject", row.subject),
        field("Summary", row.summary),
        field("Details", row.details),
        field("Proof", row.hasProof),
        field("Proof details", row.proofDetails),
        field("Contact method", row.contactMethod),
        field("Tx hash", row.txHash),
        field("Local ID", row.localId),
        field("Admin notes", row.adminNotes),
      ].join("");
    }
  };

  const loadRegistrations = async () => {
    if (!window.CTF_API) {
      setDetailMessage("api.js failed to load.", false);
      return;
    }
    try {
      const data = await window.CTF_API.list(getAdminKey(), {
        status: "all",
        q: "",
      });
      cache = data.registrations || [];
      const modeLabel = `Storage: ${data.storage || "unknown"}`;
      if (storageBadge) storageBadge.textContent = modeLabel;
      if (storageBadgeTop) storageBadgeTop.textContent = modeLabel;
      renderTable();
      renderDetail();
    } catch (err) {
      cache = [];
      renderTable();
      if (loginStatus && !isAuthed()) {
        loginStatus.hidden = false;
        loginStatus.className = "form-status is-error";
        loginStatus.textContent = err.message || "Failed to reach API";
      } else {
        setDetailMessage(
          (err.message || "Failed to load") +
            " — start the API with npm run dev (or deploy Netlify functions).",
          false
        );
      }
    }
  };

  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const key = passwordInput?.value || "";

      // Verify key against API (any authorized list call)
      try {
        if (!window.CTF_API) throw new Error("API client missing");
        // Quick health first
        try {
          await window.CTF_API.health();
        } catch (_e) {
          throw new Error("API offline. Run npm run dev (port 8787) or deploy functions.");
        }
        await window.CTF_API.list(key, { status: "all" });
        setAuthed(true, key);
        showApp(true);
        if (loginStatus) loginStatus.hidden = true;
        await loadRegistrations();
      } catch (err) {
        setAuthed(false);
        if (loginStatus) {
          loginStatus.hidden = false;
          loginStatus.className = "form-status is-error";
          loginStatus.textContent =
            err.status === 401 ? "Invalid access key." : err.message || "Login failed";
        }
      }
    });
  }

  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    setAuthed(false);
    selectedLocalId = null;
    cache = [];
    showApp(false);
    if (passwordInput) passwordInput.value = "";
  });

  document.getElementById("refreshBtn")?.addEventListener("click", () => {
    loadRegistrations();
  });

  document.getElementById("exportBtn")?.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(cache, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ctf-registrations-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  statusFilter?.addEventListener("change", renderTable);
  searchInput?.addEventListener("input", renderTable);

  tableBody?.addEventListener("click", (event) => {
    const tr = event.target.closest("tr[data-local-id]");
    if (!tr) return;
    selectedLocalId = tr.getAttribute("data-local-id");
    renderTable();
    renderDetail();
  });

  const patchSelected = async (patch) => {
    if (!selectedLocalId) return;
    try {
      const res = await window.CTF_API.update(getAdminKey(), {
        localId: selectedLocalId,
        ...patch,
      });
      const updated = res.registration;
      const idx = cache.findIndex((r) => r.localId === selectedLocalId);
      if (idx >= 0) cache[idx] = updated;
      else cache.unshift(updated);
      renderTable();
      renderDetail();
      setDetailMessage("Registration updated on server.");
    } catch (err) {
      setDetailMessage(err.message || "Update failed", false);
    }
  };

  document.getElementById("verifyBtn")?.addEventListener("click", () => {
    patchSelected({
      status: "verified",
      verifiedAt: new Date().toISOString(),
      adminNotes: "Payment verified by admin.",
    });
  });

  document.getElementById("admitBtn")?.addEventListener("click", () => {
    patchSelected({
      status: "admitted",
      admittedAt: new Date().toISOString(),
      adminNotes: "Registration admitted by admin.",
    });
  });

  document.getElementById("rejectBtn")?.addEventListener("click", () => {
    patchSelected({
      status: "rejected",
      rejectedAt: new Date().toISOString(),
      adminNotes: "Registration rejected by admin.",
    });
  });

  document.getElementById("deleteBtn")?.addEventListener("click", async () => {
    if (!selectedLocalId) return;
    if (!window.confirm("Delete this registration permanently from the server store?")) return;
    try {
      await window.CTF_API.remove(getAdminKey(), selectedLocalId);
      cache = cache.filter((r) => r.localId !== selectedLocalId);
      selectedLocalId = null;
      renderTable();
      renderDetail();
      setDetailMessage("Registration deleted.");
    } catch (err) {
      setDetailMessage(err.message || "Delete failed", false);
    }
  });

  // Boot
  if (isAuthed()) {
    showApp(true);
    loadRegistrations();
  } else {
    showApp(false);
  }

  // Hint default key in console for operators (not on page for security)
  console.info("CTF Admin: set ADMIN_KEY on the server. Default local key is CTF-Admin-2026");
})();
