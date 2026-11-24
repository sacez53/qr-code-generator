// Impression : calcul des planches A4 et création du PDF, sans dépendance.
window.QRPrint = (() => {
  "use strict";

  const PT_PER_CM = 72 / 2.54;
  const PAGE = { w: 21, h: 29.7 };
  const MARGIN = 1;
  const GAP = 0.5;

  // Nombre d'étiquettes et position de chacune, en centimètres.
  function grid(wCm, hCm, layout) {
    if (layout !== "sheet") {
      return { cols: 1, rows: 1, cells: [{ x: (PAGE.w - wCm) / 2, y: (PAGE.h - hCm) / 2 }] };
    }
    const cols = Math.max(1, Math.floor((PAGE.w - 2 * MARGIN + GAP) / (wCm + GAP)));
    const rows = Math.max(1, Math.floor((PAGE.h - 2 * MARGIN + GAP) / (hCm + GAP)));
    const left = (PAGE.w - (cols * wCm + (cols - 1) * GAP)) / 2;
    const top = (PAGE.h - (rows * hCm + (rows - 1) * GAP)) / 2;
    const cells = [];
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) cells.push({ x: left + c * (wCm + GAP), y: top + r * (hCm + GAP) });
    }
    return { cols, rows, cells };
  }

  const n = (value) => (Math.round(value * 100) / 100).toString();

  function makePdf({ jpeg, pxW, pxH, wCm, hCm, layout, cuts }) {
    const { cells } = grid(wCm, hCm, layout);
    const pageW = PAGE.w * PT_PER_CM;
    const pageH = PAGE.h * PT_PER_CM;
    const w = wCm * PT_PER_CM;
    const h = hCm * PT_PER_CM;
    // Le PDF compte les y depuis le bas de la page.
    const boxes = cells.map((cell) => ({ x: cell.x * PT_PER_CM, y: pageH - cell.y * PT_PER_CM - h }));

    let content = boxes.map((b) => `q ${n(w)} 0 0 ${n(h)} ${n(b.x)} ${n(b.y)} cm /Im0 Do Q`).join("\n");
    if (cuts) {
      const pad = (layout === "sheet" ? GAP / 2 : 0.3) * PT_PER_CM;
      content += `\nq 0.65 G 0.4 w [3 3] 0 d\n${boxes.map((b) => `${n(b.x - pad)} ${n(b.y - pad)} ${n(w + 2 * pad)} ${n(h + 2 * pad)} re S`).join("\n")}\nQ`;
    }

    const encoder = new TextEncoder();
    const parts = [];
    const offsets = [];
    let length = 0;
    const push = (chunk) => {
      const bytes = typeof chunk === "string" ? encoder.encode(chunk) : chunk;
      parts.push(bytes);
      length += bytes.length;
    };
    const object = (id, body, stream) => {
      offsets[id] = length;
      push(`${id} 0 obj\n${body}\n`);
      if (stream) {
        push("stream\n");
        push(stream);
        push("\nendstream\n");
      }
      push("endobj\n");
    };

    const contentBytes = encoder.encode(content);
    push("%PDF-1.4\n%âãÏÓ\n");
    object(1, "<< /Type /Catalog /Pages 2 0 R >>");
    object(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
    object(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${n(pageW)} ${n(pageH)}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`);
    object(4, `<< /Type /XObject /Subtype /Image /Width ${pxW} /Height ${pxH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>`, jpeg);
    object(5, `<< /Length ${contentBytes.length} >>`, contentBytes);

    const xref = length;
    push(`xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}`);
    push(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
    return new Blob(parts, { type: "application/pdf" });
  }

  return { grid, makePdf, PAGE };
})();
