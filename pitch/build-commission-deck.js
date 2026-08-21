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
      { text: "The % is set by the close rate on scoped leads, measured quarterly. ", options: { color: MUTED } },
      { text: "Cash flow: the 2% floor is paid as each job funds; quarter-end reconciliation trues up to the earned average rate — T^Rock never prepays a rate, and nothing is ever clawed back.", options: { bold: true, color: RED } },
    ], { x: 0.6, y: 1.15, w: 11.9, h: 0.75, fontSize: 14, fontFace: "Arial", margin: 0 });

    const hdr = { bold: true, color: WHITE, fill: { color: BLACK }, fontFace: "Arial", fontSize: 13, valign: "middle", align: "center" };
    const lbl = { bold: true, color: BLACK, fontFace: "Arial", fontSize: 12, valign: "middle" };
    const c = { fontFace: "Arial", fontSize: 12.5, color: INK, valign: "middle", align: "center" };
    const r = { fontFace: "Arial", fontSize: 13, bold: true, color: RED, valign: "middle", align: "center" };
    const dim = { fontFace: "Arial", fontSize: 12, color: MUTED, valign: "middle", align: "center" };
    const tot = { fontFace: "Arial", fontSize: 13, bold: true, color: RED, valign: "middle", align: "center", fill: { color: LTRED } };
    const rows = [
      [{ text: "Per 10 scoped leads", options: hdr }, { text: "20% close (floor)", options: hdr }, { text: "40%", options: hdr }, { text: "60%", options: hdr }, { text: "80%", options: hdr }, { text: "100% (ceiling)", options: hdr }],
      [{ text: "Fee (% of RCV)", options: lbl }, { text: "2%", options: r }, { text: "4%", options: r }, { text: "6%", options: r }, { text: "8%", options: r }, { text: "10%", options: r }],
      [{ text: "Jobs closed & collected (fee paid on these only)", options: lbl }, { text: "2 of 10", options: c }, { text: "4 of 10", options: c }, { text: "6 of 10", options: c }, { text: "8 of 10", options: c }, { text: "10 of 10", options: c }],
      [{ text: "Fee per closed $30,000 job", options: lbl }, { text: "$600", options: c }, { text: "$1,200", options: c }, { text: "$1,800", options: c }, { text: "$2,400", options: c }, { text: "$3,000", options: c }],
      [{ text: "Fee on the other 8 / 6 / 4 / 2 / 0 leads", options: lbl }, { text: "$0", options: dim }, { text: "$0", options: dim }, { text: "$0", options: dim }, { text: "$0", options: dim }, { text: "$0", options: dim }],
      [{ text: "T^Rock net per closed job (after 50/50 PM split)", options: lbl }, { text: "$4,950", options: c }, { text: "$4,650", options: c }, { text: "$4,350", options: c }, { text: "$4,050", options: c }, { text: "$3,750", options: c }],
      [{ text: "T^Rock TOTAL net on the 10 leads", options: lbl }, { text: "$9,900", options: tot }, { text: "$18,600", options: tot }, { text: "$26,100", options: tot }, { text: "$32,400", options: tot }, { text: "$37,500", options: tot }],
    ];
    s.addTable(rows, {
      x: 0.6, y: 2.05, w: 12.1, colW: [3.6, 1.8, 1.6, 1.6, 1.6, 1.9],
      border: { type: "solid", color: "DDDDDD", pt: 0.75 },
      rowH: [0.4, 0.42, 0.42, 0.42, 0.42, 0.42, 0.5], margin: 0.07,
    });

    s.addShape("roundRect", { x: 0.6, y: 5.35, w: 12.1, h: 0.95, fill: { color: LTRED }, rectRadius: 0.06 });
    s.addText([
      { text: "The “expensive” end of the slider is the one where T^Rock banks $37,500 on 10 leads instead of $9,900. ", options: { bold: true, color: BLACK } },
      { text: "The 10% fee only exists when all 10 closed and funded — it can never run ahead of collected cash.", options: { color: INK } },
    ], { x: 0.95, y: 5.48, w: 11.5, h: 0.72, fontSize: 14, fontFace: "Arial", margin: 0 });
    footer(s, 3, "Total net = jobs closed (of 10) × net per closed job. Rates between tiers interpolate linearly. Close rate measured on a trailing quarter.");
  }

  // ------------------------------------------------ 4. WHERE THE SLIDER COMES FROM
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    s.addText("Where the slider comes from", {
      x: 0.6, y: 0.45, w: 12.1, h: 0.7, fontSize: 32, bold: true, color: BLACK, fontFace: "Arial", margin: 0
    });
    s.addText("Both ends are anchored to prices the industry already pays. The slider just connects them.", {
      x: 0.6, y: 1.2, w: 11.9, h: 0.4, fontSize: 15, color: MUTED, fontFace: "Arial", margin: 0
    });

    // floor anchor
    s.addShape("roundRect", { x: 0.6, y: 1.8, w: 5.9, h: 3.5, fill: { color: CARD }, rectRadius: 0.08 });
    circleIcon(s, icons.sign, 0.9, 2.1, 0.7);
    s.addText("The floor — raw leads", { x: 1.8, y: 2.25, w: 4.5, h: 0.4, fontSize: 17, bold: true, color: BLACK, fontFace: "Arial", margin: 0 });
    s.addText("2%", { x: 0.9, y: 2.95, w: 2.0, h: 0.9, fontSize: 48, bold: true, color: RED, fontFace: "Arial", margin: 0 });
    s.addText("Scoped leads where most won't close. The fee collects on the few that do — priced like professional scope work, paid only on results. At a 20% close rate, 8 of every 10 scopes were written for free.", {
      x: 0.9, y: 3.95, w: 5.3, h: 1.2, fontSize: 12.5, color: INK, fontFace: "Arial", margin: 0
    });

    // ceiling anchor
    s.addShape("roundRect", { x: 6.8, y: 1.8, w: 5.9, h: 3.5, fill: { color: BLACK }, rectRadius: 0.08 });
    circleIcon(s, icons.shake, 7.1, 2.1, 0.7);
    s.addText("The ceiling — a done deal", { x: 8.0, y: 2.25, w: 4.5, h: 0.4, fontSize: 17, bold: true, color: WHITE, fontFace: "Arial", margin: 0 });
    s.addText("10%", { x: 7.1, y: 2.95, w: 2.4, h: 0.9, fontSize: 48, bold: true, color: RED, fontFace: "Arial", margin: 0 });
    s.addText("A lead that closes 100% of the time is a signed contract changing hands. That's a referral — and 10% of contract value is the standard referral fee. Nobody blinks at 10% for a job that's already sold.", {
      x: 7.1, y: 3.95, w: 5.3, h: 1.2, fontSize: 12.5, color: "E0E0E0", fontFace: "Arial", margin: 0
    });

    s.addShape("roundRect", { x: 0.6, y: 5.6, w: 12.1, h: 1.0, fill: { color: LTRED }, rectRadius: 0.06 });
    s.addText([
      { text: "Everything between is interpolation. ", options: { bold: true, color: BLACK } },
      { text: "The quarter's actual close rate measures how pre-sold the leads really were, and the fee settles to match — on results, not promises. The slider doesn't invent a price; it connects two prices the industry already accepts.", options: { color: INK } },
    ], { x: 0.95, y: 5.72, w: 11.5, h: 0.78, fontSize: 14, fontFace: "Arial", margin: 0 });
    footer(s, 4, "Referral benchmark: ~10% of contract value is the customary fee for handed-off, ready-to-sign work in residential contracting.");
  }

  // ----------------------------------------------- 5. WHY THE SLIDER SELF-FUNDS
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    s.addText("Why the slider pays for itself", {
      x: 0.6, y: 0.45, w: 12.1, h: 0.7, fontSize: 32, bold: true, color: BLACK, fontFace: "Arial", margin: 0
    });
    s.addText("Same 100 scoped leads, five close rates. The fee % rises — the pie rises much faster.", {
      x: 0.6, y: 1.18, w: 11.9, h: 0.4, fontSize: 15, color: MUTED, fontFace: "Arial", margin: 0
    });

    // hand-drawn columns — render in every viewer, unlike native charts
    s.addText("T^Rock net profit per 100 scoped leads  (after fee & PM split)", {
      x: 0.6, y: 1.75, w: 12.1, h: 0.35, fontSize: 14, bold: true, color: BLACK, fontFace: "Arial", margin: 0
    });
    const bars = [
      { label: "20% close", val: 99000 },
      { label: "40% close", val: 186000 },
      { label: "60% close", val: 261000 },
      { label: "80% close", val: 324000 },
      { label: "100% close", val: 375000, hot: true },
    ];
    const baseY = 5.3, maxH = 2.7, colScale = maxH / 375000;
    s.addShape("rect", { x: 0.75, y: baseY, w: 11.8, h: 0.015, fill: { color: "CCCCCC" } });
    bars.forEach((b, i) => {
      const cx = 1.1 + i * 2.4;
      const h = b.val * colScale;
      s.addShape("roundRect", { x: cx, y: baseY - h, w: 1.5, h: h, fill: { color: b.hot ? RED : "B9BDC2" }, rectRadius: 0.03 });
      s.addText("$" + b.val.toLocaleString("en-US"), { x: cx - 0.35, y: baseY - h - 0.38, w: 2.2, h: 0.35, fontSize: b.hot ? 16 : 13.5, bold: true, color: b.hot ? RED : INK, fontFace: "Arial", align: "center", margin: 0 });
      s.addText(b.label, { x: cx - 0.35, y: baseY + 0.08, w: 2.2, h: 0.3, fontSize: 12, bold: !!b.hot, color: b.hot ? RED : INK, fontFace: "Arial", align: "center", margin: 0 });
    });

    s.addShape("roundRect", { x: 0.6, y: 6.05, w: 12.1, h: 0.8, fill: { color: BLACK }, rectRadius: 0.06 });
    s.addText([
      { text: "Top of the slider = T^Rock's take is up nearly 4×. ", options: { bold: true, color: WHITE } },
      { text: "The higher fee is only ever paid out of jobs that already closed — the plan cannot cost money in a bad quarter.", options: { color: "E6E6E6" } },
    ], { x: 0.95, y: 6.18, w: 11.5, h: 0.55, fontSize: 15, fontFace: "Arial", margin: 0 });
    footer(s, 5, "Per closed job: $30,000 × 35% margin, less slider fee, split 50/50 with the PM. 100 scoped leads held constant across scenarios.");
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
    footer(s, 6, "");
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
    footer(s, 7, "Estimator salary and supplement-fee ranges are industry-typical figures for the region, not quotes.");
  }

  // ------------------------------------------------------------ 7. NEXT STEPS
  {
    const s = pres.addSlide();
    s.background = { color: BLACK };
    s.addText("Next steps", { x: 0.75, y: 0.6, w: 11.8, h: 0.8, fontSize: 40, bold: true, color: WHITE, fontFace: "Arial", margin: 0 });

    const steps = [
      { icon: icons.check, n: "1", h: "Define the metrics", b: "Close-rate window (trailing quarter), what counts as a scoped lead, attribution rules, and “collected” = funds received." },
      { icon: icons.scale, n: "2", h: "Pick the base", b: "Option A (% of RCV) or Option B (% of job profit). One page, signed, with the slider table attached." },
      { icon: icons.shake, n: "3", h: "True-up quarterly, review at 6 months", b: "2% floor paid as jobs fund; quarter-end true-up to the earned average rate. Six-month check: if the numbers say adjust the curve, adjust the curve." },
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
