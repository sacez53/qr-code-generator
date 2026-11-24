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
        // Chaque point a sa profondeur : il flotte plus ou moins quand la carte penche.
        const depth = 0.35 + ((r * 7 + c * 13) % 11) / 16;
        modules.push({ x: c + QUIET + 0.5, y: r + QUIET + 0.5, order: (r + c) / (2 * count), depth });
      }
    }
  }

  let unit = 1;
  let startedAt = 0;
  let frame = 0;
  let pointer = { x: 0, y: 0, power: 0, target: 0 };
  let drift = { x: 0, y: 0 };
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
      amount = pointer.power * clamp(1 - d / 10);
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
      const x = (m.x + drift.x * m.depth) * unit - side / 2;
      const y = (m.y + drift.y * m.depth) * unit - side / 2;
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

  /* Transition vers le générateur : le QR code est repris sur la page suivante */

  const enter = document.querySelector(".enter");
  const homeText = document.querySelector(".home-text");
  let leaving = null;

  enter.addEventListener("click", (event) => {
    if (leaving) return event.preventDefault();
    if (still.matches || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    try {
      startedAt = -INTRO_MS;
      pointer.power = pointer.target = 0;
      ripples.length = 0;
      paint(performance.now());
      const box = canvas.parentElement.getBoundingClientRect();
      sessionStorage.setItem("qr-entrance", JSON.stringify({
        left: box.left,
        top: box.top,
        width: box.width,
        image: canvas.toDataURL("image/png"),
      }));
    } catch {
      return; // Sans stockage, navigation normale.
    }

    event.preventDefault();
    leaving = homeText.animate(
      [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(12px)" }],
      { duration: 180, easing: "ease-in", fill: "forwards" },
    );
    leaving.finished.then(() => location.assign(enter.href)).catch(() => {});
  });

  // Retour arrière : la page revient dans son état normal.
  window.addEventListener("pageshow", (event) => {
    if (!event.persisted || !leaving) return;
    leaving.cancel();
    leaving = null;
    try { sessionStorage.removeItem("qr-entrance"); } catch { /* stockage indisponible */ }
  });

  /* Relief : la carte suit l'inclinaison du téléphone, ou la souris */

  const card = canvas.parentElement;
  const hint = document.getElementById("motion-hint");
  const MAX_TILT = 20;
  const title = document.querySelector(".home-text");
  const tilt = { x: 0, y: 0, tx: 0, ty: 0 };
  let tiltFrame = 0;
  let neutral = null;
  let motion = "off";

  const limit = (v) => Math.max(-1, Math.min(1, v));

  function setTiltTarget(nx, ny) {
    tilt.tx = limit(nx);
    tilt.ty = limit(ny);
    if (!tiltFrame) tiltFrame = requestAnimationFrame(tiltTick);
  }

  function applyTilt() {
    const { x, y } = tilt;
    const strength = Math.min(1, Math.hypot(x, y) * 1.4);
    card.style.setProperty("--rx", `${(-y * MAX_TILT).toFixed(2)}deg`);
    card.style.setProperty("--ry", `${(x * MAX_TILT).toFixed(2)}deg`);
    card.style.setProperty("--gx", `${(50 + x * 45).toFixed(1)}%`);
    card.style.setProperty("--gy", `${(50 + y * 45).toFixed(1)}%`);
    card.style.setProperty("--glare", strength.toFixed(3));
    card.style.setProperty("--shx", `${(-x * 40).toFixed(1)}px`);
    card.style.setProperty("--shy", `${(26 - y * 30).toFixed(1)}px`);
    card.style.setProperty("--lift", `${(strength * 1.04 + (1 - strength)).toFixed(3)}`);
    // Le texte part dans l'autre sens : effet de profondeur.
    title.style.setProperty("--px", `${(-x * 16).toFixed(1)}px`);
    title.style.setProperty("--py", `${(-y * 12).toFixed(1)}px`);
    // Les points glissent légèrement, sans gêner la lecture.
    drift = { x: x * 0.22, y: y * 0.22 };
    // Les points s'arrondissent du côté vers lequel on penche.
    pointer.x = total / 2 + x * total * 0.45;
    pointer.y = total / 2 + y * total * 0.45;
    pointer.target = pointer.power = strength;
    wake();
  }

  function tiltTick() {
    tiltFrame = 0;
    tilt.x += (tilt.tx - tilt.x) * 0.18;
    tilt.y += (tilt.ty - tilt.y) * 0.18;
    const settled = Math.abs(tilt.tx - tilt.x) < 0.002 && Math.abs(tilt.ty - tilt.y) < 0.002;
    if (settled) {
      tilt.x = tilt.tx;
      tilt.y = tilt.ty;
    }
    applyTilt();
    if (!settled) tiltFrame = requestAnimationFrame(tiltTick);
  }

  function onOrientation(event) {
    if (event.beta == null || event.gamma == null || still.matches) return;
    let dx = event.gamma;
    let dy = event.beta;
    // Téléphone à l'horizontale : les axes tournent avec l'écran.
    const angle = (screen.orientation && screen.orientation.angle) || window.orientation || 0;
    if (angle === 90) [dx, dy] = [dy, -dx];
    else if (angle === -90 || angle === 270) [dx, dy] = [-dy, dx];
    else if (angle === 180) [dx, dy] = [-dx, -dy];

    // La position de départ sert de repère, puis se recentre doucement.
    if (!neutral) neutral = { x: dx, y: dy };
    neutral.x += (dx - neutral.x) * 0.01;
    neutral.y += (dy - neutral.y) * 0.01;
    setTiltTarget((dx - neutral.x) / 14, (dy - neutral.y) / 14);
  }

  function startMotion() {
    if (motion === "on") return;
    motion = "on";
    hint.hidden = true;
    card.classList.add("is-tilting");
    window.addEventListener("deviceorientation", onOrientation);
  }

  const needsPermission = typeof DeviceOrientationEvent !== "undefined"
    && typeof DeviceOrientationEvent.requestPermission === "function";
  const touchScreen = matchMedia("(hover: none) and (pointer: coarse)").matches;

  // Sur iPhone, Safari n'autorise le gyroscope qu'après un toucher.
  function askMotion() {
    if (motion !== "off" || !needsPermission) return;
    motion = "asking";
    DeviceOrientationEvent.requestPermission().then((answer) => {
      motion = "off";
      if (answer === "granted") {
        try { localStorage.setItem("qr-motion", "granted"); } catch { /* stockage indisponible */ }
        startMotion();
      } else {
        motion = "denied";
        hint.hidden = true;
      }
    }).catch(() => { motion = "off"; });
  }

  if (!still.matches && touchScreen && "DeviceOrientationEvent" in window) {
    if (!needsPermission) {
      startMotion();
    } else {
      let granted = null;
      try { granted = localStorage.getItem("qr-motion"); } catch { /* stockage indisponible */ }
      if (granted) {
        // Déjà accepté : le premier toucher réactive sans nouvelle question.
        document.addEventListener("touchend", askMotion, { once: true });
      } else {
        hint.hidden = false;
      }
      hint.addEventListener("click", askMotion);
      canvas.addEventListener("click", askMotion);
    }
  }

  // Ordinateur : la souris fait pencher la carte.
  card.addEventListener("pointermove", (event) => {
    if (still.matches || event.pointerType !== "mouse") return;
    const box = card.getBoundingClientRect();
    card.classList.add("is-tilting");
    setTiltTarget(((event.clientX - box.left) / box.width) * 2 - 1, ((event.clientY - box.top) / box.height) * 2 - 1);
  });

  card.addEventListener("pointerleave", (event) => {
    if (event.pointerType === "mouse" && motion !== "on") setTiltTarget(0, 0);
  });

  // Avant de partir, la carte revient à plat pour la transition.
  enter.addEventListener("click", () => {
    tilt.x = tilt.tx = tilt.y = tilt.ty = 0;
    applyTilt();
    drift = { x: 0, y: 0 };
    pointer.power = pointer.target = 0;
  }, { capture: true });

  startedAt = performance.now();
  resize();
  wake();
})();
