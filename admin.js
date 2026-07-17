(() => {
  const STORE_KEY = "ctf_complaint_registrations";
  const SESSION_KEY = "ctf_admin_session";
  // Change this before production use
  const ADMIN_KEY = "CTF-Admin-2026";

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

  let selectedLocalId = null;

  const readStore = () => {
    try {
      const raw = JSON.parse(localStorage.getItem(STORE_KEY) || "[]");
      return Array.isArray(raw) ? raw : [];
    } catch (_err) {
      return [];
    }
  };

  const writeStore = (rows) => {
    localStorage.setItem(STORE_KEY, JSON.stringify(rows.slice(0, 200)));
  };

  const isAuthed = () => sessionStorage.getItem(SESSION_KEY) === "1";

  const setAuthed = (on) => {
    if (on) sessionStorage.setItem(SESSION_KEY, "1");
    else sessionStorage.removeItem(SESSION_KEY);
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

  const getFiltered = () => {
    const status = statusFilter?.value || "all";
    const q = (searchInput?.value || "").trim().toLowerCase();
    return readStore().filter((row) => {
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

  const renderTable = () => {
    const all = readStore();
    updateStats(all);
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
          <tr class="${selected}" data-local-id="${row.localId || ""}">
            <td>${formatDate(row.submittedAt || row.paidAt)}</td>
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

  const escapeHtml = (value) =>
    String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const field = (label, value) => {
    if (value === undefined || value === null || value === "") return "";
    return `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(String(value))}</dd></div>`;
  };

  const renderDetail = () => {
    const rows = readStore();
    const row = rows.find((r) => r.localId === selectedLocalId);

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

  const setDetailMessage = (text, ok = true) => {
    if (!detailStatus) return;
    detailStatus.hidden = false;
    detailStatus.className = `form-status ${ok ? "is-success" : "is-error"}`;
    detailStatus.textContent = text;
  };

  const updateSelected = (patch) => {
    const rows = readStore();
    const idx = rows.findIndex((r) => r.localId === selectedLocalId);
    if (idx < 0) {
      setDetailMessage("Record not found.", false);
      return;
    }
    rows[idx] = { ...rows[idx], ...patch, updatedAt: new Date().toISOString() };
    writeStore(rows);
    renderTable();
    renderDetail();
    setDetailMessage("Registration updated.");
  };

  if (loginForm) {
    loginForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const key = passwordInput?.value || "";
      if (key === ADMIN_KEY) {
        setAuthed(true);
        showApp(true);
        renderTable();
        renderDetail();
        if (loginStatus) loginStatus.hidden = true;
      } else if (loginStatus) {
        loginStatus.hidden = false;
        loginStatus.className = "form-status is-error";
        loginStatus.textContent = "Invalid access key.";
      }
    });
  }

  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    setAuthed(false);
    selectedLocalId = null;
    showApp(false);
    if (passwordInput) passwordInput.value = "";
  });

  document.getElementById("refreshBtn")?.addEventListener("click", () => {
    renderTable();
    renderDetail();
  });

  document.getElementById("exportBtn")?.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(readStore(), null, 2)], { type: "application/json" });
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

  document.getElementById("verifyBtn")?.addEventListener("click", () => {
    if (!selectedLocalId) return;
    updateSelected({
      status: "verified",
      verifiedAt: new Date().toISOString(),
      adminNotes: "Payment verified by admin.",
    });
  });

  document.getElementById("admitBtn")?.addEventListener("click", () => {
    if (!selectedLocalId) return;
    updateSelected({
      status: "admitted",
      admittedAt: new Date().toISOString(),
      adminNotes: "Registration admitted by admin.",
    });
  });

  document.getElementById("rejectBtn")?.addEventListener("click", () => {
    if (!selectedLocalId) return;
    updateSelected({
      status: "rejected",
      rejectedAt: new Date().toISOString(),
      adminNotes: "Registration rejected by admin.",
    });
  });

  document.getElementById("deleteBtn")?.addEventListener("click", () => {
    if (!selectedLocalId) return;
    if (!window.confirm("Delete this registration permanently from this browser store?")) return;
    const rows = readStore().filter((r) => r.localId !== selectedLocalId);
    writeStore(rows);
    selectedLocalId = null;
    renderTable();
    renderDetail();
    setDetailMessage("Registration deleted.");
  });

  // Boot
  if (isAuthed()) {
    showApp(true);
    renderTable();
  } else {
    showApp(false);
  }
})();
