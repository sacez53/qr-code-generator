(() => {
  "use strict";

  const STORAGE_KEY = "qr-generator-v1";
  const PREVIEW_SIZE = 1000;
  const MAX_LOGO_BYTES = 1024 * 1024;

  const DEFAULTS = {
    type: "url",
    fields: { url: "https://example.com", wifiSec: "WPA" },
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
  };

  const ring = (outer, inner) => `<path fill-rule="evenodd" d="${outer} ${inner}"/>`;
  const shape = (d) => `<path d="${d}"/>`;

  const OPTIONS = {
    type: [
      ["url", "Lien"], ["text", "Texte"], ["wifi", "Wi-Fi"],
      ["email", "E-mail"], ["tel", "Téléphone"], ["contact", "Contact"],
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
    gradType: [["linear", "Linéaire"], ["radial", "Radial"]],
    ec: [["L", "7 %"], ["M", "15 %"], ["Q", "25 %"], ["H", "30 %"]],
  };

  const PALETTES = [
    ["Outremer", "#1d2bc4", "#ffffff"],
    ["Encre", "#15182e", "#ffffff"],
    ["Forêt", "#0f5a3c", "#eef7ef"],
    ["Bordeaux", "#7c1230", "#fff3f2"],
    ["Prune", "#4f1a78", "#fbf3ff"],
    ["Pétrole", "#07505e", "#fff6d6"],
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
  const previewContext = el.preview.getContext("2d");

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

  async function rasterize(svgBlob, size, format) {
    const img = await loadSvg(svgBlob);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    canvas.getContext("2d").drawImage(img, 0, 0, size, size);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, `image/${format}`, 0.95));
    canvas.width = canvas.height = 0;
    if (!blob) throw new Error("export");
    return blob;
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
    return "";
  }

  /* Rendu */

  function schedule() {
    save();
    syncUi();
    clearTimeout(drawTimer);
    drawTimer = setTimeout(draw, 40);
  }

  function setReady(ready) {
    el.download.disabled = !ready;
    el.copy.disabled = !ready;
    $("#quick-download").disabled = !ready;
  }

  function showEmpty(message, isError) {
    currentData = "";
    el.preview.hidden = true;
    el.empty.hidden = false;
    el.empty.textContent = message;
    el.status.textContent = isError ? "QR code non généré." : "";
    setReady(false);
  }

  async function draw() {
    const token = ++drawToken;
    const data = buildData();
    if (!data) return showEmpty(EMPTY_MESSAGES[state.type]);

    try {
      // Dessin en pleine résolution : la réduction à l'écran reste nette.
      const svg = await renderSvg(data, PREVIEW_SIZE);
      if (token !== drawToken) return;
      const img = await loadSvg(svg);
      if (token !== drawToken) return;

      previewContext.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
      previewContext.drawImage(img, 0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
      el.preview.setAttribute("aria-label", `QR code contenant : ${data.slice(0, 120)}`);
      el.preview.hidden = false;
      el.empty.hidden = true;
      currentData = data;
      el.status.textContent = scanWarning();
      setReady(true);
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
      wrap.className = "choice";
      wrap.title = label;
      const input = document.createElement("input");
      input.type = "radio";
      input.name = key;
      input.value = value;
      const face = document.createElement("span");
      if (icon) {
        input.setAttribute("aria-label", label);
        face.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${icon}</svg><small>${label}</small>`;
        wrap.classList.add("has-icon");
      } else {
        face.textContent = label;
      }
      wrap.append(input, face);
      input.addEventListener("change", () => {
        state[key] = value;
        schedule();
      });
      return wrap;
    }));
  }

  function buildColor(row) {
    const key = row.dataset.color;
    const name = $("span", row).textContent;
    const picker = document.createElement("input");
    picker.type = "color";
    picker.setAttribute("aria-label", `${name} : sélecteur`);
    const hex = document.createElement("input");
    hex.type = "text";
    hex.maxLength = 7;
    hex.spellcheck = false;
    hex.setAttribute("aria-label", `${name} : code hexadécimal`);
    row.append(picker, hex);

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
  }

  function bindFields() {
    $$("[data-field]").forEach((input) => {
      const name = input.dataset.field;
      if (input.type === "checkbox") input.checked = Boolean(state.fields[name]);
      else input.value = state.fields[name] ?? "";
      const handler = () => {
        state.fields[name] = input.type === "checkbox" ? input.checked : input.value;
        schedule();
      };
      input.addEventListener("input", handler);
      input.addEventListener("change", handler);
    });

    $$("[data-key]").forEach((input) => {
      const key = input.dataset.key;
      input.addEventListener(input.type === "range" ? "input" : "change", () => {
        if (input.type === "checkbox") {
          state[key] = input.checked;
          if (key === "linked" && !input.checked) {
            state.cornerColor = state.fg;
            state.cornerDotColor = state.fg;
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

  function buildSwatches() {
    $("#swatches").replaceChildren(...PALETTES.map(([name, fg, bg]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "swatch";
      button.title = name;
      button.setAttribute("aria-label", `Palette ${name}`);
      button.style.background = `linear-gradient(135deg, ${fg} 50%, ${bg} 50%)`;
      button.addEventListener("click", () => {
        Object.assign(state, { fg, bg, cornerColor: fg, cornerDotColor: fg, transparent: false, gradient: false });
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
    const pixels = Number(size);
    const svg = await renderSvg(currentData, pixels, format === "jpeg");
    return format === "svg" ? svg : rasterize(svg, pixels, format);
  }

  function flash(message) {
    el.status.textContent = message;
    setTimeout(() => {
      if (el.status.textContent === message) el.status.textContent = currentData ? scanWarning() : "";
    }, 2500);
  }

  function bindExport() {
    el.download.addEventListener("click", async () => {
      if (!currentData) return;
      el.download.disabled = true;
      try {
        const blob = await exportBlob(state.format, state.size);
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `qrcode.${state.format === "jpeg" ? "jpg" : state.format}`;
        document.body.append(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        flash("QR code téléchargé.");
      } catch {
        flash("Téléchargement impossible. Essayez un autre format.");
      } finally {
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
          flash("Copie refusée par le navigateur. Utilisez le téléchargement.");
        }
      });
    }

    $("#reset").addEventListener("click", () => {
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

  /* Mobile : onglets et clavier virtuel */

  const COMPACT_QUERY = "(max-width: 860px), (max-height: 560px) and (max-width: 1000px)";

  function bindTabs() {
    $$("[data-tab-button]").forEach((button) => {
      button.addEventListener("click", () => {
        const id = button.dataset.tabButton;
        $$("[data-tab]").forEach((n) => n.classList.toggle("is-active", n.dataset.tab === id));
        $$("[data-tab-button]").forEach((b) => {
          if (b === button) b.setAttribute("aria-current", "true");
          else b.removeAttribute("aria-current");
        });
        el.form.scrollTop = 0;
      });
    });
    $("#quick-download").addEventListener("click", () => el.download.click());
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

  /* Démarrage */

  ["type", "dots", "corner", "cornerDot", "gradType", "ec"].forEach(buildChoices);
  $$("[data-color]").forEach(buildColor);
  buildSwatches();
  bindFields();
  bindLogo();
  bindExport();
  bindTabs();
  bindViewport();
  $$("[data-field='wifiSec']").forEach((s) => { s.value = state.fields.wifiSec || "WPA"; });
  syncUi();
  draw();
})();
