(() => {
  "use strict";

  const STORAGE_KEY = "qr-generator-v1";
  const PREVIEW_SIZE = 1000;
  const MAX_LOGO_BYTES = 1024 * 1024;

  const DEFAULTS = {
    type: "url",
    fields: { url: "https://example.com", wifiSec: "WPA", mapApp: "google", socialNet: "instagram" },
    dots: "rounded",
    corner: "extra-rounded",
    cornerDot: "dot",
    fg: "#1d2bc4",
    fg2: "#c4166b",
    bg: "#ffffff",
    transparent: false,
    gradient: false,
    gradType: "linear",
    gradAngle: 45,
    linked: true,
    cornerColor: "#1d2bc4",
    cornerDotColor: "#1d2bc4",
    logo: null,
    logoName: "",
    logoSize: 0.3,
    logoMargin: 8,
    hideDots: true,
    margin: 48,
    ec: "Q",
    format: "png",
    size: "1024",
    frame: "none",
    frameText: "Scannez-moi",
    frameTextSize: 100,
    frameLinked: true,
    frameColor: "#1d2bc4",
    frameTextColor: "#ffffff",
    frameAuto: false,
    printDistance: "100",
    printSize: "",
    printLayout: "single",
    printCuts: true,
  };

  const ring = (outer, inner) => `<path fill-rule="evenodd" d="${outer} ${inner}"/>`;
  const shape = (d) => `<path d="${d}"/>`;

  const OPTIONS = {
    type: [
      ["url", "Lien"], ["text", "Texte"], ["wifi", "Wi-Fi"],
      ["email", "E-mail"], ["tel", "Téléphone"], ["contact", "Contact"],
      ["sms", "SMS"], ["whatsapp", "WhatsApp"], ["event", "Événement"],
      ["place", "Position"], ["social", "Réseaux"],
    ],
    dots: [
      ["square", "Carrés", shape("M3 3h18v9h-9v9H3z")],
      ["dots", "Ronds", '<circle cx="7.5" cy="7.5" r="4.5"/><circle cx="16.5" cy="7.5" r="4.5"/><circle cx="7.5" cy="16.5" r="4.5"/>'],
      ["rounded", "Arrondis", shape("M7 3h10a4.5 4.5 0 0 1 0 9h-5v5a4.5 4.5 0 0 1-9 0V7a4 4 0 0 1 4-4z")],
      ["extra-rounded", "Très arrondis", shape("M10 3h6.5a4.5 4.5 0 0 1 0 9H12v4.5a4.5 4.5 0 0 1-9 0V10a7 7 0 0 1 7-7z")],
      ["classy", "Élégants", shape("M3 3h13.5A4.5 4.5 0 0 1 21 7.5V12h-9v9H7.5A4.5 4.5 0 0 1 3 16.5z")],
      ["classy-rounded", "Élégants ronds", shape("M8 3h13v4a5 5 0 0 1-5 5h-4v4a5 5 0 0 1-5 5H3V8a5 5 0 0 1 5-5z")],
    ],
    corner: [
      ["square", "Carré", ring("M3 3h18v18H3z", "M7 7v10h10V7z")],
      ["extra-rounded", "Arrondi", ring("M9 3h6a6 6 0 0 1 6 6v6a6 6 0 0 1-6 6H9a6 6 0 0 1-6-6V9a6 6 0 0 1 6-6z", "M9 7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z")],
      ["dot", "Rond", ring("M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z", "M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z")],
    ],
    cornerDot: [
      ["square", "Carré", shape("M6 6h12v12H6z")],
      ["dot", "Rond", '<circle cx="12" cy="12" r="7"/>'],
    ],
    frame: [
      ["none", "Aucun", shape("M4 4h16v16H4zM6 6v12h12V6z").replace("<path", '<path fill-rule="evenodd" opacity=".45"')],
      ["bottom", "Bas", ring("M5 2h14a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3z", "M4.5 4.5v11h15v-11z")],
      ["top", "Haut", ring("M5 2h14a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3z", "M4.5 8.5v11h15v-11z")],
      ["bubble", "Bulle", shape("M4 2h16v11H4zM6 17h5l1-2 1 2h5a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1a2 2 0 0 1 2-2z")],
      ["outline", "Contour", ring("M5 2h14a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3z", "M5 4a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1z")],
    ],
    gradType: [["linear", "Linéaire"], ["radial", "Radial"]],
    ec: [["L", "7 %"], ["M", "15 %"], ["Q", "25 %"], ["H", "30 %"]],
    printLayout: [["single", "Un seul"], ["sheet", "Planche d'étiquettes"]],
  };

  const PALETTES = [
    ["Outremer", "#1d2bc4", "#ffffff"],
    ["Encre", "#15182e", "#ffffff"],
    ["Forêt", "#0f5a3c", "#eef7ef"],
    ["Bordeaux", "#7c1230", "#fff3f2"],
    ["Prune", "#4f1a78", "#fbf3ff"],
    ["Pétrole", "#07505e", "#fff6d6"],
  ];

  const FRAME_PRESETS = ["Scannez-moi", "Menu", "Wi-Fi gratuit", "Suivez-nous", "Votre avis", "Payer ici"];

  const SOCIAL_URLS = {
    instagram: "https://www.instagram.com/{}",
    tiktok: "https://www.tiktok.com/@{}",
    youtube: "https://www.youtube.com/@{}",
    facebook: "https://www.facebook.com/{}",
    x: "https://x.com/{}",
    linkedin: "https://www.linkedin.com/in/{}",
    snapchat: "https://www.snapchat.com/add/{}",
    threads: "https://www.threads.net/@{}",
    twitch: "https://www.twitch.tv/{}",
    github: "https://github.com/{}",
  };

  // Modèles Instagram : seules les couleurs évoquent la marque, aucun logo.
  const TEMPLATES = [
    {
      id: "insta-gradient", name: "Dégradé",
      style: { fg: "#962fbf", fg2: "#d62976", gradient: true, gradType: "linear", gradAngle: 45, bg: "#ffffff", dots: "dots", corner: "extra-rounded", cornerDot: "dot", frame: "bottom" },
    },
    {
      id: "insta-mono", name: "Noir et blanc",
      style: { fg: "#15182e", gradient: false, bg: "#ffffff", dots: "rounded", corner: "extra-rounded", cornerDot: "dot", frame: "bubble" },
    },
    {
      id: "insta-pastel", name: "Pastel",
      style: { fg: "#9d174d", gradient: false, bg: "#fdf2f8", dots: "classy-rounded", corner: "extra-rounded", cornerDot: "square", frame: "outline" },
    },
  ];

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const el = {
    form: $("#form"), sticker: $("#sticker"), preview: $("#preview"), empty: $("#empty"),
    status: $("#status"), download: $("#download"), copy: $("#copy"), exportBar: $("#export"),
    sizeField: $("#size-field"), drop: $("#drop"), logoInput: $("#logo-input"),
    logoFile: $("#logo-file"), logoThumb: $("#logo-thumb"), logoName: $("#logo-name"),
    logoError: $("#logo-error"), logoOptions: $("#logo-options"), logoCode: $("#logo-code"),
    pasteBox: $("#paste-box"),
  };

  let state = load();
  let drawToken = 0;
  let drawTimer = 0;
  let currentData = "";
  let refreshBatch = () => {};
  let refreshWizard = () => {};
  let popNext = false;
  const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const EASE = "cubic-bezier(.22, 1, .36, 1)";
  const previewContext = el.preview.getContext("2d");

  const COMPACT_QUERY = "(max-width: 860px), (max-height: 560px) and (max-width: 1000px)";

  /* Persistance */

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function load() {
    const base = clone(DEFAULTS);
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && typeof saved === "object") {
        // Le mot de passe Wi-Fi n'est jamais enregistré.
        return { ...base, ...saved, fields: { ...base.fields, ...saved.fields } };
      }
    } catch { /* stockage indisponible */ }
    return base;
  }

  function save() {
    try {
      const copy = clone(state);
      delete copy.fields.wifiPass;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(copy));
    } catch { /* stockage plein ou bloqué */ }
  }

  /* Construction du contenu encodé */

  const f = (name) => String(state.fields[name] ?? "").trim();
  const escWifi = (s) => s.replace(/([\\;,:"])/g, "\\$1");
  const escVcard = (s) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([;,])/g, "\\$1");
  const withScheme = (s) => (!s || /^[a-z][a-z0-9+.-]*:/i.test(s) ? s : `https://${s}`);

  const phoneDigits = (s) => s.replace(/[^\d+]/g, "");

  // wa.me attend l'indicatif du pays, sans « + » ni zéro initial.
  function whatsappNumber(value) {
    const digits = phoneDigits(value);
    if (digits.startsWith("+")) return digits.slice(1);
    if (digits.startsWith("00")) return digits.slice(2);
    if (digits.startsWith("0")) return `33${digits.slice(1)}`;
    return digits;
  }

  const icalDate = (value) => new Date(value).toISOString().replace(/[-:]|\.\d{3}/g, "");

  function buildEvent() {
    if (!f("evTitle") || !f("evStart")) return "";
    const start = new Date(f("evStart"));
    if (Number.isNaN(start.getTime())) return "";
    const parsedEnd = f("evEnd") ? new Date(f("evEnd")) : null;
    const end = parsedEnd && parsedEnd > start ? parsedEnd : new Date(start.getTime() + 3600000);
    const lines = ["BEGIN:VEVENT", `SUMMARY:${escVcard(f("evTitle"))}`, `DTSTART:${icalDate(start)}`, `DTEND:${icalDate(end)}`];
    if (f("evPlace")) lines.push(`LOCATION:${escVcard(f("evPlace"))}`);
    if (f("evNotes")) lines.push(`DESCRIPTION:${escVcard(f("evNotes"))}`);
    lines.push("END:VEVENT");
    return lines.join("\r\n");
  }

  function buildPlace() {
    const place = f("place");
    if (!place) return "";
    const coords = place.match(/^(-?\d{1,2}(?:[.,]\d+)?)\s*[,; ]\s*(-?\d{1,3}(?:[.,]\d+)?)$/);
    const query = coords ? `${coords[1].replace(",", ".")},${coords[2].replace(",", ".")}` : place;
    return state.fields.mapApp === "apple"
      ? `https://maps.apple.com/?q=${encodeURIComponent(query)}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  function buildSocial() {
    const user = f("socialUser").replace(/^@+/, "");
    if (!user) return "";
    if (/^https?:\/\//i.test(user)) return user;
    const template = SOCIAL_URLS[state.fields.socialNet] || SOCIAL_URLS.instagram;
    return template.replace("{}", encodeURIComponent(user));
  }

  function buildData() {
    switch (state.type) {
      case "url":
        return withScheme(f("url"));
      case "text":
        return String(state.fields.text ?? "").trim();
      case "wifi": {
        if (!f("ssid")) return "";
        const sec = state.fields.wifiSec || "WPA";
        const pass = sec === "nopass" ? "" : `P:${escWifi(String(state.fields.wifiPass ?? ""))};`;
        const hidden = state.fields.wifiHidden ? "H:true;" : "";
        return `WIFI:T:${sec};S:${escWifi(f("ssid"))};${pass}${hidden};`;
      }
      case "email": {
        if (!f("mailTo")) return "";
        const params = [];
        if (f("mailSubject")) params.push(`subject=${encodeURIComponent(f("mailSubject"))}`);
        if (f("mailBody")) params.push(`body=${encodeURIComponent(f("mailBody"))}`);
        return `mailto:${f("mailTo")}${params.length ? `?${params.join("&")}` : ""}`;
      }
      case "tel":
        return f("tel") ? `tel:${f("tel").replace(/[^\d+*#]/g, "")}` : "";
      case "contact": {
        const first = f("firstName"), last = f("lastName");
        if (!first && !last && !f("cTel") && !f("cMail")) return "";
        const lines = [
          "BEGIN:VCARD", "VERSION:3.0",
          `N:${escVcard(last)};${escVcard(first)};;;`,
          `FN:${escVcard(`${first} ${last}`.trim())}`,
        ];
        if (f("cOrg")) lines.push(`ORG:${escVcard(f("cOrg"))}`);
        if (f("cTel")) lines.push(`TEL;TYPE=CELL:${f("cTel")}`);
        if (f("cMail")) lines.push(`EMAIL:${f("cMail")}`);
        if (f("cUrl")) lines.push(`URL:${withScheme(f("cUrl"))}`);
        lines.push("END:VCARD");
        return lines.join("\r\n");
      }
      case "sms":
        return f("smsTo") ? `SMSTO:${phoneDigits(f("smsTo"))}:${f("smsBody")}` : "";
      case "whatsapp": {
        if (!f("waTo")) return "";
        const text = f("waBody") ? `?text=${encodeURIComponent(f("waBody"))}` : "";
        return `https://wa.me/${whatsappNumber(f("waTo"))}${text}`;
      }
      case "event":
        return buildEvent();
      case "place":
        return buildPlace();
      case "social":
        return buildSocial();
      default:
        return "";
    }
  }

  const EMPTY_MESSAGES = {
    url: "Saisissez une adresse pour créer le QR code.",
    text: "Saisissez un texte pour créer le QR code.",
    wifi: "Saisissez le nom du réseau pour créer le QR code.",
    email: "Saisissez un destinataire pour créer le QR code.",
    tel: "Saisissez un numéro pour créer le QR code.",
    contact: "Saisissez un nom, un téléphone ou un e-mail pour créer le QR code.",
    sms: "Saisissez un numéro pour créer le QR code.",
    whatsapp: "Saisissez un numéro WhatsApp pour créer le QR code.",
    event: "Saisissez un titre et une date de début pour créer le QR code.",
    place: "Saisissez une adresse ou utilisez votre position.",
    social: "Saisissez un nom d'utilisateur pour créer le QR code.",
  };

  /* Options de la bibliothèque */

  // La bibliothèque lit les octets caractère par caractère : on passe l'UTF-8 ainsi.
  function toUtf8Binary(text) {
    return Array.from(new TextEncoder().encode(text), (b) => String.fromCharCode(b)).join("");
  }

  function effectiveEc() {
    return state.logo && (state.ec === "L" || state.ec === "M") ? "H" : state.ec;
  }

  function qrOptions(data, size, type, forceOpaque = false) {
    const scale = size / PREVIEW_SIZE;
    const gradient = state.gradient ? {
      type: state.gradType,
      rotation: (Number(state.gradAngle) * Math.PI) / 180,
      colorStops: [{ offset: 0, color: state.fg }, { offset: 1, color: state.fg2 }],
    } : undefined;
    const paint = (color) => (state.linked
      ? { color: state.fg, gradient }
      : { color, gradient: undefined });

    let background = state.transparent ? "transparent" : state.bg;
    if (forceOpaque && state.transparent) background = "#ffffff";

    return {
      width: size,
      height: size,
      type,
      margin: Math.round(Number(state.margin) * scale),
      data: toUtf8Binary(data),
      image: state.logo || undefined,
      qrOptions: { errorCorrectionLevel: effectiveEc() },
      imageOptions: {
        hideBackgroundDots: state.hideDots,
        imageSize: Number(state.logoSize),
        margin: Math.round(Number(state.logoMargin) * scale),
        saveAsBlob: true,
      },
      dotsOptions: { type: state.dots, color: state.fg, gradient },
      cornersSquareOptions: { type: state.corner, ...paint(state.cornerColor) },
      cornersDotOptions: { type: state.cornerDot, ...paint(state.cornerDotColor) },
      backgroundOptions: { color: background },
    };
  }

  // Les points voisins laissent de fines lignes une fois redimensionnés.
  // Un masque avec un léger contour les soude sans changer leur forme.
  async function renderSvg(data, size, forceOpaque = false) {
    const qr = new QRCodeStyling(qrOptions(data, size, "svg", forceOpaque));
    const raw = await qr.getRawData("svg");
    if (!raw) throw new Error("render");

    const doc = new DOMParser().parseFromString(await raw.text(), "image/svg+xml");
    const NS = "http://www.w3.org/2000/svg";
    const clip = doc.querySelector('clipPath[id^="clip-path-dot-color"]');
    if (clip) {
      const mask = doc.createElementNS(NS, "mask");
      mask.id = clip.id;
      Object.entries({ maskUnits: "userSpaceOnUse", x: 0, y: 0, width: size, height: size })
        .forEach(([name, value]) => mask.setAttribute(name, value));
      const group = doc.createElementNS(NS, "g");
      group.setAttribute("fill", "#fff");
      group.setAttribute("stroke", "#fff");
      group.setAttribute("stroke-width", String(size / 1000));
      group.append(...clip.childNodes);
      mask.append(group);
      clip.replaceWith(mask);
      const target = doc.querySelector(`rect[clip-path*="${mask.id}"]`);
      target.removeAttribute("clip-path");
      target.setAttribute("mask", `url(#${mask.id})`);
    }
    return new Blob([new XMLSerializer().serializeToString(doc)], { type: "image/svg+xml" });
  }

  async function loadSvg(svgBlob) {
    const url = URL.createObjectURL(svgBlob);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return img;
    } finally {
      // L'image décodée reste utilisable pour le dessin en cours.
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }

  /* Contraste */

  function luminance(hex) {
    const n = parseInt(hex.slice(1), 16);
    const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map((v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  function contrast(a, b) {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  }

  function scanWarning() {
    if (state.transparent) return "Fond transparent : posez ce QR code sur un support clair.";
    const colors = [state.fg];
    if (state.gradient) colors.push(state.fg2);
    if (!state.linked) colors.push(state.cornerColor, state.cornerDotColor);
    if (colors.some((c) => contrast(c, state.bg) < 3)) {
      return "Contraste trop faible : ce QR code risque de ne pas être lu.";
    }
    if (colors.some((c) => luminance(c) > luminance(state.bg))) {
      return "Couleurs inversées : certains lecteurs ne liront pas ce QR code.";
    }
    if (state.frame !== "none" && !state.frameLinked && state.frame !== "outline"
      && contrast(state.frameColor, state.frameTextColor) < 3) {
      return "Texte du cadre peu lisible : augmentez le contraste.";
    }
    return "";
  }

  /* Cadres avec texte */

  const rect = (x, y, w, h) => `M${x} ${y}h${w}v${h}h${-w}z`;
  const rounded = (x, y, w, h, r) => `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}h${-(w - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${-r}v${-(h - 2 * r)}a${r} ${r} 0 0 1 ${r} ${-r}z`;
  const readableOn = (color) => (contrast(color, "#ffffff") >= contrast(color, "#15182e") ? "#ffffff" : "#15182e");

  function frameColors() {
    const fill = state.frameLinked ? state.fg : state.frameColor;
    if (!state.frameLinked) return { fill, text: state.frameTextColor };
    return { fill, text: state.frame === "outline" ? fill : readableOn(fill) };
  }

  function frameLayout(width, opaque) {
    if (state.frame === "none") {
      return { width, height: width, qrX: 0, qrY: 0, qrSize: width, shapes: [], label: null };
    }

    const { fill, text } = frameColors();
    const surface = state.transparent ? (opaque ? "#ffffff" : null) : state.bg;
    const edge = Math.round(width * 0.045);
    const band = Math.round(width * 0.16);
    const radius = Math.round(width * 0.05);

    if (state.frame === "bubble") {
      const gap = Math.round(width * 0.04);
      const bubble = Math.round(width * 0.135);
      const inset = Math.round(width * 0.06);
      const height = width + gap + bubble + inset;
      const top = width + gap;
      const mid = Math.round(width / 2);
      const shapes = [{ d: `${rounded(inset, top, width - 2 * inset, bubble, Math.round(bubble / 3))} M${mid - gap} ${top + 1}L${mid} ${top - gap}L${mid + gap} ${top + 1}z`, fill }];
      if (surface) shapes.unshift({ d: rect(0, 0, width, height), fill: surface });
      return {
        width, height, qrX: 0, qrY: 0, qrSize: width, shapes,
        label: { x: mid, y: top + bubble / 2, base: bubble * 0.56, max: width - 2 * inset - 2 * gap, color: text },
      };
    }

    const qrSize = width - 2 * edge;
    const height = edge + qrSize + band;
    const qrY = state.frame === "top" ? band : edge;
    const outer = rounded(0, 0, width, height, radius);

    if (state.frame === "outline") {
      const shapes = [{ d: `${outer} ${rect(edge, edge, qrSize, height - 2 * edge)}`, fill, rule: "evenodd" }];
      if (surface) shapes.push({ d: rect(edge, edge + qrSize, qrSize, band - edge), fill: surface });
      return {
        width, height, qrX: edge, qrY, qrSize, shapes,
        label: { x: width / 2, y: edge + qrSize + (band - edge) / 2, base: band * 0.46, max: qrSize - 2 * edge, color: text },
      };
    }

    const labelY = state.frame === "top" ? band / 2 + edge / 4 : edge + qrSize + band / 2 - edge / 4;
    return {
      width, height, qrX: edge, qrY, qrSize,
      shapes: [{ d: `${outer} ${rect(edge, qrY, qrSize, qrSize)}`, fill, rule: "evenodd" }],
      label: { x: width / 2, y: labelY, base: band * 0.5, max: qrSize - 2 * edge, color: text },
    };
  }

  const FRAME_FONT = '"Schibsted Grotesk", system-ui, sans-serif';
  const measureContext = document.createElement("canvas").getContext("2d");

  async function fitLabel(layout, text) {
    if (!layout.label || !text) return null;
    await document.fonts.load(`700 40px "Schibsted Grotesk"`, text).catch(() => {});
    let size = layout.label.base * (Number(state.frameTextSize) / 100);
    measureContext.font = `700 ${size}px ${FRAME_FONT}`;
    const measured = measureContext.measureText(text).width;
    if (measured > layout.label.max) size *= layout.label.max / measured;
    return { ...layout.label, text, size, baseline: layout.label.y + size * 0.35 };
  }

  async function renderComposition(data, width, { opaque = false, frameText = state.frameText } = {}) {
    const layout = frameLayout(width, opaque);
    const [qrSvg, label] = await Promise.all([
      renderSvg(data, layout.qrSize, opaque),
      fitLabel(layout, String(frameText ?? "").trim()),
    ]);
    return { layout, qrSvg, label };
  }

  function paintComposition(context, composition, image) {
    const { layout, label } = composition;
    layout.shapes.forEach((item) => {
      context.fillStyle = item.fill;
      context.fill(new Path2D(item.d), item.rule || "nonzero");
    });
    context.drawImage(image, layout.qrX, layout.qrY, layout.qrSize, layout.qrSize);
    if (label) {
      context.fillStyle = label.color;
      context.font = `700 ${label.size}px ${FRAME_FONT}`;
      context.textAlign = "center";
      context.textBaseline = "alphabetic";
      context.fillText(label.text, label.x, label.baseline);
    }
  }

  async function compositionToSvg({ layout, qrSvg, label }) {
    if (!layout.shapes.length) return qrSvg;
    const NS = "http://www.w3.org/2000/svg";
    const source = new DOMParser().parseFromString(await qrSvg.text(), "image/svg+xml");
    const doc = document.implementation.createDocument(NS, "svg", null);
    const svg = doc.documentElement;
    const set = (node, attributes) => {
      Object.entries(attributes).forEach(([name, value]) => node.setAttribute(name, value));
      return node;
    };
    set(svg, { width: layout.width, height: layout.height, viewBox: `0 0 ${layout.width} ${layout.height}` });

    if (label) {
      const style = doc.createElementNS(NS, "style");
      style.textContent = `@font-face{font-family:"QR Frame";src:url("${window.QR_FONT_DATA}") format("woff2");font-weight:400 900}`;
      svg.append(style);
    }
    layout.shapes.forEach((item) => {
      const path = set(doc.createElementNS(NS, "path"), { d: item.d, fill: item.fill });
      if (item.rule) path.setAttribute("fill-rule", item.rule);
      svg.append(path);
    });
    const nested = doc.importNode(source.documentElement, true);
    set(nested, { x: layout.qrX, y: layout.qrY, width: layout.qrSize, height: layout.qrSize });
    svg.append(nested);
    if (label) {
      const text = set(doc.createElementNS(NS, "text"), {
        x: label.x, y: label.baseline, fill: label.color, "text-anchor": "middle",
        "font-family": '"QR Frame", "Schibsted Grotesk", system-ui, sans-serif',
        "font-size": label.size, "font-weight": 700,
      });
      text.textContent = label.text;
      svg.append(text);
    }
    return new Blob([new XMLSerializer().serializeToString(doc)], { type: "image/svg+xml" });
  }

  async function renderBlob(data, format, size, frameText = state.frameText) {
    const composition = await renderComposition(data, Number(size), { opaque: format === "jpeg", frameText });
    if (format === "svg") return compositionToSvg(composition);

    const image = await loadSvg(composition.qrSvg);
    const canvas = document.createElement("canvas");
    canvas.width = composition.layout.width;
    canvas.height = composition.layout.height;
    const context = canvas.getContext("2d");
    if (format === "jpeg") {
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    paintComposition(context, composition, image);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, `image/${format}`, 0.95));
    canvas.width = canvas.height = 0;
    if (!blob) throw new Error("export");
    return blob;
  }

  /* Rendu */

  function schedule() {
    save();
    syncUi();
    clearTimeout(drawTimer);
    drawTimer = setTimeout(draw, 40);
  }

  function setStatus(text, kind = "warning") {
    el.status.textContent = text;
    el.status.className = text ? `status alert alert-soft alert-${kind}` : "status";
  }

  function setReady(ready) {
    el.sticker.classList.remove("skeleton");
    el.download.disabled = !ready;
    el.copy.disabled = !ready;
    $("#quick-download").disabled = !ready;
    refreshPrint();
    refreshWizard();
  }

  function showEmpty(message, isError) {
    currentData = "";
    el.preview.hidden = true;
    el.sticker.style.removeProperty("--sticker-ratio");
    el.sticker.classList.remove("has-frame");
    el.empty.hidden = false;
    el.empty.textContent = message;
    setStatus(isError ? "QR code non généré." : "", "error");
    setReady(false);
  }

  async function draw() {
    const token = ++drawToken;
    const data = buildData();
    if (!data) return showEmpty(EMPTY_MESSAGES[state.type]);

    try {
      // Dessin en pleine résolution : la réduction à l'écran reste nette.
      const composition = await renderComposition(data, PREVIEW_SIZE);
      if (token !== drawToken) return;
      const img = await loadSvg(composition.qrSvg);
      if (token !== drawToken) return;

      const { width, height } = composition.layout;
      if (el.preview.width !== width || el.preview.height !== height) {
        el.preview.width = width;
        el.preview.height = height;
      }
      previewContext.clearRect(0, 0, width, height);
      paintComposition(previewContext, composition, img);
      el.sticker.style.setProperty("--sticker-ratio", String(height / width));
      el.sticker.classList.toggle("has-frame", state.frame !== "none" && state.frame !== "bubble");
      el.preview.setAttribute("aria-label", `QR code contenant : ${data.slice(0, 120)}`);
      el.preview.hidden = false;
      el.empty.hidden = true;
      currentData = data;
      setStatus(scanWarning());
      setReady(true);
      // Petit rebond quand un réglage visuel change.
      if (popNext && !reduceMotion()) {
        el.sticker.animate([{ transform: "scale(.95)" }, { transform: "none" }], { duration: 320, easing: "cubic-bezier(.34, 1.56, .64, 1)" });
      }
      popNext = false;
    } catch (error) {
      if (token !== drawToken) return;
      const tooLong = /overflow|length/i.test(String(error?.message ?? error));
      showEmpty(tooLong
        ? "Contenu trop long. Raccourcissez-le ou baissez la résistance aux dégâts."
        : "Génération impossible avec ces réglages. Modifiez le contenu ou retirez le logo.", true);
    }
  }

  /* Interface */

  function buildChoices(key) {
    const root = $(`#${key}`);
    root.replaceChildren(...OPTIONS[key].map(([value, label, icon]) => {
      const wrap = document.createElement("label");
      wrap.className = root.classList.contains("join") ? "btn choice join-item" : "btn choice";
      wrap.title = label;
      const input = document.createElement("input");
      input.type = "radio";
      input.name = key;
      input.value = value;
      wrap.append(input);
      if (icon) {
        input.setAttribute("aria-label", label);
        wrap.insertAdjacentHTML("beforeend", `<svg viewBox="0 0 24 24" aria-hidden="true">${icon}</svg><small>${label}</small>`);
        wrap.classList.add("has-icon");
      } else {
        wrap.append(label);
      }
      input.addEventListener("change", () => {
        state[key] = value;
        popNext = key !== "type";
        schedule();
        if (key === "type" && !reduceMotion()) {
          $(`[data-type="${value}"]`).animate(
            [{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }],
            { duration: 240, easing: EASE },
          );
        }
      });
      return wrap;
    }));
  }

  function buildColor(row) {
    const key = row.dataset.color;
    const name = $("span", row).textContent;
    const picker = document.createElement("input");
    picker.type = "color";
    picker.className = "picker join-item";
    picker.setAttribute("aria-label", `${name} : sélecteur`);
    const hex = document.createElement("input");
    hex.type = "text";
    hex.className = "input join-item";
    hex.maxLength = 7;
    hex.spellcheck = false;
    hex.setAttribute("aria-label", `${name} : code hexadécimal`);
    const join = document.createElement("div");
    join.className = "join";
    join.append(picker, hex);
    row.append(join);

    picker.addEventListener("input", () => {
      state[key] = picker.value;
      schedule();
    });
    hex.addEventListener("input", () => {
      let value = hex.value.trim().toLowerCase();
      if (value && value[0] !== "#") value = `#${value}`;
      if (/^#[0-9a-f]{3}$/.test(value)) value = `#${[...value.slice(1)].map((c) => c + c).join("")}`;
      const valid = /^#[0-9a-f]{6}$/.test(value);
      hex.setAttribute("aria-invalid", String(!valid));
      if (valid) {
        state[key] = value;
        picker.value = value;
        schedule();
      }
    });
    hex.addEventListener("blur", () => {
      hex.value = state[key];
      hex.removeAttribute("aria-invalid");
    });
  }

  function formatOutput(key) {
    if (key === "logoSize") return `${Math.round(state.logoSize * 100)} %`;
    if (key === "gradAngle") return `${state.gradAngle}°`;
    if (key === "frameTextSize") return `${state.frameTextSize} %`;
    return `${state[key]} px`;
  }

  function syncUi() {
    $$("[data-type]").forEach((n) => { n.hidden = n.dataset.type !== state.type; });
    Object.keys(OPTIONS).forEach((key) => {
      $$(`input[name="${key}"]`).forEach((input) => { input.checked = input.value === state[key]; });
    });
    $$('input[name="ec"]').forEach((input) => {
      input.disabled = Boolean(state.logo) && (input.value === "L" || input.value === "M");
      input.checked = input.value === effectiveEc();
    });

    $$("[data-key]").forEach((input) => {
      const key = input.dataset.key;
      if (input.type === "checkbox") input.checked = Boolean(state[key]);
      else if (document.activeElement !== input || input.tagName === "SELECT") input.value = state[key];
    });
    $$("output[data-for]").forEach((o) => { o.textContent = formatOutput(o.dataset.for); });

    $$("[data-color]").forEach((row) => {
      const key = row.dataset.color;
      const [picker, hex] = $$("input", row);
      picker.value = state[key];
      if (document.activeElement !== hex) hex.value = state[key];
    });

    $("#gradient-options").hidden = !state.gradient;
    $("#angle-row").hidden = state.gradType !== "linear";
    $("#corner-colors").hidden = state.linked;
    $("#bg-row").hidden = state.transparent;
    $("#frame-options").hidden = state.frame === "none";
    $("#frame-colors").hidden = state.frameLinked;

    el.logoFile.hidden = !state.logo;
    el.drop.hidden = Boolean(state.logo);
    el.pasteBox.hidden = Boolean(state.logo);
    el.logoOptions.hidden = !state.logo;
    if (state.logo) {
      el.logoThumb.src = state.logo;
      el.logoName.textContent = state.logoName;
    }

    el.sizeField.hidden = state.format === "svg";
    el.exportBar.style.gridTemplateColumns = state.format === "svg" ? "1fr" : "";
    el.download.textContent = `Télécharger en ${state.format === "jpeg" ? "JPEG" : state.format === "webp" ? "WebP" : state.format.toUpperCase()}`;

    const root = document.documentElement.style;
    root.setProperty("--stage", state.fg);
    root.setProperty("--on-stage", contrast(state.fg, "#ffffff") >= contrast(state.fg, "#15182e") ? "#ffffff" : "#15182e");
    root.setProperty("--sticker", state.transparent ? "#ffffff" : state.bg);
    $('meta[name="theme-color"]').content = state.fg;
    el.sticker.classList.toggle("is-transparent", state.transparent);
    refreshBatch();
  }

  function bindFields() {
    $$("[data-field]").forEach((input) => {
      const name = input.dataset.field;
      if (input.type === "checkbox") input.checked = Boolean(state.fields[name]);
      else input.value = state.fields[name] ?? "";
      const handler = () => {
        state.fields[name] = input.type === "checkbox" ? input.checked : input.value;
        if (name === "socialUser" && state.frameAuto) state.frameText = instagramText();
        schedule();
      };
      input.addEventListener("input", handler);
      input.addEventListener("change", handler);
    });

    $$("[data-key]").forEach((input) => {
      const key = input.dataset.key;
      input.addEventListener(input.type === "range" || input.type === "text" ? "input" : "change", () => {
        if (key === "frameText") state.frameAuto = false;
        if (key === "printDistance") state.printSize = "";
        if (input.type === "checkbox") {
          popNext = !key.startsWith("print");
          state[key] = input.checked;
          if (key === "linked" && !input.checked) {
            state.cornerColor = state.fg;
            state.cornerDotColor = state.fg;
          }
          if (key === "frameLinked" && !input.checked) {
            state.frameColor = state.fg;
            state.frameTextColor = readableOn(state.fg);
          }
        } else if (input.type === "range") {
          state[key] = Number(input.value);
        } else {
          state[key] = input.value;
        }
        schedule();
      });
    });
  }

  function buildFramePresets() {
    $("#frame-presets").replaceChildren(...FRAME_PRESETS.map((label) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "btn btn-sm btn-outline";
      button.textContent = label;
      button.addEventListener("click", () => {
        state.frameText = label;
        $('[data-key="frameText"]').value = label;
        schedule();
      });
      return button;
    }));
  }

  function buildSwatches() {
    $("#swatches").replaceChildren(...PALETTES.map(([name, fg, bg]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "swatch";
      button.title = name;
      button.setAttribute("aria-label", `Palette ${name}`);
      button.style.background = `linear-gradient(135deg, ${fg} 50%, ${bg} 50%)`;
      button.classList.add("tooltip");
      button.dataset.tip = name;
      button.addEventListener("click", () => {
        popNext = true;
        Object.assign(state, { fg, bg, cornerColor: fg, cornerDotColor: fg, frameColor: fg, frameTextColor: readableOn(fg), transparent: false, gradient: false });
        schedule();
      });
      return button;
    }));
  }

  /* Logo SVG : nettoyé avant usage */

  function sanitizeSvg(source) {
    const doc = new DOMParser().parseFromString(source.trim(), "image/svg+xml");
    const svg = doc.documentElement;
    if (doc.querySelector("parsererror") || svg.localName !== "svg") {
      throw new Error("Ce fichier n'est pas un SVG valide.");
    }

    doc.querySelectorAll("script, foreignObject, iframe, object, embed, audio, video")
      .forEach((node) => node.remove());
    [svg, ...svg.querySelectorAll("*")].forEach((node) => {
      [...node.attributes].forEach((attr) => {
        const name = attr.name.toLowerCase();
        const value = attr.value.trim();
        if (name.startsWith("on")) node.removeAttribute(attr.name);
        else if ((name === "href" || name === "xlink:href")
          && !/^#|^data:image\/(png|jpe?g|gif|webp);/i.test(value)) node.removeAttribute(attr.name);
      });
    });

    if (!svg.children.length) throw new Error("Ce SVG est vide.");

    // Dimensions explicites : nécessaires pour le dessin sur canvas.
    const number = (v) => (/^[\d.]+(px)?$/.test(v || "") ? parseFloat(v) : 0);
    let box = (svg.getAttribute("viewBox") || "").trim().split(/[\s,]+/).map(Number);
    if (box.length !== 4 || box.some(Number.isNaN) || box[2] <= 0 || box[3] <= 0) {
      const w = number(svg.getAttribute("width")) || 512;
      const h = number(svg.getAttribute("height")) || 512;
      box = [0, 0, w, h];
      svg.setAttribute("viewBox", box.join(" "));
    }
    const ratio = 1024 / Math.max(box[2], box[3]);
    svg.setAttribute("width", String(Math.round(box[2] * ratio)));
    svg.setAttribute("height", String(Math.round(box[3] * ratio)));
    if (!svg.getAttribute("xmlns")) svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");

    const clean = new XMLSerializer().serializeToString(svg);
    const bytes = new TextEncoder().encode(clean);
    let binary = "";
    bytes.forEach((b) => { binary += String.fromCharCode(b); });
    return `data:image/svg+xml;base64,${btoa(binary)}`;
  }

  function logoError(message) {
    el.logoError.textContent = message;
    el.logoError.hidden = !message;
  }

  function applyLogo(source, name) {
    try {
      state.logo = sanitizeSvg(source);
      state.logoName = name;
      if (state.ec === "L" || state.ec === "M") state.ec = "H";
      logoError("");
      el.logoCode.value = "";
      el.pasteBox.open = false;
      schedule();
    } catch (error) {
      logoError(error.message);
    }
  }

  async function readLogoFile(file) {
    if (!file) return;
    if (!/\.svg$/i.test(file.name) && file.type !== "image/svg+xml") {
      return logoError("Choisissez un fichier au format SVG.");
    }
    if (file.size > MAX_LOGO_BYTES) return logoError("Ce fichier dépasse 1 Mo. Choisissez un SVG plus léger.");
    applyLogo(await file.text(), file.name);
  }

  function bindLogo() {
    el.logoInput.addEventListener("change", () => {
      readLogoFile(el.logoInput.files[0]);
      el.logoInput.value = "";
    });
    ["dragenter", "dragover"].forEach((type) => el.drop.addEventListener(type, (e) => {
      e.preventDefault();
      el.drop.classList.add("is-over");
    }));
    ["dragleave", "drop"].forEach((type) => el.drop.addEventListener(type, (e) => {
      e.preventDefault();
      el.drop.classList.remove("is-over");
    }));
    el.drop.addEventListener("drop", (e) => readLogoFile(e.dataTransfer.files[0]));
    $("#logo-apply").addEventListener("click", () => {
      if (!el.logoCode.value.trim()) return logoError("Collez un code SVG avant de valider.");
      applyLogo(el.logoCode.value, "Code SVG collé");
    });
    $("#logo-remove").addEventListener("click", () => {
      state.logo = null;
      state.logoName = "";
      logoError("");
      schedule();
    });
  }

  /* Export */

  async function exportBlob(format, size) {
    return renderBlob(currentData, format, size);
  }

  const isInstalled = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;

  // Une app installée sur iPhone passe par le menu de partage pour enregistrer.
  async function saveBlob(blob, name) {
    if (isInstalled() && navigator.canShare) {
      const file = new File([blob], name, { type: blob.type });
      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file] });
          return "shared";
        } catch (error) {
          if (error.name === "AbortError") return "cancelled";
        }
      }
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    return "downloaded";
  }

  // Notification daisyUI qui apparaît puis s'efface.
  function toast(message, kind = "success") {
    const item = document.createElement("div");
    item.className = `alert alert-${kind}`;
    item.setAttribute("role", kind === "error" ? "alert" : "status");
    item.textContent = message;
    $("#toasts").append(item);
    const still = reduceMotion();
    if (!still) {
      item.animate([{ opacity: 0, transform: "translateY(-14px) scale(.96)" }, { opacity: 1, transform: "none" }], { duration: 260, easing: EASE });
    }
    setTimeout(async () => {
      if (!still) {
        await item.animate([{ opacity: 1 }, { opacity: 0, transform: "translateY(-8px)" }], { duration: 200, easing: "ease-in", fill: "forwards" }).finished.catch(() => {});
      }
      item.remove();
    }, 2600);
  }

  const flash = (message, kind) => toast(message, kind);

  function bindExport() {
    el.download.addEventListener("click", async () => {
      if (!currentData) return;
      el.download.disabled = true;
      const spinner = document.createElement("span");
      spinner.className = "loading loading-spinner loading-sm";
      el.download.prepend(spinner);
      try {
        const blob = await exportBlob(state.format, state.size);
        const outcome = await saveBlob(blob, `qrcode.${state.format === "jpeg" ? "jpg" : state.format}`);
        if (outcome === "downloaded") flash("QR code téléchargé.");
        if (outcome === "shared") flash("QR code partagé.");
      } catch {
        flash("Téléchargement impossible. Essayez un autre format.", "error");
      } finally {
        spinner.remove();
        el.download.disabled = !currentData;
      }
    });

    if (navigator.clipboard && window.ClipboardItem) {
      el.copy.hidden = false;
      el.exportBar.classList.add("can-copy");
      el.copy.addEventListener("click", async () => {
        if (!currentData) return;
        try {
          const blob = await exportBlob("png", 1024);
          await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
          flash("Image copiée.");
        } catch {
          flash("Copie refusée par le navigateur. Utilisez le téléchargement.", "error");
        }
      });
    }

    const resetDialog = $("#reset-dialog");
    $("#reset").addEventListener("click", () => resetDialog.showModal());
    $("#reset-confirm").addEventListener("click", () => {
      resetDialog.close();
      popNext = true;
      toast("Réglages réinitialisés.");
      state = clone(DEFAULTS);
      $$("[data-field]").forEach((input) => {
        const name = input.dataset.field;
        if (input.type === "checkbox") input.checked = false;
        else input.value = state.fields[name] ?? "";
      });
      logoError("");
      schedule();
    });
  }

  /* Modèles Instagram */

  const instagramText = () => {
    const user = f("socialUser").replace(/^@+/, "");
    return user ? `@${user}` : "Suivez-nous";
  };

  function buildTemplates() {
    $("#template-list").replaceChildren(...TEMPLATES.map((template) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "card card-border template";
      button.innerHTML = `<figure><img src="templates/${template.id}.png" alt="" width="240" loading="lazy" /></figure><span class="card-body"><span class="card-title"></span></span>`;
      $(".card-title", button).textContent = template.name;
      button.setAttribute("aria-label", `Appliquer le modèle ${template.name}`);
      button.addEventListener("click", () => {
        Object.assign(state, {
          transparent: false, linked: true, frameLinked: true, frameTextSize: 100, margin: 48,
          ...template.style,
          type: "social",
          frameAuto: true,
        });
        state.cornerColor = state.cornerDotColor = state.frameColor = state.fg;
        state.fields.socialNet = "instagram";
        state.frameText = instagramText();
        $('[data-field="socialNet"]').value = "instagram";
        popNext = true;
        schedule();
        toast(`Modèle « ${template.name} » appliqué.`);
        if (!f("socialUser")) $('[data-field="socialUser"]').focus();
      });
      return button;
    }));
  }

  /* Impression */

  let moduleCache = { key: "", count: 0 };

  function moduleCount(data) {
    const key = `${effectiveEc()}|${data}`;
    if (moduleCache.key !== key) {
      const qr = new QRCodeStyling({ data: toUtf8Binary(data), qrOptions: { errorCorrectionLevel: effectiveEc() } })._qr;
      moduleCache = { key, count: qr ? qr.getModuleCount() : 25 };
    }
    return moduleCache.count;
  }

  const cm = (value) => `${String(Math.round(value * 10) / 10).replace(".", ",")} cm`;

  // Règle courante : un côté de QR code d'au moins 1/10 de la distance de scan,
  // agrandi quand le code contient beaucoup de points.
  function printInfo() {
    if (!currentData) return null;
    const modules = moduleCount(currentData);
    const layout = frameLayout(1000, true);
    const ratio = layout.height / layout.width;
    const qrShare = layout.qrSize / layout.width;
    const distance = Number(state.printDistance);
    const qrMin = Math.max(2, distance / 10) * Math.max(1, modules / 29);
    const needed = Math.ceil((qrMin / qrShare) * 2) / 2;
    const maxWidth = Math.min(19, Math.floor(((QRPrint.PAGE.h - 2) / ratio) * 2) / 2);
    const recommended = Math.min(needed, maxWidth);
    const width = Math.min(maxWidth, Math.max(1.5, parseFloat(state.printSize) || recommended));
    return { ratio, needed, maxWidth, recommended, width, height: width * ratio, distance };
  }

  function refreshPrint() {
    const info = printInfo();
    $("#print-run").disabled = !info;
    if (!info) return;
    // Sans largeur choisie, la taille conseillée suit les réglages.
    const sizeInput = $('[data-key="printSize"]');
    if (!parseFloat(state.printSize) && document.activeElement !== sizeInput) sizeInput.value = String(info.recommended);
    $('[data-key="printSize"]').max = String(info.maxWidth);
    const where = info.distance >= 100 ? `${info.distance / 100} m` : `${info.distance} cm`;
    $("#print-advice").textContent = info.needed > info.maxWidth
      ? `Pour un scan à ${where}, prévoyez au moins ${cm(info.needed)} de large : c'est plus grand qu'une page A4, imprimez sur un format plus grand.`
      : `Pour un scan à ${where}, prévoyez au moins ${cm(info.needed)} de large.`;
    const warning = $("#print-warning");
    warning.hidden = info.width >= info.needed;
    warning.textContent = `À ${cm(info.width)}, ce QR code risque de ne pas être lu à ${where}.`;
    const { cols, rows } = QRPrint.grid(info.width, info.height, state.printLayout);
    const size = `${cm(info.width)} × ${cm(info.height)}`;
    $("#print-summary").textContent = state.printLayout === "sheet"
      ? `${cols * rows} étiquette${cols * rows > 1 ? "s" : ""} de ${size} par page A4 (${cols} × ${rows}).`
      : `Un QR code de ${size}, centré sur une page A4.`;
  }

  function bindPrint() {
    const button = $("#print-run");
    button.addEventListener("click", async () => {
      const info = printInfo();
      if (!info) return;
      button.disabled = true;
      const spinner = document.createElement("span");
      spinner.className = "loading loading-spinner loading-sm";
      button.prepend(spinner);
      try {
        // 300 points par pouce : la qualité d'impression standard.
        const px = Math.min(4096, Math.round((info.width / 2.54) * 300));
        const image = await renderBlob(currentData, "jpeg", px);
        const layout = frameLayout(px, true);
        const pdf = QRPrint.makePdf({
          jpeg: new Uint8Array(await image.arrayBuffer()),
          pxW: layout.width, pxH: layout.height,
          wCm: info.width, hCm: info.height,
          layout: state.printLayout, cuts: state.printCuts,
        });
        const outcome = await saveBlob(pdf, "qrcode.pdf");
        if (outcome !== "cancelled") toast("PDF créé.");
      } catch {
        toast("Création du PDF impossible. Réduisez la taille.", "error");
      } finally {
        spinner.remove();
        button.disabled = !currentData;
      }
    });
  }

  /* Création en lot */

  const BATCH_LIMIT = 500;
  const BATCH_MAX_SIZE = 2048;

  function batchValue(value) {
    return /^[\w-]+(\.[\w-]+)*\.[a-z]{2,}(\/\S*)?$/i.test(value) ? `https://${value}` : value;
  }

  function bindBatch() {
    const ui = {
      drop: $("#batch-drop"), input: $("#batch-input"), code: $("#batch-code"), pasteBox: $("#batch-paste-box"),
      error: $("#batch-error"), options: $("#batch-options"), name: $("#batch-name"), header: $("#batch-header"),
      content: $("#batch-content"), fileCol: $("#batch-file-col"), frameField: $("#batch-frame-field"),
      frameCol: $("#batch-frame-col"), preview: $("#batch-preview"), run: $("#batch-run"),
      progressBox: $("#batch-progress-box"), progress: $("#batch-progress"), result: $("#batch-result"),
    };
    let batch = null;
    let cancelled = false;
    let running = false;

    const showError = (message) => {
      ui.error.textContent = message;
      ui.error.hidden = !message;
    };

    const dataRows = () => (ui.header.checked ? batch.rows.slice(1) : batch.rows);

    function columnLabels() {
      const count = Math.max(...batch.rows.map((row) => row.cells.length));
      return Array.from({ length: count }, (_, i) => (ui.header.checked && batch.rows[0].cells[i]) || `Colonne ${i + 1}`);
    }

    function fillSelect(select, labels, selected, emptyLabel) {
      const options = labels.map((label, i) => new Option(label, String(i)));
      if (emptyLabel) options.unshift(new Option(emptyLabel, ""));
      select.replaceChildren(...options);
      select.value = selected >= 0 ? String(selected) : (emptyLabel ? "" : "0");
    }

    function fillColumns() {
      const labels = columnLabels();
      const content = QRBatch.guessColumn(labels, /url|lien|link|contenu|content|adresse|site/i);
      fillSelect(ui.content, labels, Math.max(content, 0));
      fillSelect(ui.fileCol, labels, QRBatch.guessColumn(labels, /^(nom|name|fichier|file|titre|title)/i), "Numéro automatique");
      fillSelect(ui.frameCol, labels, QRBatch.guessColumn(labels, /cadre|frame|label|texte/i), "Texte du cadre actuel");
    }

    function entries() {
      const contentIndex = Number(ui.content.value);
      const fileIndex = ui.fileCol.value === "" ? -1 : Number(ui.fileCol.value);
      const frameIndex = ui.frameCol.value === "" ? -1 : Number(ui.frameCol.value);
      return dataRows().map((row, index) => ({
        line: row.line,
        data: batchValue(row.cells[contentIndex] || ""),
        base: QRBatch.safeName(fileIndex >= 0 ? row.cells[fileIndex] || "" : "") || `qrcode-${String(index + 1).padStart(3, "0")}`,
        frameText: frameIndex >= 0 ? row.cells[frameIndex] || "" : state.frameText,
      }));
    }

    function refresh() {
      if (!batch) return;
      const list = entries();
      const usable = list.filter((entry) => entry.data).length;
      ui.frameField.hidden = state.frame === "none";
      const count = document.createElement("span");
      count.className = "badge badge-primary badge-sm";
      count.textContent = `${usable} QR code${usable > 1 ? "s" : ""}`;
      ui.name.replaceChildren(`${batch.name} `, count);
      ui.preview.replaceChildren(...list.filter((entry) => entry.data).slice(0, 3).map((entry) => {
        const item = document.createElement("li");
        item.className = "list-row";
        const name = document.createElement("strong");
        name.textContent = entry.base;
        const value = document.createElement("span");
        value.textContent = entry.data;
        item.append(name, value);
        return item;
      }));
      ui.run.disabled = running || !usable;
      const size = Math.min(Number(state.size), BATCH_MAX_SIZE);
      const format = state.format === "jpeg" ? "JPEG" : state.format === "webp" ? "WebP" : state.format.toUpperCase();
      ui.run.textContent = `Créer le ZIP de ${usable} ${format}${state.format === "svg" ? "" : ` (${size} px)`}`;
    }

    function loadBatch(text, name) {
      const rows = QRBatch.parseCsv(text);
      if (!rows.length) return showError("Ce fichier est vide. Ajoutez au moins une ligne.");
      const header = QRBatch.guessHeader(rows);
      if (rows.length - (header ? 1 : 0) > BATCH_LIMIT) {
        return showError(`Ce fichier dépasse ${BATCH_LIMIT} lignes. Découpez-le en plusieurs lots.`);
      }
      batch = { rows, name };
      ui.header.checked = header;
      showError("");
      ui.result.textContent = "";
      ui.options.hidden = false;
      ui.drop.hidden = true;
      ui.pasteBox.hidden = true;
      ui.pasteBox.open = false;
      ui.code.value = "";
      fillColumns();
      refresh();
    }

    async function readFile(file) {
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) return showError("Ce fichier dépasse 5 Mo. Découpez-le en plusieurs lots.");
      loadBatch(QRBatch.decodeText(await file.arrayBuffer()), file.name);
    }

    async function run() {
      const list = entries();
      const todo = list.filter((entry) => entry.data);
      const skipped = list.filter((entry) => !entry.data).map((entry) => entry.line);
      const failed = [];
      const zipFiles = [];
      const used = new Set();
      const extension = state.format === "jpeg" ? "jpg" : state.format;
      const size = Math.min(Number(state.size), BATCH_MAX_SIZE);

      running = true;
      cancelled = false;
      ui.run.disabled = true;
      const spinner = document.createElement("span");
      spinner.className = "loading loading-spinner loading-sm";
      ui.run.prepend(spinner);
      ui.progressBox.hidden = false;
      ui.progress.max = todo.length;
      ui.progress.value = 0;
      ui.result.textContent = "";

      try {
        for (let i = 0; i < todo.length && !cancelled; i += 1) {
          const entry = todo[i];
          try {
            const blob = await renderBlob(entry.data, state.format, size, entry.frameText);
            zipFiles.push(await QRBatch.zipEntry(QRBatch.uniqueName(entry.base, extension, used), blob));
          } catch {
            failed.push(entry.line);
          }
          ui.progress.value = i + 1;
          ui.result.textContent = `${i + 1} sur ${todo.length}`;
          await new Promise((resolve) => setTimeout(resolve));
        }

        if (cancelled) {
          ui.result.textContent = "Création annulée.";
        } else if (!zipFiles.length) {
          ui.result.textContent = "Aucun QR code créé. Vérifiez que les contenus ne sont pas trop longs.";
        } else {
          const outcome = await saveBlob(QRBatch.makeZip(zipFiles), "qrcodes.zip");
          const notes = [];
          if (failed.length) notes.push(`Trop long, ligne${failed.length > 1 ? "s" : ""} ${failed.join(", ")}.`);
          if (skipped.length) notes.push(`Sans contenu, ligne${skipped.length > 1 ? "s" : ""} ${skipped.join(", ")}.`);
          const done = outcome === "cancelled" ? "Partage annulé." : `${zipFiles.length} QR code${zipFiles.length > 1 ? "s" : ""} dans qrcodes.zip.`;
          ui.result.textContent = [done, ...notes].join(" ");
        }
      } catch {
        ui.result.textContent = "Création du ZIP impossible. Réduisez la taille ou le nombre de lignes.";
      } finally {
        running = false;
        ui.progressBox.hidden = true;
        refresh();
      }
    }

    ui.input.addEventListener("change", () => {
      readFile(ui.input.files[0]);
      ui.input.value = "";
    });
    ["dragenter", "dragover"].forEach((type) => ui.drop.addEventListener(type, (event) => {
      event.preventDefault();
      ui.drop.classList.add("is-over");
    }));
    ["dragleave", "drop"].forEach((type) => ui.drop.addEventListener(type, (event) => {
      event.preventDefault();
      ui.drop.classList.remove("is-over");
    }));
    ui.drop.addEventListener("drop", (event) => readFile(event.dataTransfer.files[0]));
    $("#batch-apply").addEventListener("click", () => {
      if (!ui.code.value.trim()) return showError("Collez une liste avant de valider.");
      loadBatch(ui.code.value, "Liste collée");
    });
    $("#batch-remove").addEventListener("click", () => {
      cancelled = true;
      batch = null;
      ui.options.hidden = true;
      ui.drop.hidden = false;
      ui.pasteBox.hidden = false;
      ui.result.textContent = "";
      showError("");
    });
    $("#batch-cancel").addEventListener("click", () => { cancelled = true; });
    ui.header.addEventListener("change", () => {
      fillColumns();
      refresh();
    });
    [ui.content, ui.fileCol, ui.frameCol].forEach((select) => select.addEventListener("change", refresh));
    ui.run.addEventListener("click", run);
    return refresh;
  }

  /* Position */

  function bindLocate() {
    const button = $("#locate");
    const error = $("#locate-error");
    if (!navigator.geolocation) {
      button.hidden = true;
      return;
    }
    button.addEventListener("click", () => {
      error.hidden = true;
      button.disabled = true;
      button.textContent = "Recherche de la position";
      const done = () => {
        button.disabled = false;
        button.textContent = "Utiliser ma position";
      };
      navigator.geolocation.getCurrentPosition(({ coords }) => {
        const value = `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
        state.fields.place = value;
        $('[data-field="place"]').value = value;
        done();
        schedule();
      }, (failure) => {
        error.textContent = failure.code === 1
          ? "Accès à la position refusé. Autorisez-le dans les réglages ou saisissez une adresse."
          : "Position introuvable. Saisissez une adresse.";
        error.hidden = false;
        done();
      }, { enableHighAccuracy: true, timeout: 10000 });
    });
  }

  function showInstallHint() {
    const ios = /iP(hone|ad|od)/.test(navigator.userAgent)
      || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    $("#install").hidden = !ios || isInstalled();
  }

  /* Mobile : onglets et clavier virtuel */


  /* Parcours par étapes */

  function bindWizard() {
    const buttons = $$("[data-tab-button]");
    const steps = buttons.map((button) => button.dataset.tabButton);
    const prev = $("#prev");
    const next = $("#next");
    const compact = matchMedia(COMPACT_QUERY);
    let current = 0;

    const sections = (id) => $$(`.panel [data-tab="${id}"]`);

    function show(index, moveFocus) {
      const from = current;
      current = Math.max(0, Math.min(steps.length - 1, index));
      const id = steps[current];
      $$(".panel [data-tab]").forEach((node) => node.classList.toggle("is-active", node.dataset.tab === id));
      // L'étape arrive du côté où l'on avance.
      if (moveFocus && from !== current && !reduceMotion()) {
        const shift = (current > from ? 1 : -1) * 28;
        sections(id).forEach((node, i) => node.animate(
          [{ opacity: 0, transform: `translateX(${shift}px)` }, { opacity: 1, transform: "none" }],
          { duration: 320, delay: i * 40, easing: EASE, fill: "backwards" },
        ));
      }
      buttons.forEach((button, i) => {
        button.classList.toggle("step-primary", i <= current);
        if (i === current) button.setAttribute("aria-current", "step");
        else button.removeAttribute("aria-current");
      });
      refresh();

      if (compact.matches) el.form.scrollTop = 0;
      else if (el.form.getBoundingClientRect().top < 0) window.scrollTo({ top: 0 });
      if (moveFocus) {
        const first = sections(id)[0];
        first.setAttribute("tabindex", "-1");
        first.focus({ preventScroll: true });
      }
    }

    // Impossible d'avancer tant que le contenu ne donne pas de QR code.
    function refresh() {
      prev.disabled = current === 0;
      next.hidden = current === steps.length - 1;
      next.disabled = current === 0 && !currentData;
      next.title = next.disabled ? "Complétez le contenu pour continuer" : "";
      if (!next.hidden) next.setAttribute("aria-label", `Suivant : ${buttons[current + 1].textContent}`);
    }

    buttons.forEach((button, i) => button.addEventListener("click", () => {
      if (i > 0 && !currentData) return;
      show(i, true);
    }));
    prev.addEventListener("click", () => show(current - 1, true));
    next.addEventListener("click", () => show(current + 1, true));
    $("#quick-download").addEventListener("click", () => el.download.click());
    refreshWizard = refresh;
    show(0, false);
  }

  function bindViewport() {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const compact = matchMedia(COMPACT_QUERY);
    const root = document.documentElement.style;
    const typing = "input:not([type=range],[type=checkbox],[type=radio],[type=color],[type=file]),textarea";
    let fullHeight = 0;
    let lastWidth = 0;

    const sync = () => {
      if (!compact.matches) {
        root.removeProperty("--app-height");
        root.removeProperty("--app-top");
        document.body.classList.remove("keyboard-open");
        return;
      }
      if (window.innerWidth !== lastWidth) {
        lastWidth = window.innerWidth;
        fullHeight = 0;
      }
      fullHeight = Math.max(fullHeight, viewport.height);
      const active = document.activeElement;
      const open = Boolean(active?.matches(typing)) && viewport.height < fullHeight * 0.8;
      const changed = open !== document.body.classList.contains("keyboard-open");
      root.setProperty("--app-height", `${viewport.height}px`);
      root.setProperty("--app-top", `${viewport.offsetTop}px`);
      document.body.classList.toggle("keyboard-open", open);
      if (open && changed) requestAnimationFrame(() => active.scrollIntoView({ block: "nearest" }));
    };

    viewport.addEventListener("resize", sync);
    viewport.addEventListener("scroll", sync);
    compact.addEventListener("change", sync);
    document.addEventListener("focusin", sync);
    document.addEventListener("focusout", () => setTimeout(sync, 60));
    sync();
  }

  /* Transition depuis l'accueil */

  async function playEntrance() {
    const html = document.documentElement;
    const from = window.__qrEntrance;
    if (!from || !html.classList.contains("is-entering")) return;

    const ghost = new Image();
    ghost.className = "entrance-ghost";
    ghost.alt = "";
    ghost.src = from.image;
    try {
      await ghost.decode();
    } catch {
      html.classList.remove("is-entering");
      return;
    }
    if (!html.classList.contains("is-entering")) return;

    const to = el.sticker.getBoundingClientRect();
    const panel = el.form.getBoundingClientRect();
    const sheet = panel.left > 1
      ? `translateX(${window.innerWidth - panel.left}px)`
      : `translateY(${window.innerHeight - panel.top}px)`;
    const motion = { duration: 560, easing: "cubic-bezier(.22, 1, .36, 1)", fill: "backwards" };

    el.sticker.append(ghost);
    el.sticker.style.transformOrigin = "0 0";
    html.classList.replace("is-entering", "is-animating");

    const animations = [
      el.sticker.animate([
        { transform: `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width})` },
        { transform: "none" },
      ], motion),
      ghost.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, delay: 170, easing: "linear", fill: "both" }),
      el.form.animate([{ transform: sheet }, { transform: "none" }], motion),
      ...[$(".stage-head"), el.status].map((node) => node.animate(
        [{ opacity: 0 }, { opacity: 1 }],
        { duration: 240, delay: 220, easing: "linear", fill: "backwards" },
      )),
    ];

    await Promise.allSettled(animations.map((animation) => animation.finished));
    ghost.remove();
    el.sticker.style.removeProperty("transform-origin");
    html.classList.remove("is-animating");
  }

  /* Mode sombre */

  function bindTheme() {
    const input = $("#theme-toggle");
    const html = document.documentElement;
    const system = matchMedia("(prefers-color-scheme: dark)");
    const saved = () => {
      try { return localStorage.getItem("qr-theme"); } catch { return null; }
    };
    const apply = (dark) => {
      html.setAttribute("data-theme", dark ? "qr-dark" : "qr");
      input.checked = dark;
    };

    apply(html.getAttribute("data-theme") === "qr-dark");
    input.addEventListener("change", () => {
      const dark = input.checked;
      try { localStorage.setItem("qr-theme", dark ? "dark" : "light"); } catch { /* stockage indisponible */ }
      // Fondu entre les deux thèmes quand le navigateur le permet.
      if (document.startViewTransition && !reduceMotion()) document.startViewTransition(() => apply(dark));
      else apply(dark);
    });
    system.addEventListener("change", (event) => {
      if (!saved()) apply(event.matches);
    });
  }

  /* Démarrage */

  ["type", "dots", "corner", "cornerDot", "frame", "gradType", "ec", "printLayout"].forEach(buildChoices);
  buildTemplates();
  bindPrint();
  $$("[data-color]").forEach(buildColor);
  buildSwatches();
  buildFramePresets();
  bindFields();
  bindLogo();
  bindExport();
  bindWizard();
  bindTheme();
  bindViewport();
  bindLocate();
  showInstallHint();
  refreshBatch = bindBatch();
  $$("[data-field='wifiSec']").forEach((s) => { s.value = state.fields.wifiSec || "WPA"; });
  syncUi();
  $("#type input:checked")?.closest(".choice").scrollIntoView({ block: "nearest", inline: "center" });
  draw().finally(playEntrance);
})();
