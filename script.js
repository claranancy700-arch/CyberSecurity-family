(() => {
  const menuToggle = document.getElementById("menuToggle");
  const mainMenu = document.getElementById("mainMenu");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const setMenuOpen = (open) => {
    if (!menuToggle || !mainMenu) return;
    mainMenu.classList.toggle("open", open);
    menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
  };

  if (menuToggle && mainMenu) {
    menuToggle.addEventListener("click", () => {
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
      { threshold: 0.14, rootMargin: "0px 0px -40px 0px" }
    );

    revealNodes.forEach((node) => revealObserver.observe(node));
  }

  const form = document.querySelector(".contact-form");
  const formStatus = document.getElementById("formStatus");

  if (form && formStatus) {
    form.addEventListener("submit", (event) => {
      // When not on Netlify, provide a clear professional message instead of a silent failure.
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

  if (prefersReducedMotion) {
    const staticPoints = [
      [140, 110],
      [260, 80],
      [420, 150],
      [530, 95],
      [700, 140],
      [840, 200],
      [680, 260],
      [460, 280],
      [280, 245],
      [170, 210],
    ];

    ctx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
    ctx.strokeStyle = "rgba(159, 178, 194, 0.12)";
    for (let x = 0; x < mapCanvas.width; x += 55) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, mapCanvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < mapCanvas.height; y += 45) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(mapCanvas.width, y);
      ctx.stroke();
    }

    staticPoints.forEach(([x, y], index) => {
      const colors = ["#5db9ff", "#ff7f66", "#46d6b1"];
      ctx.fillStyle = colors[index % 3];
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    });
    return;
  }

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

  const pulses = points.map((point, index) => ({
    ...point,
    type: index % 3,
    phase: Math.random() * Math.PI * 2,
  }));

  const drawGrid = () => {
    ctx.strokeStyle = "rgba(159, 178, 194, 0.12)";
    ctx.lineWidth = 1;

    for (let x = 0; x < mapCanvas.width; x += 55) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, mapCanvas.height);
      ctx.stroke();
    }

    for (let y = 0; y < mapCanvas.height; y += 45) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(mapCanvas.width, y);
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

  const drawFrame = (time) => {
    ctx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
    drawGrid();
    drawLinks(time);
    pulses.forEach((node) => drawPulse(node, time));
    requestAnimationFrame(drawFrame);
  };

  requestAnimationFrame(drawFrame);
})();
