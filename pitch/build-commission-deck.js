// T^Rock performance pay plan — scope writing & lead operations commission structure.
// Build: node pitch/build-commission-deck.js  → pitch/Commission-Plan.pptx
const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const {
  FaFileSignature, FaMapMarkedAlt, FaSlidersH, FaHandHoldingUsd, FaChartLine,
  FaClipboardCheck, FaBalanceScale, FaUserTie, FaFileInvoiceDollar, FaCheckCircle,
  FaHandshake, FaBolt
} = require("react-icons/fa");

const RED = "C8102E";
const BLACK = "111111";
const INK = "2A2A2A";
const MUTED = "6E6E6E";
const CARD = "F5F5F5";
const WHITE = "FFFFFF";
const LTRED = "FBEAEC";

const W = 13.33, H = 7.5;

async function iconPng(Icon, hexColor) {
  const svg = ReactDOMServer.renderToStaticMarkup(
    React.createElement(Icon, { color: "#" + hexColor, size: "256" })
  );
  const buf = await sharp(Buffer.from(svg)).resize(300, 300, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

function circleIcon(slide, data, x, y, d) {
  slide.addShape("ellipse", { x, y, w: d, h: d, fill: { color: RED } });
  const pad = d * 0.26;
  slide.addImage({ data, x: x + pad, y: y + pad, w: d - 2 * pad, h: d - 2 * pad });
}

function footer(slide, n, note) {
  slide.addText(note || "", { x: 0.6, y: H - 0.42, w: 10.5, h: 0.3, fontSize: 9, color: MUTED, fontFace: "Arial", margin: 0 });
  slide.addText(String(n), { x: W - 1.0, y: H - 0.42, w: 0.5, h: 0.3, fontSize: 10, color: MUTED, fontFace: "Arial", align: "right", margin: 0 });
}

(async () => {
  const icons = {
    sign: await iconPng(FaFileSignature, WHITE),
    map: await iconPng(FaMapMarkedAlt, WHITE),
    slider: await iconPng(FaSlidersH, WHITE),
    hand: await iconPng(FaHandHoldingUsd, WHITE),
    chart: await iconPng(FaChartLine, WHITE),
    clip: await iconPng(FaClipboardCheck, WHITE),
    scale: await iconPng(FaBalanceScale, WHITE),
    tie: await iconPng(FaUserTie, WHITE),
    invoice: await iconPng(FaFileInvoiceDollar, WHITE),
    check: await iconPng(FaCheckCircle, WHITE),
    shake: await iconPng(FaHandshake, WHITE),
    bolt: await iconPng(FaBolt, WHITE),
  };

  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";

  // ---------------------------------------------------------------- 1. TITLE
  {
    const s = pres.addSlide();
    s.background = { color: BLACK };
    circleIcon(s, icons.slider, 0.75, 0.85, 0.9);
    s.addText("T^ROCK PERFORMANCE PAY PLAN", {
      x: 0.75, y: 2.35, w: 11.8, h: 1.1, fontSize: 44, bold: true, color: WHITE, fontFace: "Arial", margin: 0
    });
    s.addText("Scope writing & lead operations — paid only on jobs that close and collect", {
      x: 0.78, y: 3.5, w: 11.5, h: 0.6, fontSize: 22, color: "D9D9D9", fontFace: "Arial", margin: 0
    });
    s.addText([
      { text: "Proposed structure", options: { bold: true, color: WHITE } },
      { text: "   ·   T^Rock Contracting   ·   August 2026", options: { color: "9E9E9E" } },
    ], { x: 0.78, y: 5.9, w: 11.5, h: 0.4, fontSize: 14, fontFace: "Arial", margin: 0 });
    s.addText("Zero fixed cost. The fee exists only when a check clears.", {
      x: 0.78, y: 6.35, w: 11.5, h: 0.4, fontSize: 14, italic: true, color: RED, fontFace: "Arial", margin: 0
    });
  }

  // ---------------------------------------------------- 2. WHAT THE SEAT DOES
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    s.addText("What this seat delivers", {
      x: 0.6, y: 0.45, w: 12.1, h: 0.7, fontSize: 32, bold: true, color: BLACK, fontFace: "Arial", margin: 0
    });
    s.addText("Two functions, one fee — everything below is directly attributable to individual jobs.", {
      x: 0.6, y: 1.2, w: 11.9, h: 0.4, fontSize: 15, color: MUTED, fontFace: "Arial", margin: 0
    });

    const feats = [
      { icon: icons.sign, h: "Insurance-grade scope writing (RSOW)", b: "Full restoration scopes of work per job — line items, quantities, code items — built to survive adjuster review and maximize approved RCV." },
      { icon: icons.map, h: "Storm targeting & lead operations", b: "Runs the damage-map platform: territories, filtered knock lists, alert response. Reps knock verified-damage doors instead of guessing." },
      { icon: icons.invoice, h: "Fee booked as a job cost", b: "The fee attaches to a specific closed job, so it lands in job costing — not overhead. Margins per job stay honest and auditable." },
      { icon: icons.hand, h: "Paid on collected, not promised", b: "No base, no draw, no per-scope charge. If a job doesn't close and fund, the work was free. All of the risk sits on this side of the table." },
    ];
    feats.forEach((f, i) => {
      const x = 0.6 + (i % 2) * 6.2;
      const y = 2.0 + Math.floor(i / 2) * 2.4;
      s.addShape("roundRect", { x, y, w: 5.9, h: 2.15, fill: { color: CARD }, rectRadius: 0.08 });
      circleIcon(s, f.icon, x + 0.3, y + 0.3, 0.7);
      s.addText(f.h, { x: x + 1.2, y: y + 0.28, w: 4.5, h: 0.4, fontSize: 16, bold: true, color: BLACK, fontFace: "Arial", margin: 0 });
      s.addText(f.b, { x: x + 1.2, y: y + 0.75, w: 4.5, h: 1.3, fontSize: 12, color: INK, fontFace: "Arial", margin: 0 });
    });
    footer(s, 2, "");
  }

  // ------------------------------------------------------------- 3. THE SLIDER
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    s.addText("The slider: pay scales with what closes", {
      x: 0.6, y: 0.45, w: 12.1, h: 0.7, fontSize: 32, bold: true, color: BLACK, fontFace: "Arial", margin: 0
    });
    s.addText([
      { text: "Fee = % of RCV on scoped jobs, paid only when closed AND collected. ", options: { bold: true, color: INK } },
      { text: "The % is set by the close rate on scoped leads, measured quarterly — better conversion, better rate, for both sides.", options: { color: MUTED } },
    ], { x: 0.6, y: 1.2, w: 11.9, h: 0.55, fontSize: 14.5, fontFace: "Arial", margin: 0 });

    const hdr = { bold: true, color: WHITE, fill: { color: BLACK }, fontFace: "Arial", fontSize: 13, valign: "middle", align: "center" };
    const lbl = { bold: true, color: BLACK, fontFace: "Arial", fontSize: 12, valign: "middle" };
    const c = { fontFace: "Arial", fontSize: 12.5, color: INK, valign: "middle", align: "center" };
    const r = { fontFace: "Arial", fontSize: 13, bold: true, color: RED, valign: "middle", align: "center" };
    const rows = [
      [{ text: "", options: hdr }, { text: "20% close (floor)", options: hdr }, { text: "40%", options: hdr }, { text: "60%", options: hdr }, { text: "80%", options: hdr }, { text: "100% (ceiling)", options: hdr }],
      [{ text: "Fee (% of RCV)", options: lbl }, { text: "2%", options: r }, { text: "4%", options: r }, { text: "6%", options: r }, { text: "8%", options: r }, { text: "10%", options: r }],
      [{ text: "Fee on a $30,000 job", options: lbl }, { text: "$600", options: c }, { text: "$1,200", options: c }, { text: "$1,800", options: c }, { text: "$2,400", options: c }, { text: "$3,000", options: c }],
      [{ text: "Job profit after fee (35% margin)", options: lbl }, { text: "$9,900", options: c }, { text: "$9,300", options: c }, { text: "$8,700", options: c }, { text: "$8,100", options: c }, { text: "$7,500", options: c }],
      [{ text: "T^Rock net per job (after 50/50 PM split)", options: lbl }, { text: "$4,950", options: r }, { text: "$4,650", options: r }, { text: "$4,350", options: r }, { text: "$4,050", options: r }, { text: "$3,750", options: r }],
    ];
    s.addTable(rows, {
      x: 0.6, y: 2.0, w: 12.1, colW: [3.6, 1.8, 1.6, 1.6, 1.6, 1.9],
      border: { type: "solid", color: "DDDDDD", pt: 0.75 },
      rowH: [0.45, 0.55, 0.55, 0.55, 0.6], margin: 0.08,
    });

    s.addShape("roundRect", { x: 0.6, y: 5.4, w: 12.1, h: 0.95, fill: { color: LTRED }, rectRadius: 0.06 });
    s.addText([
      { text: "Worst case for T^Rock is still $3,750 net per closed job ", options: { bold: true, color: BLACK } },
      { text: "— and that case only exists in a quarter where every single scoped lead closed. The fee can never run ahead of collected cash.", options: { color: INK } },
    ], { x: 0.95, y: 5.55, w: 11.5, h: 0.7, fontSize: 14.5, fontFace: "Arial", margin: 0 });
    footer(s, 3, "Rates between tiers interpolate linearly. Close rate = closed & collected jobs ÷ scoped leads, trailing quarter.");
  }

  // ----------------------------------------------- 4. WHY THE SLIDER SELF-FUNDS
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    s.addText("Why the slider pays for itself", {
      x: 0.6, y: 0.45, w: 12.1, h: 0.7, fontSize: 32, bold: true, color: BLACK, fontFace: "Arial", margin: 0
    });
    s.addText("Same 100 scoped leads, five close rates. The fee % rises — the pie rises much faster.", {
      x: 0.6, y: 1.18, w: 11.9, h: 0.4, fontSize: 15, color: MUTED, fontFace: "Arial", margin: 0
    });

    s.addChart(pres.ChartType.bar, [
      {
        name: "T^Rock net profit per 100 scoped leads",
        labels: ["20% close", "40% close", "60% close", "80% close", "100% close"],
        values: [99000, 186000, 261000, 324000, 375000],
      },
    ], {
      x: 0.6, y: 1.75, w: 12.1, h: 4.1,
      barDir: "col",
      chartColors: [RED],
      showTitle: true, title: "T^Rock net profit per 100 scoped leads (after fee & PM split)", titleFontSize: 14, titleColor: BLACK, titleFontFace: "Arial",
      showValue: true, dataLabelPosition: "outEnd", dataLabelColor: BLACK, dataLabelFontSize: 12, dataLabelFontFace: "Arial", dataLabelFormatCode: "$#,##0",
      showLegend: false,
      catAxisLabelColor: INK, catAxisLabelFontSize: 12, catAxisLabelFontFace: "Arial",
      valAxisLabelColor: MUTED, valAxisLabelFontSize: 10, valAxisLabelFontFace: "Arial", valAxisLabelFormatCode: "$#,##0",
      valAxisMaxVal: 420000,
      valGridLine: { color: "E8E8E8", size: 0.5 },
      catGridLine: { style: "none" },
    });

    s.addShape("roundRect", { x: 0.6, y: 6.05, w: 12.1, h: 0.8, fill: { color: BLACK }, rectRadius: 0.06 });
    s.addText([
      { text: "Top of the slider = T^Rock's take is up nearly 4×. ", options: { bold: true, color: WHITE } },
      { text: "The higher fee is only ever paid out of jobs that already closed — the plan cannot cost money in a bad quarter.", options: { color: "E6E6E6" } },
    ], { x: 0.95, y: 6.18, w: 11.5, h: 0.55, fontSize: 15, fontFace: "Arial", margin: 0 });
    footer(s, 4, "Per closed job: $30,000 × 35% margin, less slider fee, split 50/50 with the PM. 100 scoped leads held constant across scenarios.");
  }

  // ------------------------------------------------------ 5. RCV VS PROFIT BASE
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    s.addText("Two ways to base it — pick one, put it in writing", {
      x: 0.6, y: 0.45, w: 12.1, h: 0.7, fontSize: 32, bold: true, color: BLACK, fontFace: "Arial", margin: 0
    });

    const opts = [
      {
        icon: icons.invoice, h: "Option A — % of RCV", tag: "the numbers shown so far",
        pts: [
          "Verified straight off the carrier paperwork — no accounting disputes, ever",
          "Insulated from cost overruns neither side controls",
          "Slider band: 2% → 10% of RCV",
          "At 50% close: 5% × $30,000 = $1,500 per closed job",
        ],
      },
      {
        icon: icons.scale, h: "Option B — % of job profit", tag: "equivalent dollars, different base",
        pts: [
          "Scales with margin — the fee shrinks automatically on thin jobs",
          "Requires open-book job costing both sides trust",
          "Equivalent slider band: ~6% → 28% of job gross profit",
          "At 50% close: ~14% × $10,500 = ~$1,470 per closed job",
        ],
      },
    ];
    opts.forEach((o, i) => {
      const x = 0.6 + i * 6.2;
      s.addShape("roundRect", { x, y: 1.5, w: 5.9, h: 4.35, fill: { color: CARD }, rectRadius: 0.08 });
      circleIcon(s, o.icon, x + 0.3, 1.8, 0.7);
      s.addText(o.h, { x: x + 1.2, y: 1.82, w: 4.5, h: 0.4, fontSize: 17, bold: true, color: BLACK, fontFace: "Arial", margin: 0 });
      s.addText(o.tag, { x: x + 1.2, y: 2.24, w: 4.5, h: 0.3, fontSize: 11.5, italic: true, color: RED, fontFace: "Arial", margin: 0 });
      s.addText(o.pts.map((p, j) => ({
        text: p, options: { bullet: true, breakLine: true, paraSpaceAfter: j < o.pts.length - 1 ? 8 : 0 }
      })), { x: x + 0.35, y: 2.75, w: 5.2, h: 2.9, fontSize: 12.5, color: INK, fontFace: "Arial", margin: 0 });
    });

    s.addShape("roundRect", { x: 0.6, y: 6.05, w: 12.1, h: 0.8, fill: { color: LTRED }, rectRadius: 0.06 });
    s.addText([
      { text: "Same money either way at today's margins. ", options: { bold: true, color: BLACK } },
      { text: "A is simpler to verify; B is tighter to margin. The only wrong answer is leaving the definition verbal.", options: { color: INK } },
    ], { x: 0.95, y: 6.2, w: 11.5, h: 0.5, fontSize: 14.5, fontFace: "Arial", margin: 0 });
    footer(s, 5, "");
  }

  // ------------------------------------------------------------ 6. RISK PROFILE
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    s.addText("What this costs vs. the alternatives", {
      x: 0.6, y: 0.45, w: 12.1, h: 0.7, fontSize: 32, bold: true, color: BLACK, fontFace: "Arial", margin: 0
    });
    s.addText("Every other way to buy scope writing carries fixed cost or scales with paperwork. This one scales only with collected revenue.", {
      x: 0.6, y: 1.2, w: 11.9, h: 0.4, fontSize: 15, color: MUTED, fontFace: "Arial", margin: 0
    });

    const alts = [
      { icon: icons.tie, h: "Staff estimator", big: "$70–90k/yr", b: "Salary paid whether jobs close or not. Pure fixed overhead, plus payroll burden — and someone still has to run lead targeting." },
      { icon: icons.clip, h: "Supplement service", big: "25–33%", b: "of every supplement dollar they add — cost scales with paperwork volume, not with closed jobs, and they touch nothing else." },
      { icon: icons.hand, h: "This plan", big: "$0", b: "until a job closes AND the check clears. Scope writing and lead operations in one seat, booked as a job cost on collected revenue." },
    ];
    alts.forEach((t, i) => {
      const x = 0.6 + i * 4.15;
      const hot = i === 2;
      s.addShape("roundRect", { x, y: 1.9, w: 3.85, h: 3.9, fill: { color: hot ? BLACK : CARD }, rectRadius: 0.08 });
      circleIcon(s, t.icon, x + 0.35, 2.2, 0.75);
      s.addText(t.h, { x: x + 1.25, y: 2.4, w: 2.5, h: 0.4, fontSize: 15, bold: true, color: hot ? WHITE : BLACK, fontFace: "Arial", margin: 0 });
      s.addText(t.big, { x: x + 0.35, y: 3.15, w: 3.2, h: 0.85, fontSize: 40, bold: true, color: RED, fontFace: "Arial", margin: 0 });
      s.addText(t.b, { x: x + 0.35, y: 4.1, w: 3.2, h: 1.55, fontSize: 12, color: hot ? "E0E0E0" : INK, fontFace: "Arial", margin: 0 });
    });
    footer(s, 6, "Estimator salary and supplement-fee ranges are industry-typical figures for the region, not quotes.");
  }

  // ------------------------------------------------------------ 7. NEXT STEPS
  {
    const s = pres.addSlide();
    s.background = { color: BLACK };
    s.addText("Next steps", { x: 0.75, y: 0.6, w: 11.8, h: 0.8, fontSize: 40, bold: true, color: WHITE, fontFace: "Arial", margin: 0 });

    const steps = [
      { icon: icons.check, n: "1", h: "Define the metrics", b: "Close-rate window (trailing quarter), what counts as a scoped lead, attribution rules, and “collected” = funds received." },
      { icon: icons.scale, n: "2", h: "Pick the base", b: "Option A (% of RCV) or Option B (% of job profit). One page, signed, with the slider table attached." },
      { icon: icons.shake, n: "3", h: "True-up quarterly, review at 6 months", b: "Rate recalculates each quarter from actuals. Six-month check: if the numbers say adjust the curve, adjust the curve." },
    ];
    steps.forEach((st, i) => {
      const x = 0.75 + i * 4.1;
      s.addShape("roundRect", { x, y: 1.75, w: 3.8, h: 3.4, fill: { color: "1E1E1E" }, rectRadius: 0.08 });
      circleIcon(s, st.icon, x + 0.32, 2.05, 0.7);
      s.addText(st.n, { x: x + 2.7, y: 1.95, w: 0.85, h: 0.85, fontSize: 44, bold: true, color: RED, fontFace: "Arial", align: "right", margin: 0 });
      s.addText(st.h, { x: x + 0.32, y: 3.0, w: 3.2, h: 0.7, fontSize: 17, bold: true, color: WHITE, fontFace: "Arial", margin: 0 });
      s.addText(st.b, { x: x + 0.32, y: 3.7, w: 3.2, h: 1.4, fontSize: 12.5, color: "CFCFCF", fontFace: "Arial", margin: 0 });
    });

    s.addText("Paid on collections. Priced by close rate. Free until the check clears.", {
      x: 0.75, y: 5.6, w: 11.8, h: 0.6, fontSize: 20, bold: true, color: RED, fontFace: "Arial", margin: 0
    });
    s.addText("Both sides get richer on exactly the same event: a closed, funded roof.", {
      x: 0.75, y: 6.3, w: 11.8, h: 0.5, fontSize: 14, color: "BDBDBD", fontFace: "Arial", margin: 0
    });
  }

  await pres.writeFile({ fileName: __dirname + "/Commission-Plan.pptx" });
  console.log("Wrote Commission-Plan.pptx");
})().catch(e => { console.error(e); process.exit(1); });
