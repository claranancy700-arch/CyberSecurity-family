(() => {
  const menuToggle = document.getElementById("menuToggle");
  const mainMenu = document.getElementById("mainMenu");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const desktopNavQuery = window.matchMedia("(min-width: 901px)");

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

  const form = document.querySelector(".contact-form");
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
