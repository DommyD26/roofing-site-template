// Storm Scout pitch deck for T-Rock — audience: Aaron & Alan (numbers-first).
// Build: node pitch/build-deck.js  → pitch/Storm-Scout-Pitch.pptx
const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const {
  FaMapMarkedAlt, FaFilter, FaBell, FaPaperPlane, FaBolt, FaDoorOpen,
  FaDollarSign, FaChartLine, FaClipboardCheck, FaExclamationTriangle,
  FaCheckCircle, FaCrosshairs, FaStopwatch, FaUsers, FaHandshake, FaSearchDollar
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

// red circle + white icon motif
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
    map: await iconPng(FaMapMarkedAlt, WHITE),
    filter: await iconPng(FaFilter, WHITE),
    bell: await iconPng(FaBell, WHITE),
    send: await iconPng(FaPaperPlane, WHITE),
    bolt: await iconPng(FaBolt, WHITE),
    door: await iconPng(FaDoorOpen, WHITE),
    dollar: await iconPng(FaDollarSign, WHITE),
    chart: await iconPng(FaChartLine, WHITE),
    clip: await iconPng(FaClipboardCheck, WHITE),
    warn: await iconPng(FaExclamationTriangle, WHITE),
    check: await iconPng(FaCheckCircle, WHITE),
    cross: await iconPng(FaCrosshairs, WHITE),
    watch: await iconPng(FaStopwatch, WHITE),
    users: await iconPng(FaUsers, WHITE),
    hand: await iconPng(FaHandshake, WHITE),
    searchDollar: await iconPng(FaSearchDollar, WHITE),
    boltRed: await iconPng(FaBolt, RED),
  };

  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";

  // ---------------------------------------------------------------- 1. TITLE
  {
    const s = pres.addSlide();
    s.background = { color: BLACK };
    circleIcon(s, icons.bolt, 0.75, 0.85, 0.9);
    s.addText("STORM SCOUT  ×  T-ROCK", {
      x: 0.75, y: 2.35, w: 11.8, h: 1.1, fontSize: 54, bold: true, color: WHITE, fontFace: "Arial", margin: 0
    });
    s.addText("The numbers case for data-driven storm leads", {
      x: 0.78, y: 3.5, w: 11.5, h: 0.6, fontSize: 24, color: "D9D9D9", fontFace: "Arial", margin: 0
    });
    s.addText([
      { text: "Prepared for Aaron & Alan", options: { bold: true, color: WHITE } },
      { text: "   ·   August 2026   ·   Source material: stormscout.ai", options: { color: "9E9E9E" } },
    ], { x: 0.78, y: 5.9, w: 11.5, h: 0.4, fontSize: 14, fontFace: "Arial", margin: 0 });
    s.addText("No fluff. Website facts, break-even math, and a 90-day test with kill criteria.", {
      x: 0.78, y: 6.35, w: 11.5, h: 0.4, fontSize: 14, italic: true, color: RED, fontFace: "Arial", margin: 0
    });
  }

  // ------------------------------------------------- 2. THE PROBLEM IN NUMBERS
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    s.addText("The problem: our real lead cost is rep-hours", {
      x: 0.6, y: 0.45, w: 12.1, h: 0.7, fontSize: 32, bold: true, color: BLACK, fontFace: "Arial", margin: 0
    });
    s.addText("Storm work is a race. Whoever gets a rep to a damaged, insured, owner-occupied roof first usually signs it.", {
      x: 0.6, y: 1.2, w: 11.8, h: 0.4, fontSize: 15, color: MUTED, fontFace: "Arial", margin: 0
    });

    const tiles = [
      { icon: icons.door, big: "~100", label: "doors a canvasser can knock per day — without a damage map, most are outside the real hail path", tag: "wasted knocks" },
      { icon: icons.dollar, big: "$150–300", label: "typical price per shared roofing lead from lead sellers — often resold to 3–5 competing contractors", tag: "shared-lead trap" },
      { icon: icons.watch, big: "Days", label: "how long a storm market stays open before contingencies are signed — late arrival = leftover doors", tag: "speed premium" },
    ];
    tiles.forEach((t, i) => {
      const x = 0.6 + i * 4.15;
      s.addShape("roundRect", { x, y: 1.9, w: 3.85, h: 3.9, fill: { color: CARD }, rectRadius: 0.08 });
      circleIcon(s, t.icon, x + 0.35, 2.25, 0.75);
      s.addText(t.big, { x: x + 0.35, y: 3.15, w: 3.2, h: 0.95, fontSize: 48, bold: true, color: RED, fontFace: "Arial", margin: 0 });
      s.addText(t.label, { x: x + 0.35, y: 4.15, w: 3.2, h: 1.5, fontSize: 13, color: INK, fontFace: "Arial", margin: 0 });
    });

    s.addShape("roundRect", { x: 0.6, y: 6.1, w: 12.1, h: 0.75, fill: { color: BLACK }, rectRadius: 0.06 });
    s.addText([
      { text: "The real metric:  ", options: { bold: true, color: WHITE } },
      { text: "rep-hours per signed contract. Every knock on an undamaged roof is payroll spent producing $0.", options: { color: "E6E6E6" } },
    ], { x: 0.95, y: 6.22, w: 11.5, h: 0.5, fontSize: 15, fontFace: "Arial", margin: 0 });
    footer(s, 2, "Lead-price and canvassing figures are industry benchmarks, not Storm Scout claims.");
  }

  // ------------------------------------------------------ 3. WHAT STORM SCOUT IS
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    s.addText("What Storm Scout actually is", {
      x: 0.6, y: 0.45, w: 12.1, h: 0.7, fontSize: 32, bold: true, color: BLACK, fontFace: "Arial", margin: 0
    });
    s.addText("An app that maps verified storm damage and attaches property + owner data, so crews knock the right doors first. Everything below is from stormscout.ai.", {
      x: 0.6, y: 1.2, w: 11.9, h: 0.55, fontSize: 15, color: MUTED, fontFace: "Arial", margin: 0
    });

    const feats = [
      { icon: icons.map, h: "Interactive hail & wind maps", b: "Live storm-impact maps showing where verified damage occurred — dispatch teams to affected blocks, not whole ZIP codes." },
      { icon: icons.filter, h: "Advanced property filters", b: "Filter by storm date, hail size, roof age, shingle type, square footage, median income, owner-occupied vs. rental." },
      { icon: icons.bell, h: "Custom storm alerts", b: "Watch our territories and ZIP codes; the moment a storm hits, we know — before competitors are even aware." },
      { icon: icons.send, h: "Automated outreach + in-app leads", b: "Push filtered target lists straight into calls, texts, and emails; pre-qualified leads delivered inside our service area." },
    ];
    feats.forEach((f, i) => {
      const x = 0.6 + (i % 2) * 6.2;
      const y = 2.0 + Math.floor(i / 2) * 2.4;
      s.addShape("roundRect", { x, y, w: 5.9, h: 2.15, fill: { color: CARD }, rectRadius: 0.08 });
      circleIcon(s, f.icon, x + 0.3, y + 0.3, 0.7);
      s.addText(f.h, { x: x + 1.2, y: y + 0.28, w: 4.5, h: 0.4, fontSize: 17, bold: true, color: BLACK, fontFace: "Arial", margin: 0 });
      s.addText(f.b, { x: x + 1.2, y: y + 0.75, w: 4.5, h: 1.3, fontSize: 12.5, color: INK, fontFace: "Arial", margin: 0 });
    });
    footer(s, 3, "Feature descriptions paraphrased from stormscout.ai (Home + How It Works pages).");
  }

  // ------------------------------------------------------------- 4. HOW IT WORKS
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    s.addText("How it works: storm to signed contingency in 4 steps", {
      x: 0.6, y: 0.45, w: 12.1, h: 0.7, fontSize: 32, bold: true, color: BLACK, fontFace: "Arial", margin: 0
    });

    const steps = [
      { icon: icons.bell, n: "1", h: "Storm hits — alert fires", b: "Our saved territories trigger an instant alert. We're moving while others are checking the weather news." },
      { icon: icons.map, n: "2", h: "Open the damage map", b: "Verified hail & wind impact, street by street. We see which blocks actually took damage." },
      { icon: icons.cross, n: "3", h: "Filter to our buyer", b: "Owner-occupied, roof age, shingle type, hail size, income band — down to a knock list that matches our ideal job." },
      { icon: icons.send, n: "4", h: "Dispatch + outreach", b: "Reps get routed lists; automated calls, texts, and emails warm the same doors in parallel." },
    ];
    steps.forEach((st, i) => {
      const x = 0.6 + i * 3.22;
      s.addShape("roundRect", { x, y: 1.7, w: 2.92, h: 4.1, fill: { color: i === 3 ? BLACK : CARD }, rectRadius: 0.08 });
      circleIcon(s, st.icon, x + 0.3, 2.0, 0.7);
      s.addText(st.n, { x: x + 1.9, y: 1.95, w: 0.8, h: 0.8, fontSize: 40, bold: true, color: i === 3 ? RED : "D0D0D0", fontFace: "Arial", align: "right", margin: 0 });
      s.addText(st.h, { x: x + 0.3, y: 2.95, w: 2.35, h: 0.75, fontSize: 15.5, bold: true, color: i === 3 ? WHITE : BLACK, fontFace: "Arial", margin: 0 });
      s.addText(st.b, { x: x + 0.3, y: 3.7, w: 2.35, h: 1.9, fontSize: 12, color: i === 3 ? "E0E0E0" : INK, fontFace: "Arial", margin: 0 });
      if (i < 3) {
        s.addText("→", { x: x + 2.86, y: 3.35, w: 0.45, h: 0.5, fontSize: 24, bold: true, color: RED, fontFace: "Arial", align: "center", margin: 0 });
      }
    });

    s.addText([
      { text: "Net effect: ", options: { bold: true, color: BLACK } },
      { text: "the same crew, the same day, working only the doors with verified damage and the right owner profile.", options: { color: MUTED } },
    ], { x: 0.6, y: 6.15, w: 12.1, h: 0.45, fontSize: 15, fontFace: "Arial", margin: 0 });
    footer(s, 4, "Workflow per stormscout.ai How It Works.");
  }

  // -------------------------------------------- 5. FEATURE → P&L LEVER
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    s.addText("Why this is a numbers play, not a gadget", {
      x: 0.6, y: 0.45, w: 12.1, h: 0.7, fontSize: 32, bold: true, color: BLACK, fontFace: "Arial", margin: 0
    });
    s.addText("Each feature maps to one measurable line we already track (or should).", {
      x: 0.6, y: 1.18, w: 11.9, h: 0.4, fontSize: 15, color: MUTED, fontFace: "Arial", margin: 0
    });

    const hdrOpts = { bold: true, color: WHITE, fill: { color: BLACK }, fontFace: "Arial", fontSize: 14, valign: "middle" };
    const cell = { fontFace: "Arial", fontSize: 12.5, color: INK, valign: "middle" };
    const lever = { fontFace: "Arial", fontSize: 12.5, color: RED, bold: true, valign: "middle" };
    const rows = [
      [{ text: "Feature", options: hdrOpts }, { text: "What changes on the ground", options: hdrOpts }, { text: "Metric it moves", options: hdrOpts }],
      [{ text: "Verified damage maps", options: cell }, { text: "Reps stop knocking undamaged streets", options: cell }, { text: "Rep-hours per signed contract ↓", options: lever }],
      [{ text: "Owner/roof/income filters", options: cell }, { text: "Knock list pre-matched to our ideal job profile", options: cell }, { text: "Inspection → contract rate ↑", options: lever }],
      [{ text: "Instant storm alerts", options: cell }, { text: "First trucks in the neighborhood, not third", options: cell }, { text: "Win rate on storm jobs ↑", options: lever }],
      [{ text: "Automated calls / texts / emails", options: cell }, { text: "Follow-up runs with zero extra rep payroll", options: cell }, { text: "Cost per touch ↓", options: lever }],
      [{ text: "In-app pre-qualified leads", options: cell }, { text: "Inbound work in our service area, exclusive to us", options: cell }, { text: "Cost per sold job vs. shared leads ↓", options: lever }],
    ];
    s.addTable(rows, {
      x: 0.6, y: 1.75, w: 12.1, colW: [3.3, 5.2, 3.6],
      border: { type: "solid", color: "DDDDDD", pt: 0.75 },
      rowH: 0.62, margin: 0.09,
    });

    s.addShape("roundRect", { x: 0.6, y: 6.05, w: 12.1, h: 0.8, fill: { color: LTRED }, rectRadius: 0.06 });
    s.addText([
      { text: "Every one of these is already a number in our world. ", options: { bold: true, color: BLACK } },
      { text: "That means the tool can be proven — or disproven — with our own data in one quarter.", options: { color: INK } },
    ], { x: 0.95, y: 6.2, w: 11.5, h: 0.5, fontSize: 15, fontFace: "Arial", margin: 0 });
    footer(s, 5, "");
  }

  // ------------------------------------------------------------ 6. PRICE LIST
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    s.addText("The actual price list", {
      x: 0.6, y: 0.4, w: 12.1, h: 0.6, fontSize: 32, bold: true, color: BLACK, fontFace: "Arial", margin: 0
    });
    s.addText("Published on stormscout.ai/pricing — no quote games. Founding Member is the play.", {
      x: 0.6, y: 1.02, w: 11.9, h: 0.35, fontSize: 15, color: MUTED, fontFace: "Arial", margin: 0
    });

    const hdr = { bold: true, color: WHITE, fill: { color: BLACK }, fontFace: "Arial", fontSize: 12.5, valign: "middle", align: "center" };
    const hdrHot = { bold: true, color: WHITE, fill: { color: RED }, fontFace: "Arial", fontSize: 12.5, valign: "middle", align: "center" };
    const lbl = { bold: true, color: BLACK, fontFace: "Arial", fontSize: 11, valign: "middle" };
    const c = { fontFace: "Arial", fontSize: 10.5, color: INK, valign: "middle", align: "center" };
    const cHot = { fontFace: "Arial", fontSize: 10.5, color: INK, valign: "middle", align: "center", fill: { color: LTRED } };
    const price = { fontFace: "Arial", fontSize: 13, bold: true, color: RED, valign: "middle", align: "center" };
    const priceHot = { fontFace: "Arial", fontSize: 13, bold: true, color: RED, valign: "middle", align: "center", fill: { color: LTRED } };
    const rows = [
      [{ text: "", options: hdr }, { text: "Bronze", options: hdr }, { text: "Silver", options: hdr }, { text: "Gold", options: hdr }, { text: "Platinum", options: hdr }, { text: "Founding*  (our pick)", options: hdrHot }],
      [{ text: "Price / month", options: lbl }, { text: "$100", options: price }, { text: "$500", options: price }, { text: "$1,000", options: price }, { text: "$2,500", options: price }, { text: "$2,000*", options: priceHot }],
      [{ text: "Storm maps", options: lbl }, { text: "1 / month", options: c }, { text: "5 / month", options: c }, { text: "Unlimited", options: c }, { text: "Unlimited", options: c }, { text: "Unlimited", options: cHot }],
      [{ text: "Filters", options: lbl }, { text: "Basic (ZIP, storm date)", options: c }, { text: "Advanced (hail size, roof age…)", options: c }, { text: "Advanced, unlimited searches", options: c }, { text: "Custom alerts + territory tracking", options: c }, { text: "Same as Platinum", options: cHot }],
      [{ text: "Homeowner leads", options: lbl }, { text: "Up to 25", options: c }, { text: "Up to 150", options: c }, { text: "Up to 500", options: c }, { text: "Unlimited", options: c }, { text: "Unlimited", options: cHot }],
      [{ text: "Automated outreach", options: lbl }, { text: "—", options: c }, { text: "—", options: c }, { text: "SMS, email, calls", options: c }, { text: "SMS, email, calls", options: c }, { text: "SMS, email, calls", options: cHot }],
      [{ text: "Also includes", options: lbl }, { text: "Mobile & desktop", options: c }, { text: "Real-time alerts, hail & wind maps", options: c }, { text: "Property-ownership detail", options: c }, { text: "Analytics, priority support & onboarding", options: c }, { text: "Lifetime price lock, partner network", options: cHot }],
    ];
    s.addTable(rows, {
      x: 0.6, y: 1.5, w: 12.1, colW: [1.9, 1.85, 2.1, 2.0, 2.15, 2.1],
      border: { type: "solid", color: "DDDDDD", pt: 0.75 },
      rowH: [0.4, 0.45, 0.45, 0.75, 0.45, 0.45, 0.75], margin: 0.06,
    });

    s.addShape("roundRect", { x: 0.6, y: 6.0, w: 12.1, h: 0.8, fill: { color: BLACK }, rectRadius: 0.06 });
    s.addText([
      { text: "Founding = every Platinum feature at $2,000 — $6,000/yr under sticker, locked for life. ", options: { bold: true, color: WHITE } },
      { text: "Unlimited maps, leads, and outreach for the whole team, vs. $150–300 per shared lead resold to competitors.", options: { color: "E6E6E6" } },
    ], { x: 0.95, y: 6.1, w: 11.5, h: 0.62, fontSize: 13.5, fontFace: "Arial", margin: 0 });
    footer(s, 6, "*Founding Member: all Platinum features, $2,000/month locked for life. Get cancellation terms in writing on the demo. Source: stormscout.ai/pricing, Aug 20, 2026.");
  }

  // ------------------------------------------------------------- 7. BREAK-EVEN
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    s.addText("The break-even math, tier by tier", {
      x: 0.6, y: 0.45, w: 12.1, h: 0.7, fontSize: 32, bold: true, color: BLACK, fontFace: "Arial", margin: 0
    });
    s.addText("Their published prices against T-Rock's actual job economics.", {
      x: 0.6, y: 1.18, w: 11.9, h: 0.4, fontSize: 15, color: MUTED, fontFace: "Arial", margin: 0
    });

    // assumptions card
    s.addShape("roundRect", { x: 0.6, y: 1.8, w: 4.6, h: 4.0, fill: { color: CARD }, rectRadius: 0.08 });
    s.addText("T-Rock job economics", { x: 0.95, y: 2.0, w: 3.9, h: 0.4, fontSize: 16, bold: true, color: BLACK, fontFace: "Arial", margin: 0 });
    s.addText([
      { text: "Average ticket", options: { bullet: true, breakLine: true, bold: true } },
      { text: "$30,000 revenue", options: { color: RED, bold: true, breakLine: true, paraSpaceAfter: 8, indentLevel: 1 } },
      { text: "Gross margin", options: { bullet: true, breakLine: true, bold: true } },
      { text: "35%  →  ~$10,500 gross profit / job", options: { color: RED, bold: true, breakLine: true, paraSpaceAfter: 8, indentLevel: 1 } },
      { text: "Jobs to break even", options: { bullet: true, breakLine: true, bold: true } },
      { text: "annual cost ÷ $10,500", options: { color: RED, bold: true, indentLevel: 1 } },
    ], { x: 0.95, y: 2.45, w: 3.9, h: 2.4, fontSize: 13.5, color: INK, fontFace: "Arial", margin: 0 });
    s.addText("Average ticket and margin per Dom — T-Rock actuals, not industry benchmarks.", {
      x: 0.95, y: 5.05, w: 3.9, h: 0.6, fontSize: 10.5, italic: true, color: MUTED, fontFace: "Arial", margin: 0
    });

    // chart: jobs to break even per published tier
    s.addChart(pres.ChartType.bar, [
      {
        name: "Incremental jobs per year to break even",
        labels: ["Bronze $100", "Silver $500", "Gold $1,000", "Founding $2,000", "Platinum $2,500"],
        values: [0.1, 0.6, 1.1, 2.3, 2.9],
      },
    ], {
      x: 5.5, y: 1.8, w: 7.2, h: 4.0,
      barDir: "col",
      chartColors: [RED],
      showTitle: true, title: "Jobs/year needed to cover the subscription", titleFontSize: 14, titleColor: BLACK, titleFontFace: "Arial",
      showValue: true, dataLabelPosition: "outEnd", dataLabelColor: BLACK, dataLabelFontSize: 12, dataLabelFontFace: "Arial", dataLabelFormatCode: "0.0",
      showLegend: false,
      catAxisLabelColor: INK, catAxisLabelFontSize: 12, catAxisLabelFontFace: "Arial",
      valAxisLabelColor: MUTED, valAxisLabelFontSize: 10, valAxisLabelFontFace: "Arial",
      valAxisMaxVal: 3.5,
      valGridLine: { color: "E8E8E8", size: 0.5 },
      catGridLine: { style: "none" },
    });

    s.addShape("roundRect", { x: 0.6, y: 6.05, w: 12.1, h: 0.8, fill: { color: BLACK }, rectRadius: 0.06 });
    s.addText([
      { text: "Founding breaks even at 2.3 jobs a year — one incremental roof every ~5 months. ", options: { bold: true, color: WHITE } },
      { text: "Everything past that is margin, and it's $500/mo under Platinum sticker forever.", options: { color: "E6E6E6" } },
    ], { x: 0.95, y: 6.2, w: 11.5, h: 0.5, fontSize: 16, fontFace: "Arial", margin: 0 });
    footer(s, 7, "");
  }

  // ----------------------------------------------------- 7. PILOT SCORECARD
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    s.addText("The 90-day proof period: scored, capped, killable", {
      x: 0.6, y: 0.45, w: 12.1, h: 0.7, fontSize: 32, bold: true, color: BLACK, fontFace: "Arial", margin: 0
    });
    s.addText("Full team goes live on Founding day 1 — but 2 reps keep the current playbook as the control, so the comparison stays honest.", {
      x: 0.6, y: 1.18, w: 11.9, h: 0.4, fontSize: 15, color: MUTED, fontFace: "Arial", margin: 0
    });

    const hdrOpts = { bold: true, color: WHITE, fill: { color: BLACK }, fontFace: "Arial", fontSize: 14, valign: "middle" };
    const cell = { fontFace: "Arial", fontSize: 12.5, color: INK, valign: "middle" };
    const tgt = { fontFace: "Arial", fontSize: 12.5, color: RED, bold: true, valign: "middle" };
    const rows = [
      [{ text: "KPI (tracked weekly)", options: hdrOpts }, { text: "Baseline (current door-knocking)", options: hdrOpts }, { text: "Pilot must beat baseline by", options: hdrOpts }],
      [{ text: "Inspections per rep-day", options: cell }, { text: "Measure in weeks 1–2", options: cell }, { text: "+25%", options: tgt }],
      [{ text: "Inspection → contingency rate", options: cell }, { text: "Measure in weeks 1–2", options: cell }, { text: "+15%", options: tgt }],
      [{ text: "Cost per sold job (all-in, incl. subscription)", options: cell }, { text: "Measure in weeks 1–2", options: cell }, { text: "Lower, full stop", options: tgt }],
      [{ text: "Map accuracy (damage confirmed on roof)", options: cell }, { text: "n/a — new metric", options: cell }, { text: "≥70% of flagged homes", options: tgt }],
    ];
    s.addTable(rows, {
      x: 0.6, y: 1.75, w: 12.1, colW: [4.6, 4.0, 3.5],
      border: { type: "solid", color: "DDDDDD", pt: 0.75 },
      rowH: 0.6, margin: 0.09,
    });

    circleIcon(s, icons.warn, 0.75, 5.55, 0.65);
    s.addText([
      { text: "Kill criteria, agreed up front: ", options: { bold: true, color: BLACK } },
      { text: "if all-in cost per sold job isn't beating our current baseline at day 90, we cancel. Spend at risk: $6,000 — about half of one job's gross profit. Founding bills $2,000 monthly; we get clean cancellation terms in writing before signing.", options: { color: INK } },
    ], { x: 1.6, y: 5.55, w: 11.0, h: 0.85, fontSize: 14.5, fontFace: "Arial", margin: 0 });
    footer(s, 8, "Targets are proposals — Aaron/Alan set final thresholds before we start.");
  }

  // ---------------------------------------------------- 8. STRAIGHT ANSWERS
  {
    const s = pres.addSlide();
    s.background = { color: WHITE };
    s.addText("Straight answers before you ask", {
      x: 0.6, y: 0.45, w: 12.1, h: 0.7, fontSize: 32, bold: true, color: BLACK, fontFace: "Arial", margin: 0
    });

    const items = [
      { icon: icons.searchDollar, h: "“Isn't the ‘limited offer’ a sales tactic?”", b: "Probably — and it doesn't matter. Billing is $2,000 monthly, locked forever: keep it and we pay $500/mo under sticker for life; cancel at day 90 and we're out $6,000 — half of one job's gross profit. Only dealbreaker: cancellation terms that aren't clean." },
      { icon: icons.warn, h: "“Their case studies are marketing.”", b: "Correct. Titan Roofing & Restoration and others on their site are vendor-published, no audited numbers. That's exactly why the pilot has our own scorecard — we trust our data, not theirs." },
      { icon: icons.cross, h: "“Is the damage data real?”", b: "We verify it ourselves: weeks 1–2, every map-flagged roof a rep inspects gets logged confirmed/not confirmed. Below 70% accuracy, the tool dies on that metric alone." },
      { icon: icons.users, h: "“Will the reps actually use it?”", b: "Adoption is the real risk with any tool. So it gets a named owner (Dom), the whole team trains on it day 1, and usage shows up in the weekly scorecard. Reps not working the lists is visible in the numbers within two weeks." },
    ];
    items.forEach((it, i) => {
      const x = 0.6 + (i % 2) * 6.2;
      const y = 1.5 + Math.floor(i / 2) * 2.65;
      s.addShape("roundRect", { x, y, w: 5.9, h: 2.4, fill: { color: CARD }, rectRadius: 0.08 });
      circleIcon(s, it.icon, x + 0.3, y + 0.3, 0.65);
      s.addText(it.h, { x: x + 1.15, y: y + 0.28, w: 4.55, h: 0.4, fontSize: 16, bold: true, color: RED, fontFace: "Arial", margin: 0 });
      s.addText(it.b, { x: x + 1.15, y: y + 0.72, w: 4.55, h: 1.6, fontSize: 12, color: INK, fontFace: "Arial", margin: 0 });
    });
    footer(s, 9, "");
  }

  // ----------------------------------------------------------------- 10. ASK
  {
    const s = pres.addSlide();
    s.background = { color: BLACK };
    s.addText("The ask", { x: 0.75, y: 0.6, w: 11.8, h: 0.8, fontSize: 40, bold: true, color: WHITE, fontFace: "Arial", margin: 0 });

    const steps = [
      { icon: icons.hand, n: "1", h: "Book the demo — this week", b: "30 minutes. Confirm the Founding offer is still open and get cancellation terms in writing. Verify storm-map coverage in our markets." },
      { icon: icons.clip, n: "2", h: "Buy Founding Member", b: "$2,000/mo, every Platinum feature, price locked for life. Full team live day 1; 2 control reps keep the old playbook." },
      { icon: icons.check, n: "3", h: "Day-90 scorecard: keep or kill", b: "Beats baseline → we own Platinum features at $500/mo under sticker, forever. Misses → cancel; at risk was $6,000." },
    ];
    steps.forEach((st, i) => {
      const x = 0.75 + i * 4.1;
      s.addShape("roundRect", { x, y: 1.75, w: 3.8, h: 3.4, fill: { color: "1E1E1E" }, rectRadius: 0.08 });
      circleIcon(s, st.icon, x + 0.32, 2.05, 0.7);
      s.addText(st.n, { x: x + 2.7, y: 1.95, w: 0.85, h: 0.85, fontSize: 44, bold: true, color: RED, fontFace: "Arial", align: "right", margin: 0 });
      s.addText(st.h, { x: x + 0.32, y: 3.0, w: 3.2, h: 0.7, fontSize: 17, bold: true, color: WHITE, fontFace: "Arial", margin: 0 });
      s.addText(st.b, { x: x + 0.32, y: 3.7, w: 3.2, h: 1.3, fontSize: 12.5, color: "CFCFCF", fontFace: "Arial", margin: 0 });
    });

    s.addText("Locked-in price. Measured on our own baseline. Easy to kill.", {
      x: 0.75, y: 5.6, w: 11.8, h: 0.6, fontSize: 22, bold: true, color: RED, fontFace: "Arial", margin: 0
    });
    s.addText("Downside: $6,000.  Upside: Platinum features at $2,000 for life — and crews knocking verified-damage doors first, every storm season.", {
      x: 0.75, y: 6.3, w: 11.8, h: 0.5, fontSize: 14, color: "BDBDBD", fontFace: "Arial", margin: 0
    });
  }

  await pres.writeFile({ fileName: __dirname + "/Storm-Scout-Pitch.pptx" });
  console.log("Wrote Storm-Scout-Pitch.pptx");
})().catch(e => { console.error(e); process.exit(1); });
