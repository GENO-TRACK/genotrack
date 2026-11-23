// src/pages/admin/reportPdf.js
//
// Builds the GenoTrack genetic report as a designed, print-ready page and
// opens it in a new window. The browser's print dialog saves it as a PDF
// ("Save as PDF"). No PDF library is needed, and Arabic (right-to-left)
// is shaped correctly by the browser itself.
//
// Design: GenoTrack identity - black canvas, teal accents, glass cards,
// the secondary logo at the top, the security footer at the bottom.

const TEAL = "#2dd4bf";
const AMBER = "#fbbf24";
const RED = "#f87171";
const BLUE = "#60a5fa";

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toneColor(level) {
  if (level === "high") return RED;
  if (level === "medium") return AMBER;
  return TEAL;
}

// data = {
//   isAr, logoUrl,
//   labels: { ...already translated strings },
//   report: { id, generated, score, level, levelText },
//   child: [{ k, v }],            // label / value pairs
//   parents: [{ role, name, finding, findingTone, match, matchLabel }],
//   risks: [{ name, value, level }],
//   adminRisk: "text",
//   variant: { title, gene, text },
//   flag: { title, gene, text },
//   recs: [{ title, text }],
//   security: [{ k, v }],
//   copyright
// }
export function openReportPdf(data) {
  const { isAr, labels: L } = data;
  const dir = isAr ? "rtl" : "ltr";
  const lang = isAr ? "ar" : "en";

  // Gauge: circle of r = 52
  const C = 2 * Math.PI * 52;
  const dash = (data.report.score / 10) * C;
  const gaugeColor = toneColor(data.report.level);

  const childRows = data.child
    .map(
      (r) =>
        `<div class="fact"><span>${esc(r.k)}</span><b dir="auto">${esc(r.v)}</b></div>`,
    )
    .join("");

  const parents = data.parents
    .map(
      (p) => `
      <div class="parent">
        <div class="parent-main">
          <small>${esc(p.role)}</small>
          <b dir="auto">${esc(p.name)}</b>
          <em class="${esc(p.findingTone)}">${esc(p.finding)}</em>
        </div>
        <div class="parent-match" dir="ltr">
          <strong>${esc(p.match)}%</strong>
          <span>${esc(p.matchLabel)}</span>
        </div>
      </div>`,
    )
    .join("");

  const risks = data.risks
    .map(
      (r) => `
      <li style="border-color:${toneColor(r.level)}55">
        <b>${esc(r.name)}</b>
        <span style="color:${toneColor(r.level)}">${esc(r.value)}</span>
      </li>`,
    )
    .join("");

  const recs = data.recs
    .map(
      (r, i) => `
      <div class="rec">
        <i>${i + 1}</i>
        <div>
          <h4>${esc(r.title)}</h4>
          <p>${esc(r.text)}</p>
        </div>
      </div>`,
    )
    .join("");

  const security = data.security
    .map(
      (s) =>
        `<div><span>${esc(s.k)}</span><b dir="ltr">${esc(s.v)}</b></div>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
<meta charset="utf-8" />
<title>${esc(data.report.id)} - GenoTrack</title>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    background: #05090b;
    color: #e6edf1;
    font-family: "Segoe UI", Tahoma, "Noto Naskh Arabic", "Noto Sans Arabic", Arial, sans-serif;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page {
    position: relative;
    width: 210mm;
    min-height: 297mm;
    margin: 0 auto;
    padding: 14mm 14mm 12mm;
    background:
      radial-gradient(520px 320px at 100% 0%, rgba(45,212,191,0.16), transparent 70%),
      radial-gradient(420px 300px at 0% 100%, rgba(20,184,166,0.10), transparent 70%),
      #05090b;
    page-break-after: always;
    overflow: hidden;
  }
  .page:last-child { page-break-after: auto; }
  .helix {
    position: absolute; inset-inline-end: -30mm; top: 40mm;
    width: 90mm; height: 160mm; opacity: 0.07; pointer-events: none;
  }

  /* ---- Header ---- */
  .top {
    display: flex; align-items: center; justify-content: space-between;
    gap: 12mm; padding-bottom: 6mm;
    border-bottom: 1px solid rgba(45,212,191,0.35);
  }
  .brand { display: flex; align-items: center; gap: 4mm; }
  .brand img { height: 12mm; width: auto; display: block; }
  .brand-text { font-weight: 800; letter-spacing: 3px; font-size: 15px; color: #fff; }
  .brand-text span { color: ${TEAL}; }
  .valid {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 5px 12px; border-radius: 999px;
    background: rgba(45,212,191,0.14); color: ${TEAL};
    font-size: 10.5px; font-weight: 800; letter-spacing: ${isAr ? "0" : "1px"};
    text-transform: uppercase;
  }
  .valid i { width: 7px; height: 7px; border-radius: 50%; background: ${TEAL}; box-shadow: 0 0 8px ${TEAL}; }

  .title { margin: 7mm 0 6mm; }
  .title h1 { margin: 0 0 2mm; font-size: 26px; font-weight: 800; color: #fff; }
  .title h1 span { color: ${TEAL}; font-family: ui-monospace, Consolas, monospace; }
  .title p { margin: 0; color: #a3adb5; font-size: 12px; line-height: 1.6; }
  .meta { margin-top: 3mm; display: flex; gap: 8mm; color: #6b7780; font-size: 10.5px; }
  .meta b { color: #cfd8dd; font-weight: 600; }

  /* ---- Cards ---- */
  .card {
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 14px;
    background: linear-gradient(135deg, rgba(255,255,255,0.055), rgba(255,255,255,0.018));
    padding: 5mm 5.5mm;
    break-inside: avoid;
  }
  .card h3 { margin: 0 0 3.5mm; font-size: 13.5px; font-weight: 800; color: #fff; display: flex; align-items: center; gap: 8px; }
  .card h3::before {
    content: ""; width: 4px; height: 15px; border-radius: 3px; background: ${TEAL};
    box-shadow: 0 0 10px rgba(45,212,191,0.6);
  }
  .grid2 { display: grid; grid-template-columns: 1fr 1.15fr; gap: 5mm; margin-bottom: 5mm; }

  .facts { display: grid; grid-template-columns: 1fr 1fr; gap: 3.2mm 5mm; }
  .fact { display: grid; gap: 1px; min-width: 0; }
  .fact span { color: #6b7780; font-size: 9.5px; font-weight: 700; letter-spacing: ${isAr ? "0" : "1px"}; text-transform: uppercase; }
  .fact b { color: #fff; font-size: 12px; font-weight: 700; overflow-wrap: anywhere; }

  .parent {
    display: flex; align-items: center; justify-content: space-between; gap: 4mm;
    padding: 3.2mm 3.5mm; margin-bottom: 3mm;
    border: 1px solid rgba(255,255,255,0.08); border-radius: 11px;
    background: rgba(255,255,255,0.03);
  }
  .parent:last-child { margin-bottom: 0; }
  .parent-main { display: grid; gap: 1.5px; min-width: 0; }
  .parent small { color: #6b7780; font-size: 9.5px; font-weight: 700; letter-spacing: ${isAr ? "0" : "1px"}; text-transform: uppercase; }
  .parent b { color: #fff; font-size: 12.5px; }
  .parent em { font-style: normal; font-size: 10.5px; font-weight: 700; }
  .parent em.clear { color: ${TEAL}; }
  .parent em.carrier { color: ${AMBER}; }
  .parent-match { text-align: center; }
  .parent-match strong { display: block; color: ${TEAL}; font-size: 18px; font-weight: 800; }
  .parent-match span { color: #6b7780; font-size: 9px; }

  /* ---- Risk summary ---- */
  .risk { margin-bottom: 5mm; }
  .risk-body { display: grid; grid-template-columns: 42mm 1fr; gap: 7mm; align-items: center; }
  .gauge { position: relative; width: 38mm; height: 38mm; margin: 0 auto; }
  .gauge svg { width: 100%; height: 100%; }
  .g-bg, .g-fg { fill: none; stroke-width: 9; }
  .g-bg { stroke: rgba(255,255,255,0.09); }
  .g-fg { stroke: ${gaugeColor}; stroke-linecap: round; }
  .gauge strong {
    position: absolute; inset: 0; display: grid; place-items: center;
    color: #fff; font-size: 26px; font-weight: 800; direction: ltr;
  }
  .gauge strong small { font-size: 12px; color: ${gaugeColor}; }
  .level {
    display: block; width: fit-content; margin: 2.5mm auto 0; padding: 4px 12px;
    border-radius: 999px; font-size: 10.5px; font-weight: 800;
    background: ${gaugeColor}26; color: ${gaugeColor};
  }
  .risk-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 2.5mm; }
  .risk-list li {
    display: flex; justify-content: space-between; gap: 4mm; align-items: center;
    padding: 3mm 3.5mm; border: 1px solid; border-radius: 10px;
    background: rgba(255,255,255,0.03); font-size: 12px;
  }
  .risk-list li b { color: #fff; }
  .risk-list li span { font-weight: 800; }
  .admin-risk {
    margin: 4mm 0 0; padding-top: 3.5mm; border-top: 1px solid rgba(255,255,255,0.09);
    color: #a3adb5; font-size: 10.5px; line-height: 1.6;
  }

  /* ---- Variant / flag ---- */
  .flags { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; margin-bottom: 5mm; }
  .flag small { display: block; color: #6b7780; font-size: 9.5px; font-weight: 700; letter-spacing: ${isAr ? "0" : "1px"}; text-transform: uppercase; }
  .flag h4 { margin: 1mm 0 2.5mm; color: ${TEAL}; font-size: 14px; font-family: ui-monospace, Consolas, monospace; direction: ltr; text-align: start; }
  .flag.warn h4 { color: ${AMBER}; }
  .flag p { margin: 0; color: #a3adb5; font-size: 11px; line-height: 1.65; }
  .flag.warn { border-color: rgba(251,191,36,0.4); }

  /* ---- Recommendations ---- */
  .recs-head { margin: 0 0 3.5mm; }
  .recs-head h2 { margin: 0; font-size: 16px; font-weight: 800; color: #fff; }
  .recs-head p { margin: 1mm 0 0; color: #a3adb5; font-size: 11px; }
  .rec {
    display: flex; gap: 4mm; align-items: flex-start;
    padding: 3.5mm 4mm; margin-bottom: 3mm;
    border: 1px solid rgba(45,212,191,0.28); border-radius: 12px;
    background: linear-gradient(135deg, rgba(20,184,166,0.12), rgba(20,184,166,0.02));
    break-inside: avoid;
  }
  .rec > i {
    flex-shrink: 0; width: 8mm; height: 8mm; border-radius: 50%;
    display: grid; place-items: center; font-style: normal; font-weight: 800; font-size: 12px;
    background: ${TEAL}; color: #04201c;
  }
  .rec h4 { margin: 0 0 1mm; color: #fff; font-size: 12.5px; }
  .rec p { margin: 0; color: #a3adb5; font-size: 11px; line-height: 1.6; }

  /* ---- Footer ---- */
  .foot {
    margin-top: 6mm; padding-top: 4mm; border-top: 1px solid rgba(45,212,191,0.35);
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 4mm;
  }
  .foot div span { display: block; color: #6b7780; font-size: 9px; font-weight: 700; letter-spacing: ${isAr ? "0" : "1px"}; text-transform: uppercase; }
  .foot div b { color: ${TEAL}; font-size: 12px; font-family: ui-monospace, Consolas, monospace; }
  .copy { grid-column: 1 / -1; margin: 1mm 0 0; color: #6b7780; font-size: 9.5px; letter-spacing: ${isAr ? "0" : "0.6px"}; }

  .bar { position: sticky; top: 0; z-index: 9; display: flex; gap: 10px; justify-content: center; padding: 10px; background: #0b1114; border-bottom: 1px solid rgba(45,212,191,0.35); }
  .bar button { height: 38px; padding: 0 20px; border: 0; border-radius: 999px; background: ${TEAL}; color: #04201c; font: inherit; font-weight: 800; cursor: pointer; }
  .bar button.ghost { background: transparent; border: 1px solid rgba(255,255,255,0.25); color: #e6edf1; }
  @media print { .bar { display: none; } body { background: #05090b; } .page { margin: 0; } }
</style>
</head>
<body>
  <div class="bar">
    <button type="button" onclick="window.print()">${esc(L.save)}</button>
    <button type="button" class="ghost" onclick="window.close()">${esc(L.close)}</button>
  </div>

  <div class="page">
    <svg class="helix" viewBox="0 0 90 160" fill="none" stroke="${TEAL}" stroke-width="1.4" aria-hidden="true">
      <path d="M20 0c0 40 50 40 50 80s-50 40-50 80M70 0c0 40-50 40-50 80s50 40 50 80"/>
      <path d="M26 20h38M22 50h46M24 110h42M26 140h38" />
    </svg>

    <header class="top">
      <div class="brand">
        <img src="${esc(data.logoUrl)}" alt="GenoTrack" onerror="this.style.display='none'; this.nextElementSibling.style.display='block'" />
        <div class="brand-text" style="display:none">GENO<span>TRACK</span></div>
      </div>
      <span class="valid"><i></i> ${esc(L.validated)}</span>
    </header>

    <section class="title">
      <h1>${esc(L.title)} <span dir="ltr">${esc(data.report.id)}</span></h1>
      <p>${esc(L.subtitle)}</p>
      <div class="meta">
        <span>${esc(L.generated)}: <b>${esc(data.report.generated)}</b></span>
      </div>
    </section>

    <section class="grid2">
      <article class="card">
        <h3>${esc(L.childProfile)}</h3>
        <div class="facts">${childRows}</div>
      </article>
      <article class="card">
        <h3>${esc(L.parental)}</h3>
        ${parents}
      </article>
    </section>

    <section class="card risk">
      <h3>${esc(L.riskSummary)}</h3>
      <div class="risk-body">
        <div>
          <div class="gauge">
            <svg viewBox="0 0 120 120" aria-hidden="true">
              <circle cx="60" cy="60" r="52" class="g-bg" />
              <circle cx="60" cy="60" r="52" class="g-fg"
                stroke-dasharray="${dash.toFixed(2)} ${C.toFixed(2)}"
                transform="rotate(-90 60 60)" />
            </svg>
            <strong>${esc(data.report.score)}<small>/10</small></strong>
          </div>
          <span class="level">${esc(data.report.levelText)}</span>
        </div>
        <ul class="risk-list">${risks}</ul>
      </div>
      <p class="admin-risk">${esc(data.adminRisk)}</p>
    </section>

    <section class="flags">
      <article class="card flag">
        <small>${esc(data.variant.title)}</small>
        <h4>${esc(data.variant.gene)}</h4>
        <p>${esc(data.variant.text)}</p>
      </article>
      <article class="card flag warn">
        <small>${esc(data.flag.title)}</small>
        <h4>${esc(data.flag.gene)}</h4>
        <p>${esc(data.flag.text)}</p>
      </article>
    </section>

    <section>
      <div class="recs-head">
        <h2>${esc(L.recs)}</h2>
        <p>${esc(L.recsSub)}</p>
      </div>
      ${recs}
    </section>

    <footer class="foot">
      ${security}
      <p class="copy">${esc(data.copyright)}</p>
    </footer>
  </div>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) return false; // pop-up blocked
  win.document.open();
  win.document.write(html);
  win.document.close();
  // Give the logo a moment to load, then open the print dialog.
  win.onload = () => {
    setTimeout(() => {
      try {
        win.focus();
        win.print();
      } catch {
        /* the toolbar button still works */
      }
    }, 400);
  };
  return true;
}
