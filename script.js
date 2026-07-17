(() => {
  const menuToggle = document.getElementById("menuToggle");
  const mainMenu = document.getElementById("mainMenu");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const desktopNavQuery = window.matchMedia("(min-width: 1025px)");

  const setMenuOpen = (open) => {
    if (!menuToggle || !mainMenu) return;
    mainMenu.classList.toggle("open", open);
    menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.classList.toggle("menu-open", open);
  };

  if (menuToggle && mainMenu) {
    menuToggle.addEventListener("click", (event) => {
      event.stopPropagation();
      setMenuOpen(!mainMenu.classList.contains("open"));
    });

    mainMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setMenuOpen(false));
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    });

    document.addEventListener("click", (event) => {
      if (!mainMenu.classList.contains("open")) return;
      const target = event.target;
      if (menuToggle.contains(target) || mainMenu.contains(target)) return;
      setMenuOpen(false);
    });

    const onNavBreakpointChange = (event) => {
      if (event.matches) setMenuOpen(false);
    };

    if (typeof desktopNavQuery.addEventListener === "function") {
      desktopNavQuery.addEventListener("change", onNavBreakpointChange);
    } else if (typeof desktopNavQuery.addListener === "function") {
      desktopNavQuery.addListener(onNavBreakpointChange);
    }

    window.addEventListener(
      "orientationchange",
      () => {
        // Keep layout clean after rotate
        setTimeout(() => {
          if (desktopNavQuery.matches) setMenuOpen(false);
        }, 120);
      },
      { passive: true }
    );
  }

  const navLinks = document.querySelectorAll(".menu a");
  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (href === currentPage || (currentPage === "" && href === "index.html")) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    }
  });

  const revealNodes = document.querySelectorAll(".reveal");

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealNodes.forEach((node) => node.classList.add("show"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("show");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -8% 0px" }
    );

    revealNodes.forEach((node) => revealObserver.observe(node));
  }

  const form = document.querySelector(".contact-form:not(.complaint-form)");
  const formStatus = document.getElementById("formStatus");

  if (form && formStatus) {
    form.addEventListener("submit", (event) => {
      const isLocal =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        window.location.protocol === "file:";

      if (isLocal) {
        event.preventDefault();
        formStatus.hidden = false;
        formStatus.className = "form-status is-success";
        formStatus.textContent =
          "Thank you. Your request has been received. Our team responds within one business day.";
        form.reset();
      }
    });
  }

  /* ---------- Complaint registration + crypto gateway ---------- */
  const complaintForm = document.getElementById("complaintForm");
  const complaintStatus = document.getElementById("complaintStatus");
  const serviceSelect = document.getElementById("serviceSelect");
  const complaintService = document.getElementById("complaintService");
  const cryptoComplaintId = document.getElementById("cryptoComplaintId");
  const copyComplaintIdBtn = document.getElementById("copyComplaintId");

  const cryptoWallets = {
    btc: {
      network: "Bitcoin mainnet",
      amount: "0.015 BTC",
      address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    },
    eth: {
      network: "Ethereum mainnet (ERC-20 ready)",
      amount: "0.35 ETH",
      address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    },
    usdt: {
      network: "Tron TRC-20 (USDT)",
      amount: "450 USDT",
      address: "TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf",
    },
  };

  let activeComplaintId = "";

  const generateComplaintId = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const rand = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    const checksum = Math.floor(1000 + Math.random() * 9000);
    // Complaint ID doubles as Tax ID reference for the registration case
    return `CTF-${y}${m}${d}-${rand}-TAX${checksum}`;
  };

  const copyText = async (value, successMessage, statusEl) => {
    if (!value) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
      } else {
        const area = document.createElement("textarea");
        area.value = value;
        area.setAttribute("readonly", "");
        area.style.position = "fixed";
        area.style.left = "-9999px";
        document.body.appendChild(area);
        area.select();
        document.execCommand("copy");
        document.body.removeChild(area);
      }
      if (statusEl) {
        statusEl.hidden = false;
        statusEl.className = "form-status is-success";
        statusEl.textContent = successMessage;
      }
    } catch (_err) {
      if (statusEl) {
        statusEl.hidden = false;
        statusEl.className = "form-status is-error";
        statusEl.textContent = "Could not copy automatically. Select and copy the value manually.";
      }
    }
  };

  // Prefill service from ?service= query (capability / catalog cards)
  if (serviceSelect) {
    const params = new URLSearchParams(window.location.search);
    const service = params.get("service");
    if (service) {
      const match = Array.from(serviceSelect.options).find((opt) => opt.value === service);
      if (match) {
        serviceSelect.value = service;
      } else {
        // Fallback: try case-insensitive / partial
        const loose = Array.from(serviceSelect.options).find(
          (opt) => opt.value.toLowerCase() === service.toLowerCase()
        );
        if (loose) serviceSelect.value = loose.value;
      }
      if (complaintService) complaintService.value = serviceSelect.value || service;
    }
  }

  if (complaintForm) {
    complaintForm.addEventListener("submit", (event) => {
      event.preventDefault();

      if (!complaintForm.checkValidity()) {
        complaintForm.reportValidity();
        return;
      }

      const hasProof = complaintForm.querySelector('input[name="hasProof"]:checked');
      const proofDetails = document.getElementById("proofDetails");
      if (hasProof && hasProof.value !== "no" && proofDetails && !proofDetails.value.trim()) {
        proofDetails.setCustomValidity("Describe the proof available, or choose No.");
        proofDetails.reportValidity();
        proofDetails.setCustomValidity("");
        return;
      }

      activeComplaintId = generateComplaintId();

      if (cryptoComplaintId) {
        cryptoComplaintId.textContent = activeComplaintId;
      }
      if (copyComplaintIdBtn) {
        copyComplaintIdBtn.disabled = false;
      }
      if (complaintService && serviceSelect) {
        complaintService.value = serviceSelect.value;
      }

      // Required: prompt carries the code for the user to copy as Complaint ID / Tax ID
      window.prompt(
        "Your Complaint ID / Tax ID was generated. Copy this code and keep it for payment reference and case tracking:",
        activeComplaintId
      );

      if (complaintStatus) {
        complaintStatus.hidden = false;
        complaintStatus.className = "form-status is-success";
        complaintStatus.textContent = `Registration recorded. Complaint ID / Tax ID: ${activeComplaintId}. Use it in the crypto payment section below.`;
      }

      const paymentSection = document.getElementById("payment");
      if (paymentSection) {
        paymentSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  if (copyComplaintIdBtn) {
    copyComplaintIdBtn.addEventListener("click", () => {
      copyText(
        activeComplaintId || (cryptoComplaintId && cryptoComplaintId.textContent) || "",
        "Complaint ID / Tax ID copied.",
        complaintStatus
      );
    });
  }

  const cryptoAssets = document.querySelectorAll(".crypto-asset");
  const cryptoNetwork = document.getElementById("cryptoNetwork");
  const cryptoAmount = document.getElementById("cryptoAmount");
  const cryptoAddress = document.getElementById("cryptoAddress");
  const copyAddressBtn = document.getElementById("copyAddress");
  const confirmPaymentBtn = document.getElementById("confirmPayment");
  const paymentStatus = document.getElementById("paymentStatus");
  const txHashInput = document.getElementById("txHash");

  const setCryptoAsset = (assetKey) => {
    const data = cryptoWallets[assetKey];
    if (!data) return;
    cryptoAssets.forEach((btn) => {
      const active = btn.getAttribute("data-asset") === assetKey;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
    if (cryptoNetwork) cryptoNetwork.textContent = data.network;
    if (cryptoAmount) cryptoAmount.textContent = data.amount;
    if (cryptoAddress) cryptoAddress.textContent = data.address;
  };

  cryptoAssets.forEach((btn) => {
    btn.addEventListener("click", () => {
      setCryptoAsset(btn.getAttribute("data-asset"));
    });
  });

  if (copyAddressBtn && cryptoAddress) {
    copyAddressBtn.addEventListener("click", () => {
      copyText(cryptoAddress.textContent.trim(), "Wallet address copied.", paymentStatus);
    });
  }

  if (confirmPaymentBtn) {
    confirmPaymentBtn.addEventListener("click", () => {
      const tx = txHashInput ? txHashInput.value.trim() : "";
      if (!activeComplaintId) {
        if (paymentStatus) {
          paymentStatus.hidden = false;
          paymentStatus.className = "form-status is-error";
          paymentStatus.textContent =
            "Submit the complaint form first to generate your Complaint ID / Tax ID.";
        }
        return;
      }
      if (!tx || tx.length < 8) {
        if (paymentStatus) {
          paymentStatus.hidden = false;
          paymentStatus.className = "form-status is-error";
          paymentStatus.textContent = "Paste a valid transaction hash from your wallet.";
        }
        return;
      }
      if (paymentStatus) {
        paymentStatus.hidden = false;
        paymentStatus.className = "form-status is-success";
        paymentStatus.textContent = `Payment notice received for ${activeComplaintId}. Hash: ${tx.slice(0, 18)}… Our team will verify on-chain.`;
      }
    });
  }

  const mapCanvas = document.getElementById("threatMap");
  if (!mapCanvas) return;

  const ctx = mapCanvas.getContext("2d");
  if (!ctx) return;

  const logicalWidth = 1000;
  const logicalHeight = 430;

  const syncCanvasSize = () => {
    const displayWidth = Math.max(1, Math.floor(mapCanvas.clientWidth || logicalWidth));
    const ratio = displayWidth / logicalWidth;
    const displayHeight = Math.max(1, Math.floor(logicalHeight * ratio));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    mapCanvas.width = Math.floor(displayWidth * dpr);
    mapCanvas.height = Math.floor(displayHeight * dpr);
    ctx.setTransform(dpr * ratio, 0, 0, dpr * ratio, 0, 0);
  };

  const points = [
    { x: 140, y: 110 },
    { x: 260, y: 80 },
    { x: 420, y: 150 },
    { x: 530, y: 95 },
    { x: 700, y: 140 },
    { x: 840, y: 200 },
    { x: 680, y: 260 },
    { x: 460, y: 280 },
    { x: 280, y: 245 },
    { x: 170, y: 210 },
  ];

  const drawStatic = () => {
    syncCanvasSize();
    ctx.clearRect(0, 0, logicalWidth, logicalHeight);
    ctx.strokeStyle = "rgba(159, 178, 194, 0.12)";
    ctx.lineWidth = 1;

    for (let x = 0; x < logicalWidth; x += 55) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, logicalHeight);
      ctx.stroke();
    }

    for (let y = 0; y < logicalHeight; y += 45) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(logicalWidth, y);
      ctx.stroke();
    }

    points.forEach((point, index) => {
      const colors = ["#5db9ff", "#ff7f66", "#46d6b1"];
      ctx.fillStyle = colors[index % 3];
      ctx.beginPath();
      ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  if (prefersReducedMotion) {
    drawStatic();
    window.addEventListener("resize", drawStatic, { passive: true });
    return;
  }

  const pulses = points.map((point, index) => ({
    ...point,
    type: index % 3,
    phase: Math.random() * Math.PI * 2,
  }));

  const drawGrid = () => {
    ctx.strokeStyle = "rgba(159, 178, 194, 0.12)";
    ctx.lineWidth = 1;

    for (let x = 0; x < logicalWidth; x += 55) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, logicalHeight);
      ctx.stroke();
    }

    for (let y = 0; y < logicalHeight; y += 45) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(logicalWidth, y);
      ctx.stroke();
    }
  };

  const drawLinks = (time) => {
    ctx.lineWidth = 1.4;
    for (let i = 0; i < points.length; i += 1) {
      const start = points[i];
      const end = points[(i + 2) % points.length];
      const pulse = (Math.sin(time / 700 + i) + 1) / 2;
      ctx.strokeStyle = `rgba(70, 214, 177, ${0.12 + pulse * 0.26})`;
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }
  };

  const drawPulse = (node, time) => {
    const radius = 5 + Math.sin(time / 300 + node.phase) * 1.4;
    const colors = ["#5db9ff", "#ff7f66", "#46d6b1"];

    ctx.fillStyle = colors[node.type];
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `${colors[node.type]}77`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius + 7, 0, Math.PI * 2);
    ctx.stroke();
  };

  let frameId = 0;

  const drawFrame = (time) => {
    ctx.clearRect(0, 0, logicalWidth, logicalHeight);
    drawGrid();
    drawLinks(time);
    pulses.forEach((node) => drawPulse(node, time));
    frameId = requestAnimationFrame(drawFrame);
  };

  const startMap = () => {
    syncCanvasSize();
    cancelAnimationFrame(frameId);
    frameId = requestAnimationFrame(drawFrame);
  };

  startMap();

  let resizeTimer = 0;
  window.addEventListener(
    "resize",
    () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(startMap, 120);
    },
    { passive: true }
  );
})();
