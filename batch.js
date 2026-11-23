// Outils de la création en lot : lecture CSV et archive ZIP, sans dépendance.
window.QRBatch = (() => {
  "use strict";

  /* Lecture du fichier */

  // Excel enregistre souvent en Windows-1252 : on essaie l'UTF-8 d'abord.
  function decodeText(buffer) {
    try {
      return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
    } catch {
      return new TextDecoder("windows-1252").decode(buffer);
    }
  }

  function detectDelimiter(text) {
    const counts = { ",": 0, ";": 0, "\t": 0 };
    let quoted = false;
    for (const char of text) {
      if (char === '"') quoted = !quoted;
      else if (!quoted && (char === "\n" || char === "\r")) break;
      else if (!quoted && char in counts) counts[char] += 1;
    }
    const [best, count] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return count ? best : null;
  }

  // Renvoie les lignes non vides avec leur numéro dans le fichier.
  function parseCsv(source) {
    const text = source.replace(/^﻿/, "");
    const delimiter = detectDelimiter(text);
    const rows = [];
    let cells = [];
    let cell = "";
    let quoted = false;
    let line = 1;
    let rowLine = 1;

    const endCell = () => {
      cells.push(cell.trim());
      cell = "";
    };
    const endRow = () => {
      endCell();
      if (cells.some(Boolean)) rows.push({ line: rowLine, cells });
      cells = [];
    };

    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      if (quoted) {
        if (char === '"' && text[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else if (char === '"') {
          quoted = false;
        } else {
          if (char === "\n") line += 1;
          cell += char;
        }
      } else if (char === '"' && !cell.trim()) {
        cell = "";
        quoted = true;
      } else if (delimiter && char === delimiter) {
        endCell();
      } else if (char === "\n" || char === "\r") {
        if (char === "\r" && text[i + 1] === "\n") i += 1;
        endRow();
        line += 1;
        rowLine = line;
      } else {
        cell += char;
      }
    }
    endRow();
    return rows;
  }

  const looksLikeValue = (value) => /^[a-z][a-z0-9+.-]*:|^www\.|^[^\s@]+@[^\s@]+\.|^[\w-]+(\.[\w-]+)*\.[a-z]{2,}(\/|$)|^\+?\d[\d\s.-]{5,}$/i.test(value);

  // Une première ligne de titres ne ressemble pas à un lien, un e-mail ou un numéro.
  function guessHeader(rows) {
    if (rows.length < 2) return false;
    const first = rows[0].cells;
    if (first.some(looksLikeValue)) return false;
    return first.some((cell) => /^(url|lien|link|contenu|content|adresse|nom|name|titre|title|fichier|file|texte|text|cadre|frame|label)s?$/i.test(cell))
      || rows[1].cells.some(looksLikeValue);
  }

  function guessColumn(labels, pattern) {
    return labels.findIndex((label) => pattern.test(label));
  }

  /* Noms de fichiers */

  function safeName(value) {
    const clean = String(value)
      .normalize("NFC")
      .replace(/[\u0000-\u001f\u007f<>:"/\\|?*]+/g, "-")
      .replace(/\s+/g, " ")
      .replace(/^[\s.-]+|[\s.-]+$/g, "")
      .slice(0, 80)
      .trim();
    return /^(con|prn|aux|nul|com\d|lpt\d)$/i.test(clean) ? `qr-${clean}` : clean;
  }

  function uniqueName(base, extension, used) {
    let name = `${base}.${extension}`;
    let index = 2;
    while (used.has(name.toLowerCase())) {
      name = `${base}-${index}.${extension}`;
      index += 1;
    }
    used.add(name.toLowerCase());
    return name;
  }

  /* Archive ZIP sans compression : les images sont déjà compressées */

  const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });

  function crc32(bytes) {
    let crc = 0xffffffff;
    for (let i = 0; i < bytes.length; i += 1) crc = CRC_TABLE[(crc ^ bytes[i]) & 255] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  }

  async function zipEntry(name, blob) {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    return { name: new TextEncoder().encode(name), blob, size: bytes.length, crc: crc32(bytes) };
  }

  function zipHeader(signature, entry, offset, date, time) {
    const central = signature === 0x02014b50;
    const view = new DataView(new ArrayBuffer((central ? 46 : 30) + entry.name.length));
    let p = 0;
    const u16 = (v) => { view.setUint16(p, v, true); p += 2; };
    const u32 = (v) => { view.setUint32(p, v, true); p += 4; };
    u32(signature);
    if (central) u16(20);
    u16(20);
    u16(0x0800); // Noms en UTF-8
    u16(0);
    u16(time);
    u16(date);
    u32(entry.crc);
    u32(entry.size);
    u32(entry.size);
    u16(entry.name.length);
    u16(0);
    if (central) {
      u16(0);
      u16(0);
      u16(0);
      u32(0);
      u32(offset);
    }
    new Uint8Array(view.buffer).set(entry.name, p);
    return new Uint8Array(view.buffer);
  }

  function makeZip(entries) {
    const now = new Date();
    const date = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
    const time = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
    const parts = [];
    const directory = [];
    let offset = 0;

    entries.forEach((entry) => {
      const local = zipHeader(0x04034b50, entry, 0, date, time);
      parts.push(local, entry.blob);
      directory.push(zipHeader(0x02014b50, entry, offset, date, time));
      offset += local.length + entry.size;
    });

    const directorySize = directory.reduce((sum, header) => sum + header.length, 0);
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true);
    end.setUint16(8, entries.length, true);
    end.setUint16(10, entries.length, true);
    end.setUint32(12, directorySize, true);
    end.setUint32(16, offset, true);
    return new Blob([...parts, ...directory, new Uint8Array(end.buffer)], { type: "application/zip" });
  }

  return { decodeText, parseCsv, guessHeader, guessColumn, safeName, uniqueName, zipEntry, makeZip };
})();
