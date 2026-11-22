(() => {
  "use strict";

  // Le QR code de l'accueil est réel : il reste lisible et affiche ce message.
  const MESSAGE = "Bravo, ce QR code fonctionne.";
  const BLUE = "#1d2bc4";
  const QUIET = 4;
  const INTRO_MS = 900;
  const RIPPLE_MS = 850;

  const canvas = document.getElementById("home-qr");
  const ctx = canvas.getContext("2d");
  const still = matchMedia("(prefers-reduced-motion: reduce)");

  const generator = new QRCodeStyling({ data: MESSAGE, qrOptions: { errorCorrectionLevel: "Q" } })._qr;
  const count = generator.getModuleCount();
  const total = count + QUIET * 2;
  const modules = [];

  const inFinder = (r, c) => (r < 7 && c < 7) || (r < 7 && c >= count - 7) || (r >= count - 7 && c < 7);

  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (generator.isDark(r, c) && !inFinder(r, c)) {
        modules.push({ x: c + QUIET + 0.5, y: r + QUIET + 0.5, order: (r + c) / (2 * count) });
      }
    }
  }

  let unit = 1;
  let startedAt = 0;
  let frame = 0;
  let pointer = { x: 0, y: 0, power: 0, target: 0 };
  const ripples = [];

  const easeOut = (t) => 1 - (1 - t) ** 3;
  const clamp = (v) => Math.max(0, Math.min(1, v));

  function resize() {
    const size = canvas.clientWidth;
    if (!size) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    // Un nombre entier de pixels par module garde des bords nets et un scan fiable.
    const pixels = Math.ceil((size * ratio) / total) * total;
    canvas.width = canvas.height = pixels;
    unit = pixels / total;
    paint(performance.now());
  }

  function finder(col, row) {
    const x = (col + QUIET) * unit;
    const y = (row + QUIET) * unit;
    ctx.beginPath();
    ctx.roundRect(x, y, 7 * unit, 7 * unit, 2 * unit);
    ctx.roundRect(x + unit, y + unit, 5 * unit, 5 * unit, 1.2 * unit);
    ctx.fill("evenodd");
    ctx.beginPath();
    ctx.roundRect(x + 2 * unit, y + 2 * unit, 3 * unit, 3 * unit, 0.9 * unit);
    ctx.fill();
  }

  // 0 = carré arrondi (forme de repos, la plus lisible), 1 = point rond
  function squareness(m, now) {
    let amount = 0;
    if (pointer.power > 0) {
      const d = Math.hypot(m.x - pointer.x, m.y - pointer.y);
      amount = pointer.power * clamp(1 - d / 6);
    }
    for (const ripple of ripples) {
      const t = (now - ripple.at) / RIPPLE_MS;
      const d = Math.hypot(m.x - ripple.x, m.y - ripple.y);
      const front = t * total * 1.15;
      amount = Math.max(amount, clamp(1 - Math.abs(d - front) / 3.2) * (1 - t));
    }
    return amount;
  }

  function paint(now) {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = BLUE;

    const intro = still.matches ? 1 : (now - startedAt) / INTRO_MS;
    ctx.save();
    ctx.globalAlpha = easeOut(clamp(intro * 2));
    finder(0, 0);
    finder(count - 7, 0);
    finder(0, count - 7);
    ctx.restore();

    ctx.beginPath();
    for (const m of modules) {
      const grown = easeOut(clamp((intro - m.order * 0.6) / 0.4));
      if (grown <= 0) continue;
      const shape = squareness(m, now);
      const side = unit * grown * (1 - 0.26 * shape);
      const radius = side * (0.28 + 0.22 * shape);
      const x = m.x * unit - side / 2;
      const y = m.y * unit - side / 2;
      ctx.moveTo(x + radius, y);
      ctx.roundRect(x, y, side, side, radius);
    }
    ctx.fill();
  }

  function tick(now) {
    frame = 0;
    pointer.power += (pointer.target - pointer.power) * 0.2;
    if (Math.abs(pointer.target - pointer.power) < 0.01) pointer.power = pointer.target;
    while (ripples.length && now - ripples[0].at > RIPPLE_MS) ripples.shift();
    paint(now);

    const introRunning = !still.matches && now - startedAt < INTRO_MS;
    if (introRunning || ripples.length || pointer.power !== pointer.target) wake();
  }

  function wake() {
    if (!frame) frame = requestAnimationFrame(tick);
  }

  function locate(event) {
    const box = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - box.left) / box.width) * total,
      y: ((event.clientY - box.top) / box.height) * total,
    };
  }

  canvas.addEventListener("pointermove", (event) => {
    if (still.matches || event.pointerType !== "mouse") return;
    Object.assign(pointer, locate(event), { target: 1 });
    wake();
  });

  canvas.addEventListener("pointerleave", () => {
    pointer.target = 0;
    wake();
  });

  canvas.addEventListener("pointerdown", (event) => {
    if (still.matches) return;
    ripples.push({ ...locate(event), at: performance.now() });
    wake();
  });

  new ResizeObserver(resize).observe(canvas);

  // Retour arrière depuis le générateur : le QR code est déjà complet.
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      startedAt = -INTRO_MS;
      resize();
    }
  });

  startedAt = performance.now();
  resize();
  wake();
})();
