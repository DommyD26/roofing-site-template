/* Course content for "Roofing Construction & Estimating — The E-Course"
   Companion certification course to the book by Daniel Atcheson
   (Craftsman Book Company). Lesson text is an original, detailed summary of
   each topic area — the book remains the master reference.

   Structure:
   - chapters[]: { id, title, tagline, cats[], lessons[{t,min,html}], bank[], gens[] }
   - bank[]:  static questions  { cat, q, a[], correct }
   - gens[]:  generated questions with fresh random numbers each test:
              { cat, gen(R) -> { q, a[], correct } }   (R = {int, pick, money})
   The test engine shuffles answer order on every test, so authoring order
   doesn't matter and generators put the right answer first. */

window.COURSE = {
  title: "Roofing Construction & Estimating",
  subtitle: "The Certification E-Course",
  bookUrl: "https://drive.google.com/file/d/1ZG6sCgc3P_V1si596NiOlgW5_caGKJ7g/view",
  feedbackEmail: "dominicgpetro386@gmail.com",
  /* Leaderboard backend: paste your Google Apps Script Web App URL here
     (ends in /exec). See LEADERBOARD-SETUP.md. Empty = leaderboard shows
     setup instructions and scores stay device-only. */
  leaderboardUrl: "",
  passScore: 70,
  finalPassScore: 80,
  practiceSize: 20,
  finalSize: 36,

  masteryLevels: [
    { min: 90, label: "Nailed it", icon: "🔨", cls: "m-nailed" },
    { min: 75, label: "Solid", icon: "💪", cls: "m-solid" },
    { min: 60, label: "Getting there", icon: "🧰", cls: "m-getting" },
    { min: 0,  label: "On the punch list", icon: "📋", cls: "m-punch" }
  ],

  badges: [
    { id: "first-nail",       icon: "🔩", name: "First Nail",        desc: "Complete your first test." },
    { id: "perfect-square",   icon: "💯", name: "Perfect Square",    desc: "Score 100% on any test." },
    { id: "hot-streak",       icon: "🔥", name: "Hot Streak",        desc: "Pass 3 tests in a row." },
    { id: "comeback-kid",     icon: "🪜", name: "Comeback Kid",      desc: "Pass a chapter test you previously failed." },
    { id: "practice-pro",     icon: "🎯", name: "Practice Pro",      desc: "Pass a 20-question practice test." },
    { id: "iron-roofer",      icon: "🛠️", name: "Iron Roofer",       desc: "Take 10 tests of any kind." },
    { id: "dialed-in",        icon: "📐", name: "Dialed In",         desc: "Hold a 90%+ chapter average with 2+ attempts." },
    { id: "chapter-boss",     icon: "🏗️", name: "Chapter Boss",      desc: "Pass all 12 chapter tests." },
    { id: "master-estimator", icon: "💰", name: "Master Estimator",  desc: "Score 90%+ on the Estimating & Bidding chapter." },
    { id: "certified",        icon: "🏆", name: "Certified Roofer",  desc: "Pass the certification exam." }
  ],

  chapters: [

    /* ================= 1. MEASURING ================= */
    {
      id: "measuring",
      title: "Measuring Roofs: Slope, Area & Quantities",
      tagline: "Every estimate starts with an accurate takeoff. Learn to measure any roof — level or sloped — and convert plan dimensions into real roof area.",
      cats: ["Slope & pitch", "Area takeoff", "Hips, valleys & waste"],
      lessons: [
        {
          t: "Roof shapes, slope and how to measure pitch",
          min: 12,
          html: "<p>Roofs come in a handful of basic shapes — <strong>gable</strong> (two planes meeting at a ridge), <strong>hip</strong> (four planes, no exposed rakes), <strong>shed</strong> (one plane), <strong>gambrel</strong> and <strong>mansard</strong> (double-pitched), and <strong>flat/level</strong> (which still slopes slightly for drainage). Real houses combine these: a hip main body with gable dormers and a shed porch is three takeoffs, not one.</p><p><strong>Slope</strong> is written as rise over run: a 6/12 roof rises 6\" for every 12\" of horizontal run. Slope is not the same as the angle in degrees — 6/12 is about 26.6°, and 12/12 is 45°. Steep-slope roofing practice generally begins at 4/12; from 2/12 to 4/12 most shingle manufacturers demand special underlayment procedures, and below 2/12 shingles are prohibited — that's membrane territory.</p><p>Four reliable ways to read a slope:</p><ul><li><strong>Speed square and level</strong> on the rake edge or a gable end.</li><li><strong>Inside the attic:</strong> hold a level against a rafter bottom, measure 12\" along the level, then measure up to the rafter — that vertical distance is the rise.</li><li><strong>Pitch gauge or phone app</strong> laid flat on the shingles (subtract the shingle wedge on thick laminates).</li><li><strong>Aerial measurement reports</strong> — accurate for area, but verify the stated pitch on-site whenever you can; a wrong pitch on a steep roof changes labor pricing dramatically.</li></ul><div class='tip'>💡 <strong>Field habit:</strong> record pitch per roof plane, not per house. Plenty of homes carry a 4/12 porch, 6/12 main and 10/12 front gable — and your labor rate should change with each.</div>"
        },
        {
          t: "From plan area to actual area: slope factors",
          min: 15,
          html: "<p>The footprint of a sloped roof understates its surface. To convert <strong>plan (horizontal) area</strong> to <strong>actual roof area</strong>, multiply by the slope factor — the hypotenuse math already done for you:</p><table><tr><th>Pitch</th><th>Factor</th><th>Pitch</th><th>Factor</th></tr><tr><td>2/12</td><td>1.014</td><td>8/12</td><td>1.202</td></tr><tr><td>3/12</td><td>1.031</td><td>9/12</td><td>1.250</td></tr><tr><td>4/12</td><td>1.054</td><td>10/12</td><td>1.302</td></tr><tr><td>5/12</td><td>1.083</td><td>12/12</td><td>1.414</td></tr><tr><td>6/12</td><td>1.118</td><td>14/12</td><td>1.537</td></tr><tr><td>7/12</td><td>1.158</td><td>18/12</td><td>1.803</td></tr></table><p>The factor is √(rise² + 12²) ÷ 12 — so you can compute any pitch you meet. Worked example: a 32' × 48' footprint is 1,536 sq ft of plan area. At 8/12: 1,536 × 1.202 = <strong>1,846 sq ft</strong> of actual roof surface, or about 18.5 squares before waste. (One <strong>square</strong> = 100 sq ft — the language of the entire trade.)</p><p>Include <strong>overhangs</strong>: eave and rake overhangs are roof you must cover but they don't show in the interior floor plan. Measure to the drip edge, not the wall line. A 2' overhang around a 40' × 60' building adds the difference between 44' × 64' and 40' × 60' — 416 sq ft of plan area you'd otherwise miss.</p><div class='tip'>💡 <strong>Check yourself:</strong> when a measurement report and your tape disagree by more than ~3%, walk the roof again. The report can't see under trees, and you can't afford to eat two squares of shingles on every job.</div>"
        },
        {
          t: "Net vs. gross, hips, valleys, ridges and waste",
          min: 14,
          html: "<p><strong>Gross area</strong> is the whole roof surface. <strong>Net area</strong> subtracts large openings — skylights, chimneys over ~4 sq ft, cupolas. Small penetrations (pipes, vents) are ignored; the waste factor absorbs them. Most material orders work from net area plus waste.</p><p><strong>Hips and valleys run diagonally in two directions</strong>, so their true length exceeds both their plan length and the common-rafter length. Apply hip/valley factors to the plan-view length:</p><table><tr><th>Pitch</th><th>Hip/valley factor</th></tr><tr><td>4/12</td><td>1.452</td></tr><tr><td>6/12</td><td>1.500</td></tr><tr><td>8/12</td><td>1.564</td></tr><tr><td>10/12</td><td>1.642</td></tr><tr><td>12/12</td><td>1.732</td></tr></table><p>Those lengths drive your hip/ridge cap order and valley metal or membrane lineal footage. <strong>Ridge length</strong> on a simple gable equals building length; on a full hip roof, the ridge shrinks to building length minus building width (the hips eat the rest).</p><p><strong>Waste</strong> covers cuts, starter overlap trimming, damaged pieces and the small penetrations you ignored: figure <strong>5–10% on clean gables</strong>, <strong>10–15%+ on cut-up hips</strong> with dormers and multiple valleys, and more on diagonal-pattern materials. Laminated shingle offcuts at rakes are often reusable; three-tab cuts at valleys usually aren't.</p><div class='tip'>💡 <strong>Rule of thumb sanity check:</strong> total hip + valley lineal footage over ~100 LF on a single-family house means you're in premium-waste, premium-labor territory. Price it that way.</div>"
        }
      ],
      bank: [
        { cat: "Slope & pitch", q: "A roof rises 6\" for every 12\" of horizontal run. Its slope is:", a: ["6/12", "12/6", "50/100", "6 degrees"], correct: 0 },
        { cat: "Slope & pitch", q: "Standard asphalt shingle application generally begins at what minimum slope (without special low-slope procedures)?", a: ["2/12", "4/12", "6/12", "8/12"], correct: 1 },
        { cat: "Slope & pitch", q: "To read pitch from inside the attic you hold a level against a rafter, measure 12\" along the level, then measure:", a: ["Along the ridge board", "Vertically up to the rafter — that's the rise", "The rafter's total length", "The ceiling joist spacing"], correct: 1 },
        { cat: "Area takeoff", q: "One roofing 'square' equals:", a: ["10 sq ft", "100 sq ft", "1,000 sq ft", "One bundle"], correct: 1 },
        { cat: "Area takeoff", q: "Eave and rake overhangs should be:", a: ["Ignored — they're not living space", "Included; measure to the drip edge, not the wall line", "Estimated at half their area", "Included only on hip roofs"], correct: 1 },
        { cat: "Area takeoff", q: "The slope factor for any pitch can be computed as:", a: ["rise ÷ 12", "√(rise² + 12²) ÷ 12", "12 ÷ rise", "rise × run"], correct: 1 },
        { cat: "Hips, valleys & waste", q: "Net roof area is:", a: ["Gross area plus waste", "Plan area before the slope factor", "Gross area minus large openings like skylights and chimneys", "The area of the ridge caps"], correct: 2 },
        { cat: "Hips, valleys & waste", q: "Hips and valleys are longer than their plan length because they:", a: ["Sag over time", "Run diagonally in both plan and elevation", "Include the ridge", "Are measured in metric"], correct: 1 },
        { cat: "Hips, valleys & waste", q: "On a full hip roof, the ridge length equals:", a: ["Building length", "Building length minus building width", "Building width", "Twice the building length"], correct: 1 },
        { cat: "Hips, valleys & waste", q: "Which roof earns the HIGHEST waste factor?", a: ["Simple gable ranch", "Cut-up hip roof with dormers and multiple valleys", "Single-plane shed roof", "Level roof"], correct: 1 }
      ],
      gens: [
        {
          cat: "Area takeoff",
          gen: function (R) {
            var pitches = [["4/12", 1.054], ["5/12", 1.083], ["6/12", 1.118], ["7/12", 1.158], ["8/12", 1.202], ["9/12", 1.25], ["10/12", 1.302]];
            var p = R.pick(pitches);
            var L = R.int(9, 16) * 4, W = R.int(6, 11) * 4;
            var plan = L * W;
            var actual = Math.round(plan * p[1]);
            return {
              q: "A house footprint (including overhangs) measures " + L + "' × " + W + "' — " + plan.toLocaleString() + " sq ft of plan area. The roof is " + p[0] + " (slope factor " + p[1] + "). Actual roof area is about:",
              a: [actual.toLocaleString() + " sq ft", plan.toLocaleString() + " sq ft", Math.round(plan / p[1]).toLocaleString() + " sq ft", Math.round(actual * 1.25).toLocaleString() + " sq ft"],
              correct: 0
            };
          }
        },
        {
          cat: "Hips, valleys & waste",
          gen: function (R) {
            var area = R.int(14, 34) * 100;
            var waste = R.pick([10, 12, 15]);
            var total = Math.ceil(area * (1 + waste / 100) / 100);
            return {
              q: "Net roof area is " + area.toLocaleString() + " sq ft on a cut-up hip roof. Adding " + waste + "% waste, how many squares of material should you order (round up)?",
              a: [total + " squares", Math.ceil(area / 100) + " squares", (total + 3) + " squares", Math.ceil(area * (1 - waste / 100) / 100) + " squares"],
              correct: 0
            };
          }
        }
      ]
    },

    /* ================= 2. SHEATHING ================= */
    {
      id: "sheathing",
      title: "Roof Sheathing & Decking",
      tagline: "The deck is the foundation of the roof system. Verify the structure, know your panel rules, and price hidden rot before it eats your profit.",
      cats: ["Framing & structure", "Panel installation", "Estimating decking"],
      lessons: [
        {
          t: "Check the framing before anything else",
          min: 10,
          html: "<p>Roofing is only as good as what it's nailed to. Before bidding — and again after tear-off — evaluate the structure:</p><ul><li><strong>Rafter/truss condition:</strong> look for cracked or sistered members, water-stained wood at valleys and chimneys, rot at the eaves (the first place gutters back up), and insect damage.</li><li><strong>Sag lines:</strong> sight down the ridge and across each plane from the ground. A swayback ridge or dished plane signals undersized framing or delaminated sheathing.</li><li><strong>Spacing and span:</strong> 16\" or 24\" on-center framing determines the panel span rating you need. Wider spacing with thin decking feels spongy underfoot — and telegraphs every flaw through the new roof.</li><li><strong>Load path for heavy materials:</strong> switching from asphalt (~2.5 lbs/sq ft) to tile or slate (6–11+ lbs/sq ft) is a structural change. Get an engineer's evaluation in writing before you promise a tile conversion.</li></ul><div class='tip'>💡 <strong>Cover yourself:</strong> photograph structural problems before and after tear-off, and get change orders signed before you fix them. \"While you're up there…\" work you didn't paper is work you donated.</div>"
        },
        {
          t: "Sheathing systems: panels, boards and planks",
          min: 12,
          html: "<p><strong>Solid panel sheathing</strong> — plywood or OSB — is the standard deck under asphalt, metal shingle and membrane systems. Key rules:</p><ul><li>Common roof thicknesses run 7/16\" OSB to 5/8\" plywood; match the panel span rating to rafter spacing.</li><li>Run the long dimension <strong>across</strong> the rafters, stagger end joints, and land every panel edge on framing or H-clips.</li><li>Leave ~1/8\" gaps at edges and ends — panels swell; a tight deck buckles and telegraphs ridges through shingles.</li><li>Nail to schedule (commonly 6\" edges / 12\" field). In high-wind zones, ring-shank nails and tighter schedules apply — and re-nailing the existing deck to current code is a legitimate, insurable line item in many storm markets.</li></ul><p><strong>Spaced (skip) sheathing</strong> — 1x4/1x6 boards with gaps — is traditional under wood shakes/shingles and some tile: it lets the underside of the material dry. Re-roofing skip-sheathed houses with asphalt means overlaying solid decking first.</p><p><strong>Plank decking</strong> (2x6 tongue-and-groove) appears on exposed-beam and post-and-beam construction: it's structure and finished ceiling at once, so fastener length matters — a nail through the ceiling of the living room is a service call you'll never forget.</p>"
        },
        {
          t: "Estimating decking and staging material safely",
          min: 10,
          html: "<p>A 4x8 panel covers <strong>32 sq ft</strong>. Sheets = actual roof area ÷ 32, plus <strong>5–10% cutting waste</strong> (more on hips and roofs with many penetrations). Price plywood and OSB at current market — panel pricing moves fast enough to re-quote on jobs bid more than 30 days out.</p><p><strong>Rot is invisible until tear-off.</strong> The professional answer is a unit price in the contract: \"decking replacement beyond the first N sheets at $X per sheet, installed.\" Everyone is protected: the customer pays for what's actually found, and you never eat a surprise.</p><p><strong>Loading the roof:</strong> spread bundle stacks along framing near the ridge — never a pallet's worth mid-span on one plane. Modern laminate bundles run 65–85 lbs; a 30-square delivery is well over a ton of concentrated load. Boom delivery to the ridge beats ladder-humping for both your deck and your crew's backs.</p><div class='tip'>💡 <strong>Walk it after tear-off:</strong> soft spots underfoot, delaminated OSB (flaky layers), and dark staining around old nail holes all buy new decking. Mark sheets with paint as you find them and count in front of the homeowner.</div>"
        }
      ],
      bank: [
        { cat: "Framing & structure", q: "Before promising an asphalt-to-tile conversion you must:", a: ["Just add extra underlayment", "Get a structural evaluation for the added weight", "Use longer nails", "Nothing special"], correct: 1 },
        { cat: "Framing & structure", q: "A swayback ridge line seen from the street usually signals:", a: ["Normal aging", "Undersized or damaged framing/sheathing", "Too many shingle layers were removed", "Good attic ventilation"], correct: 1 },
        { cat: "Framing & structure", q: "The first place to look for eave rot is:", a: ["At the ridge", "Where gutters back up against the fascia and deck edge", "Mid-span between rafters", "At the gable peak"], correct: 1 },
        { cat: "Panel installation", q: "Sheathing panels are installed with:", a: ["Ends aligned in one straight line", "Staggered end joints and ~1/8\" expansion gaps", "Tight joints, no gaps", "Long dimension parallel to rafters"], correct: 1 },
        { cat: "Panel installation", q: "H-clips are used to:", a: ["Hang gutters", "Support unblocked panel edges between rafters", "Attach drip edge", "Splice rafters"], correct: 1 },
        { cat: "Panel installation", q: "Spaced (skip) sheathing is traditionally used under:", a: ["Asphalt shingles", "Wood shakes and shingles", "TPO membrane", "Modified bitumen"], correct: 1 },
        { cat: "Panel installation", q: "A common field nailing schedule for roof sheathing is:", a: ["6\" edges / 12\" field", "24\" everywhere", "2\" everywhere", "Adhesive only"], correct: 0 },
        { cat: "Estimating decking", q: "One 4x8 sheathing panel covers:", a: ["24 sq ft", "32 sq ft", "40 sq ft", "48 sq ft"], correct: 1 },
        { cat: "Estimating decking", q: "The professional way to handle unknown deck rot in a bid:", a: ["Ignore it and hope", "A written per-sheet unit price for replacement", "A verbal promise to 'work something out'", "Double the whole bid"], correct: 1 },
        { cat: "Estimating decking", q: "When staging shingle bundles on the roof you should:", a: ["Stack a full pallet mid-span", "Spread stacks along framing near the ridge", "Stack everything in one valley", "Store them on the overhangs"], correct: 1 }
      ],
      gens: [
        {
          cat: "Estimating decking",
          gen: function (R) {
            var area = R.int(15, 32) * 100;
            var waste = R.pick([5, 8, 10]);
            var sheets = Math.ceil(area * (1 + waste / 100) / 32);
            return {
              q: "You're re-decking " + area.toLocaleString() + " sq ft of roof with 4x8 panels (32 sq ft each) plus " + waste + "% cutting waste. How many sheets do you order (round up)?",
              a: [sheets + " sheets", Math.ceil(area / 32) + " sheets", (sheets + 8) + " sheets", Math.ceil(area / 48) + " sheets"],
              correct: 0
            };
          }
        }
      ]
    },

    /* ================= 3. UNDERLAYMENT ================= */
    {
      id: "underlayment",
      title: "Underlayment & Dry-In",
      tagline: "The roof's second line of defense — and the layer that protects the job (and your liability) between tear-off and final roofing.",
      cats: ["Materials", "Installation & laps", "Estimating dry-in"],
      lessons: [
        {
          t: "Felt, synthetics and self-adhering membranes",
          min: 12,
          html: "<p><strong>Asphalt-saturated felt</strong> (No. 15 and No. 30) is the traditional underlayment. It's cheap and vapor-open, but it wrinkles when damp, tears in wind, and degrades quickly in sun — a felt dry-in is a days-not-weeks protection layer. No. 30 is the heavier, more tear-resistant choice on steep or slow jobs.</p><p><strong>Synthetic underlayment</strong> (woven polypropylene/polyethylene) has taken over quality steep-slope work: 3–5× lighter per square, dramatically stronger, better footing for the crew, printed nailing grids, and rated UV exposure measured in months instead of days. Most require cap nails or cap staples — check the fastening spec, not just the price.</p><p><strong>Self-adhering \"ice &amp; water\" membrane</strong> (rubberized asphalt with a peel-off back) bonds to the deck and <strong>seals around fasteners</strong>. Code and best practice put it: at eaves in ice-dam country (from the edge to at least 24\" inside the warm wall), in valleys, around chimneys/skylights/penetrations, and on low-slope transitions like porch ties-ins. In severe hail/wind markets, full-deck coverage is sold as a premium upgrade.</p><div class='tip'>💡 <strong>Spec detail that separates pros:</strong> granular-surface ice &amp; water in open metal valleys, smooth high-temp membrane under metal roofing and in dead valleys — plain ice &amp; water under a hot metal panel can flow and bleed.</div>"
        },
        {
          t: "Installation: laps, direction and dry-in discipline",
          min: 10,
          html: "<p>Underlayment works by <strong>shingling water downhill</strong> — every upper course laps over the one below, never behind it. Standard practice:</p><ul><li>Start at the eave, roll horizontally, keep courses straight (chalk lines or the synthetic's printed lines).</li><li><strong>Horizontal (head) laps:</strong> typically 2–4\"; <strong>end (side) laps:</strong> 6\"; laps at hips and ridges wrap over the peak.</li><li>Below 4/12 with shingles: <strong>double coverage</strong> — 19\" exposure on 36\" felt — or a full self-adhered base instead.</li><li>Drip edge sequencing: underlayment <strong>over</strong> drip edge at eaves in ice regions per many specs, <strong>under</strong> at rakes — follow local code, but never let a lap face uphill.</li><li>Fasten to the maker's pattern; wind gets under loose edges and a blown-off dry-in is a flooded living room with your name on it.</li></ul><p>A proper dry-in means the house can take rain tonight. That's the standard: never open more roof than you can dry-in the same day.</p>"
        },
        {
          t: "Estimating the dry-in package",
          min: 8,
          html: "<p>Coverage math you'll use weekly:</p><ul><li><strong>No. 15 felt:</strong> ~4 squares per roll. <strong>No. 30:</strong> ~2 squares per roll.</li><li><strong>Synthetics:</strong> commonly ~10 squares per roll (varies 4–10 — read the label).</li><li><strong>Ice &amp; water:</strong> rolls are typically 3' × 33'–75'; estimate by <strong>lineal feet</strong> of eave, valley, and penetration perimeter, then convert to rolls.</li></ul><p>Rolls = net roof area ÷ coverage per roll, rounded up, plus a roll for laps/waste on cut-up roofs. Double-coverage areas literally double the quantity — don't forget the porch that's at 3/12.</p><p>Add the accessories that ride with dry-in: cap nails, drip edge (eaves + rakes LF), and any temporary protection. On steep pitches add labor: everything above 8/12 slows the whole dry-in operation.</p>"
        }
      ],
      bank: [
        { cat: "Materials", q: "Compared with felt, synthetic underlayment is generally:", a: ["Heavier and weaker", "Stronger, lighter and far more UV-tolerant", "Cheaper per square", "Not walkable"], correct: 1 },
        { cat: "Materials", q: "Self-adhering ice & water membrane earns its keep because it:", a: ["Is the cheapest option", "Seals around nail penetrations", "Needs no laps", "Replaces flashing"], correct: 1 },
        { cat: "Materials", q: "Under a metal roof and in dead valleys, the better membrane choice is:", a: ["No. 15 felt", "High-temperature smooth self-adhered membrane", "Standard granular ice & water", "Rosin paper"], correct: 1 },
        { cat: "Materials", q: "In ice-dam regions, eave membrane should extend:", a: ["To the gutter line only", "At least 24\" inside the warm wall line", "6\" up from the drip edge", "To the ridge"], correct: 1 },
        { cat: "Installation & laps", q: "Underlayment courses must lap so that:", a: ["Lower courses overlap upper ones", "Upper courses overlap lower ones — water always sheds over", "Laps face uphill", "No laps are needed"], correct: 1 },
        { cat: "Installation & laps", q: "Typical end (side) laps for underlayment are:", a: ["1\"", "6\"", "18\"", "None"], correct: 1 },
        { cat: "Installation & laps", q: "For shingles between 2/12 and 4/12, underlayment must be:", a: ["Skipped", "Double coverage (or a self-adhered base)", "Installed vertically", "Stapled only at the ridge"], correct: 1 },
        { cat: "Installation & laps", q: "The dry-in discipline rule is:", a: ["Open the whole roof Monday", "Never open more roof than you can dry-in the same day", "Dry-in is optional in summer", "Underlayment can wait for the shingle delivery"], correct: 1 },
        { cat: "Estimating dry-in", q: "A roll of No. 15 felt covers about:", a: ["1 square", "4 squares", "10 squares", "20 squares"], correct: 1 },
        { cat: "Estimating dry-in", q: "Ice & water membrane is estimated by:", a: ["Squares of field area only", "Lineal feet of eaves, valleys and penetration perimeters", "Number of bundles", "Ridge length only"], correct: 1 }
      ],
      gens: [
        {
          cat: "Estimating dry-in",
          gen: function (R) {
            var area = R.int(16, 36) * 100;
            var cov = R.pick([[10, "a 10-square synthetic roll"], [4, "No. 15 felt (4 squares/roll)"]]);
            var rolls = Math.ceil(area / 100 / cov[0]);
            return {
              q: "Dry-in for " + area.toLocaleString() + " sq ft of roof using " + cov[1] + ". Minimum rolls needed (round up)?",
              a: [rolls + " rolls", (rolls + 4) + " rolls", Math.max(1, rolls - 1) + " rolls", Math.ceil(area / 100) + " rolls"],
              correct: 0
            };
          }
        }
      ]
    },

    /* ================= 4. ASPHALT ================= */
    {
      id: "asphalt",
      title: "Asphalt Shingles",
      tagline: "The material on most American roofs. Master products, flawless nailing, and the complete takeoff — field, starter, caps, and accessories.",
      cats: ["Products & ratings", "Installation & nailing", "Estimating shingles"],
      lessons: [
        {
          t: "Products: three-tab, laminate, designer and impact-rated",
          min: 12,
          html: "<p><strong>Three-tab strip shingles</strong> — one layer, cutouts forming three tabs, lightest weight, lowest wind ratings (commonly 60–70 mph). They still appear on budget work and repairs of existing three-tab roofs, but the market has moved on.</p><p><strong>Laminated (architectural/dimensional) shingles</strong> — two bonded layers creating shadow-line texture. Heavier (230–300+ lbs/sq), wind warranties of 110–130 mph with proper nailing, algae-resistant granule options, 25-year-to-\"lifetime\" limited warranties. This is the default residential product.</p><p><strong>Designer/luxury shingles</strong> — oversized, multi-layer profiles imitating slate or shake, 400+ lbs/sq, premium price. <strong>Impact-rated (UL 2218 Class 4)</strong> shingles use polymer-modified (SBS) asphalt that resists hail cracking — in hail states, insurers often discount premiums for them, a genuine selling tool.</p><p>Every bundle also carries a <strong>lot number</strong> — mixing lots across a plane risks visible color banding. Order the job from one lot, and stage bundles so the crew works from one pallet at a time.</p>"
        },
        {
          t: "Installation that survives inspections and windstorms",
          min: 15,
          html: "<p>The sequence: drip edge → underlayment → starter course → field shingles → hip and ridge caps, with flashing woven in as you go.</p><ul><li><strong>Starter strip</strong> at eaves <em>and rakes</em>: the factory adhesive line at the edge is what keeps first-course tabs from lifting. Cutting starters from field shingles works only if the sealant lands at the edge.</li><li><strong>Exposure:</strong> laminates typically run 5-5/8\" — follow the shingle, not habit. Consistent exposure is what a straight roof looks like from the street.</li><li><strong>Nailing is the whole ballgame:</strong> 4 nails standard, <strong>6 nails in high-wind zones or on steep slopes</strong>, driven flush — not overdriven, not angled, not high. Nails above the nail line miss the course below; overdriven nails cut the mat. Both void warranties and both blow off.</li><li><strong>Offsets:</strong> stagger joints per the manufacturer's pattern (racking straight up the roof is prohibited on most laminates).</li><li><strong>Valleys:</strong> open metal (W-valley), closed-cut, or woven — open metal sheds debris best and is the premium look; closed-cut is the production standard. Keep nails 6\"+ back from the valley centerline.</li><li><strong>Caps and ventilation:</strong> ridge vent under cap shingles; use proper cap product or cut caps only where the manufacturer allows.</li></ul><div class='tip'>💡 <strong>Cold-weather note:</strong> sealant strips need sun and warmth to bond. Late-fall installs may need hand-sealing with asphalt cement in wind-prone spots — build the labor in.</div>"
        },
        {
          t: "The complete asphalt takeoff",
          min: 15,
          html: "<p>Field shingles: <strong>squares = net area × (1 + waste)</strong> — 5–10% gable, 10–15% cut-up. Most laminates are <strong>3 bundles per square</strong>; heavy designers run 4–5. Always confirm bundles/square from the wrapper, not memory.</p><p>Then the lines that separate a real estimate from a guess:</p><ul><li><strong>Starter:</strong> eave LF + rake LF ÷ coverage per bundle of starter product.</li><li><strong>Hip &amp; ridge caps:</strong> hip LF + ridge LF ÷ coverage per bundle (typically 20–35 LF).</li><li><strong>Fasteners:</strong> roughly 1.5–2 lbs of coil nails per square at 4 nails; more at 6-nail spec.</li><li><strong>Accessories:</strong> underlayment package, drip edge, valley metal, pipe boots, vents (ridge vent LF or box vent count), step/counter flashing, sealant.</li><li><strong>Tear-off &amp; disposal:</strong> old asphalt runs ~250–350 lbs per square per layer — a 30-square single-layer tear-off is 4–5 tons of debris. Price the dumpster and the labor to fill it.</li><li><strong>Labor tiers:</strong> walkable (≤6/12), steep (7–9/12), extra-steep (10/12+, staging/harness time). Two-story adds; cut-up adds.</li></ul><div class='tip'>💡 <strong>Estimator's discipline:</strong> a takeoff isn't done until starter, caps, and disposal are on it. Those three lines are the most commonly forgotten — and they're 10–15% of the job cost.</div>"
        }
      ],
      bank: [
        { cat: "Products & ratings", q: "The standard residential shingle sold today is:", a: ["Three-tab", "Laminated/architectural", "T-lock", "Roll roofing"], correct: 1 },
        { cat: "Products & ratings", q: "UL 2218 Class 4 rating means the shingle:", a: ["Is fireproof", "Passed the highest impact-resistance test — often earning insurance discounts", "Never fades", "Requires no nails"], correct: 1 },
        { cat: "Products & ratings", q: "Mixing shingle lot numbers across one roof plane risks:", a: ["Nothing", "Visible color banding", "Voided decking", "Extra weight"], correct: 1 },
        { cat: "Installation & nailing", q: "Standard nailing per shingle (non-high-wind) is:", a: ["2 nails", "4 nails", "6 nails", "8 nails"], correct: 1 },
        { cat: "Installation & nailing", q: "Nails driven above the nail line are a defect because they:", a: ["Rust faster", "Miss catching the course below", "Are too visible", "Use more steel"], correct: 1 },
        { cat: "Installation & nailing", q: "Starter strip belongs at:", a: ["Eaves only", "Eaves and rakes", "Ridge only", "Valleys"], correct: 1 },
        { cat: "Installation & nailing", q: "In a closed-cut or open valley, keep nails at least:", a: ["1\" from centerline", "6\" from centerline", "12\" from the eave", "Touching the centerline"], correct: 1 },
        { cat: "Installation & nailing", q: "Shingle sealant strips in cold-weather installs may require:", a: ["No change", "Hand-sealing with asphalt cement", "Skipping the starter", "Wider exposure"], correct: 1 },
        { cat: "Estimating shingles", q: "Most laminated shingles cover one square with:", a: ["2 bundles", "3 bundles", "5 bundles", "1 bundle"], correct: 1 },
        { cat: "Estimating shingles", q: "One layer of old asphalt roofing weighs roughly:", a: ["50 lbs/square", "250–350 lbs/square", "1,000 lbs/square", "25 lbs/square"], correct: 1 },
        { cat: "Estimating shingles", q: "The three most commonly forgotten takeoff lines are:", a: ["Field, felt, nails", "Starter, caps and disposal", "Paint, caulk, brooms", "Permits, tarps, magnets"], correct: 1 }
      ],
      gens: [
        {
          cat: "Estimating shingles",
          gen: function (R) {
            var sq = R.int(15, 40);
            var waste = R.pick([10, 15]);
            var bundles = Math.ceil(sq * (1 + waste / 100)) * 3;
            return {
              q: "A roof measures " + sq + " squares net. With " + waste + "% waste and 3 bundles per square, how many bundles of laminate do you order?",
              a: [bundles + " bundles", (sq * 3) + " bundles", (bundles + 9) + " bundles", Math.ceil(sq * 1.5) * 3 + " bundles"],
              correct: 0
            };
          }
        },
        {
          cat: "Estimating shingles",
          gen: function (R) {
            var sq = R.int(18, 38);
            var layers = R.pick([1, 1, 2]);
            var perSq = 300;
            var tons = (sq * layers * perSq / 2000);
            var tonsR = Math.round(tons * 10) / 10;
            return {
              q: "Tear-off: " + sq + " squares, " + layers + " layer" + (layers > 1 ? "s" : "") + " of asphalt at ~" + perSq + " lbs per square-layer. Approximate debris weight?",
              a: [tonsR + " tons", Math.round(tonsR * 2 * 10) / 10 + " tons", Math.round(sq * 10) / 10 + " tons", Math.round(tonsR / 2 * 10) / 10 + " tons"],
              correct: 0
            };
          }
        }
      ]
    },

    /* ================= 5. WOOD ================= */
    {
      id: "wood",
      title: "Wood Shingles & Shakes",
      tagline: "Cedar delivers a look nothing else matches — and demands real craftsmanship, breathing room, and honest labor pricing.",
      cats: ["Materials & grades", "Installation craft", "Estimating wood roofs"],
      lessons: [
        {
          t: "Shingles vs. shakes, species and grades",
          min: 10,
          html: "<p><strong>Wood shingles</strong> are sawn on both faces — smooth, uniform taper, laid to tight tolerances in 16\", 18\" and 24\" lengths. <strong>Shakes</strong> are split (at least on the exposed face) — thicker butts (1/2\" to 3/4\"+ \"heavies\"), rustic texture, deeper shadow lines.</p><p>Western red cedar dominates; Alaskan yellow cedar and treated southern pine appear regionally. Grades matter enormously on a roof:</p><ul><li><strong>No. 1 (Blue Label):</strong> 100% heartwood, 100% edge-grain, 100% clear — the only grade for premium roof work.</li><li><strong>No. 2 (Red Label):</strong> limited flat grain and sapwood — economy roofs, sidewall.</li><li><strong>No. 3 (Black Label):</strong> utility — sheds and sidewall only.</li></ul><p>Fire matters: untreated wood roofs are restricted or banned in many wildfire jurisdictions; pressure-impregnated fire-retardant (Class B/C assemblies) product exists — check local code before you quote.</p>"
        },
        {
          t: "Installation: letting the roof breathe",
          min: 12,
          html: "<p>Wood moves with moisture — the system must ventilate both faces:</p><ul><li>Install over <strong>spaced sheathing</strong> or a <strong>ventilating mat</strong> on solid decks.</li><li><strong>Keyway gaps</strong> between pieces (about 1/4\"–3/8\" shingles, 3/8\"–5/8\" shakes) allow expansion; side joints offset 1-1/2\"+ between courses, no joints aligned within three courses.</li><li><strong>Two fasteners per piece, only two</strong> — hot-dipped galvanized or stainless, driven flush, about 3/4\" from edges and 1-1/2\" above the exposure line. Extra nails split wood as it moves.</li><li><strong>Shakes get an 18\"-wide No. 30 felt interlay</strong> between each course, positioned so its bottom edge sits above the butt line at twice the exposure — it stops wind-driven water in the thick, open keyways.</li><li><strong>Exposure by length and slope:</strong> e.g., 16\" shingles at 5\" (4/12+), 18\" at 5-1/2\", 24\" at 7-1/2\"; reduce below 4/12. Shakes commonly 7-1/2\" (18\") and 10\" (24\").</li></ul><div class='tip'>💡 <strong>Craft check from the ground:</strong> straight courses, tight offsets, no aligned joints, and copper or stainless valley metal. A wood roof telegraphs its installer's skill from the curb.</div>"
        },
        {
          t: "Estimating cedar honestly",
          min: 8,
          html: "<p>Coverage depends on exposure: bundles are labeled in squares <em>at a standard exposure</em> — four bundles of 16\" shingles ≈ 1 square at 5\"; run a wider or tighter exposure and coverage shifts proportionally. Shakes commonly run 5 bundles per square at standard exposure with the felt interlay.</p><p>Cost drivers to respect:</p><ul><li><strong>Labor:</strong> 2–3× asphalt time. Every piece is placed by hand, joints planned, keyways gauged.</li><li><strong>Waste:</strong> 10% straight roofs; 15%+ with hips and valleys.</li><li><strong>The interlay felt</strong> on shakes (roughly one 18\"-wide roll per 2–3 squares) plus premium fasteners — stainless in coastal air.</li><li><strong>Maintenance conversation:</strong> moss treatment, debris cleaning, periodic oiling in some climates. Set expectations in the proposal — it's also future service revenue.</li></ul>"
        }
      ],
      bank: [
        { cat: "Materials & grades", q: "The physical difference between shakes and shingles:", a: ["Shakes are sawn smooth; shingles are split", "Shakes are split and thicker; shingles are sawn both faces", "No difference", "Shingles are only for walls"], correct: 1 },
        { cat: "Materials & grades", q: "The only grade appropriate for premium wood roof work:", a: ["No. 3 Black Label", "No. 2 Red Label", "No. 1 Blue Label — clear, edge-grain heartwood", "Utility grade"], correct: 2 },
        { cat: "Materials & grades", q: "Before quoting a wood roof you must check:", a: ["Paint colors", "Local wildfire/fire-code restrictions", "The HOA's lawn rules", "Attic paint"], correct: 1 },
        { cat: "Installation craft", q: "How many nails per wood shingle or shake?", a: ["Two — exactly two", "Four", "Six", "One"], correct: 0 },
        { cat: "Installation craft", q: "Shake installation requires what between courses?", a: ["Ice & water shield", "An 18\" No. 30 felt interlay", "Metal strips", "Nothing"], correct: 1 },
        { cat: "Installation craft", q: "Keyway gaps between pieces exist to:", a: ["Save material", "Allow expansion as the wood takes on moisture", "Speed installation", "Drain the ridge"], correct: 1 },
        { cat: "Installation craft", q: "Wood roofs must be able to:", a: ["Stay perfectly sealed from below", "Dry from both faces — spaced sheathing or a vent mat", "Bake in the sun", "Stay wet"], correct: 1 },
        { cat: "Estimating wood roofs", q: "Bundle coverage for wood shingles depends on:", a: ["The color", "The exposure being run", "The nail brand", "The season"], correct: 1 },
        { cat: "Estimating wood roofs", q: "Compared with asphalt, cedar labor runs about:", a: ["The same", "2–3× the hours", "Half the hours", "10× the hours"], correct: 1 }
      ],
      gens: [
        {
          cat: "Estimating wood roofs",
          gen: function (R) {
            var sq = R.int(12, 26);
            var waste = R.pick([10, 15]);
            var bundles = Math.ceil(sq * (1 + waste / 100) * 5);
            return {
              q: "Shake roof: " + sq + " squares at 5 bundles per square with " + waste + "% waste. Bundles to order (round up)?",
              a: [bundles + " bundles", (sq * 5) + " bundles", (bundles + 12) + " bundles", (sq * 3) + " bundles"],
              correct: 0
            };
          }
        }
      ]
    },

    /* ================= 6. TILE ================= */
    {
      id: "tile",
      title: "Concrete & Clay Tile",
      tagline: "Tile roofs last generations — if the structure can carry them, the underlayment is premium, and every detail sheds water.",
      cats: ["Materials & weight", "System details", "Estimating tile"],
      lessons: [
        {
          t: "Profiles, materials and the weight question",
          min: 10,
          html: "<p><strong>Clay tile</strong> — fired earth, colorfast for a century: barrel/mission (two-piece), S-tile (one-piece pan+cover), and flat profiles. <strong>Concrete tile</strong> — extruded and cheaper: S, flat shake-texture, and slate-look profiles; color is surface or through-body and can fade over decades.</p><p><strong>Weight rules the conversation:</strong> standard tile runs roughly <strong>600–1,100+ lbs per square</strong> versus ~250 for laminate asphalt. \"Lightweight\" concrete tile (~600 lbs/sq) exists for re-roofs, but any asphalt-to-tile conversion needs a structural evaluation, stamped where the jurisdiction requires it. Never let a salesperson promise tile before the framing verdict is in.</p><p>Tile is <strong>brittle by design</strong> — it sheds water and survives sun forever, but a dropped tool or careless step cracks it. Walk on the headlaps/lower third, or on foam pads, and stock replacement tiles from the same production run at handover.</p>"
        },
        {
          t: "The system: underlayment does the waterproofing",
          min: 12,
          html: "<p>A tile roof is a <strong>water-shedding</strong> system: wind-driven rain will get past tiles, and the underlayment carries it out. That's why tile specs call for premium bases — two plies of No. 40/43 felt, a self-adhered membrane, or high-performance synthetic rated for the tile's service life. Re-roofs where the tile outlived a cheap felt (\"the tile's fine, it leaks anyway\") are a huge remove-and-relay market.</p><ul><li><strong>Attachment:</strong> direct-nail on lower slopes and flat profiles; <strong>battens</strong> (horizontal, often counter-battened for drainage) on steeper slopes and barrel profiles; foam adhesive or storm clips in high-wind zones. Fastening schedules tighten with slope and wind exposure.</li><li><strong>Details:</strong> bird stops close the arches at eaves; ridge/hip trim tiles set on mortar or a modern adhesive/clip system; rake tiles or metal at edges; lead or flexible flashing dressed into the tile profile at penetrations.</li><li><strong>Valleys and flashings</strong> are wide-profile metal, and every pan must carry water <em>over</em> the underlayment laps below.</li></ul><div class='tip'>💡 <strong>Sales angle that's also true:</strong> in a remove-and-relay you're selling a new roof system that keeps the customer's irreplaceable clay — often the best value on the block.</div>"
        },
        {
          t: "Estimating tile work",
          min: 8,
          html: "<p>Tiles per square varies by profile — commonly 80–100 for S and flat concrete, more for small-format clay: take the count from the manufacturer's data sheet every time. Then:</p><ul><li>Trim tile by LF: ridge, hip, rake, plus bird stops by eave LF.</li><li>Battens (and counter-battens) by LF from course spacing; fasteners/clips/foam by schedule.</li><li>Premium underlayment package — often 15–20% of material cost by itself.</li><li><strong>Breakage allowance</strong> 2–5% for handling and foot traffic — and a pallet plan, because a full tile load is 8–10+ tons that must be spread on the roof, never point-loaded.</li><li>Labor 2–4× asphalt; mortar/foam work and cut-heavy hips add more.</li></ul>"
        }
      ],
      bank: [
        { cat: "Materials & weight", q: "Compared to asphalt (~250 lbs/sq), standard tile weighs roughly:", a: ["The same", "300 lbs/sq", "600–1,100+ lbs/sq", "100 lbs/sq"], correct: 2 },
        { cat: "Materials & weight", q: "Which is fired earth and essentially colorfast for a century?", a: ["Concrete tile", "Clay tile", "Fiber cement", "Composite tile"], correct: 1 },
        { cat: "Materials & weight", q: "Safe foot traffic on tile lands on:", a: ["The unsupported tile centers", "Headlaps/lower third or foam walk pads", "The field anywhere", "The ridge only"], correct: 1 },
        { cat: "System details", q: "In a tile roof, the primary waterproofing layer is:", a: ["The tile itself", "The underlayment", "The battens", "The ridge mortar"], correct: 1 },
        { cat: "System details", q: "Bird stops are installed to:", a: ["Ventilate the ridge", "Close the arched gaps at the eave course", "Hold gutters", "Anchor solar panels"], correct: 1 },
        { cat: "System details", q: "A 'remove and relay' job means:", a: ["New tile on old felt", "Lifting sound tile, replacing the underlayment, relaying the tile", "Rotating tiles 180°", "Painting the tile"], correct: 1 },
        { cat: "System details", q: "High-wind tile attachment uses:", a: ["Gravity only", "Foam adhesive, storm clips or enhanced fastening schedules", "Fewer nails", "Heavier mortar only"], correct: 1 },
        { cat: "Estimating tile", q: "Tiles-per-square should come from:", a: ["Memory", "The manufacturer's data sheet for that profile", "The supplier's guess", "An average of all profiles"], correct: 1 },
        { cat: "Estimating tile", q: "A reasonable tile breakage allowance is:", a: ["0%", "2–5%", "25%", "50%"], correct: 1 }
      ],
      gens: [
        {
          cat: "Estimating tile",
          gen: function (R) {
            var sq = R.int(18, 40);
            var lbs = R.pick([600, 800, 950, 1100]);
            var tons = Math.round(sq * lbs / 2000 * 10) / 10;
            return {
              q: "A " + sq + "-square tile roof at " + lbs.toLocaleString() + " lbs per square puts how much total load on the structure?",
              a: [tons + " tons", Math.round(tons / 2 * 10) / 10 + " tons", Math.round(tons * 2 * 10) / 10 + " tons", sq + " tons"],
              correct: 0
            };
          }
        }
      ]
    },

    /* ================= 7. SLATE ================= */
    {
      id: "slate",
      title: "Slate Roofing",
      tagline: "The century roof. Slate is stone — beautiful, brittle, heavy, and unforgiving of shortcuts or the wrong nail.",
      cats: ["Materials & grades", "Installation & repair", "Estimating slate"],
      lessons: [
        {
          t: "Reading slate: grades, sizes and lifespan",
          min: 8,
          html: "<p>Roofing slate is metamorphic stone split along natural cleavage planes. Quality varies by quarry: ASTM C406 grades slate <strong>S1 (75+ year expectancy)</strong>, S2 (40–75), and S3 (20–40). The famous S1 beds — Vermont/New York (greens, grays, purples, some \"unfading\"), Virginia Buckingham (blue-black), Pennsylvania (softer, many now exhausted) — outlast every fastener and flashing you put with them, which is exactly why details use copper and stainless.</p><p>Standard thickness is ~3/16\"–1/4\"; sizes run from 10\"×6\" to 24\"×14\". Weight: <strong>700–1,000+ lbs per square</strong> — same structural conversation as tile, stamped evaluation and all.</p>"
        },
        {
          t: "Hanging stone: installation and repair craft",
          min: 12,
          html: "<p>Slate hangs; it is never clamped:</p><ul><li>Each slate is punched or drilled for <strong>two nails</strong> — <strong>copper or stainless</strong>, driven so the head just touches the slate. Overdriven nails crack the stone now; underdriven heads puncture the slate above later. The slate should hang on its nails with a whisper of movement.</li><li><strong>Headlap is the waterproofing:</strong> standard 3\" at 8/12–20/12; 4\" on lower slopes, 2\" on very steep. Exposure = (length − headlap) ÷ 2.</li><li>Joints break by half a slate width course-to-course; open valleys and all flashings in 16–20 oz copper on serious work.</li><li><strong>Repairs:</strong> a slate ripper hooks and cuts the hidden nails; the replacement hangs on a copper slate hook or a nail-and-bib. Mismatched gray bar flashings across a slate field mark amateur repairs.</li><li><strong>Access:</strong> hook ladders, chicken ladders, staging — you walk the ladder, not the stone.</li></ul><div class='tip'>💡 <strong>Restoration reality:</strong> on a 90-year-old S1 roof, the slate is usually fine — failed fasteners and flashings are the problem. Selling \"restore and re-flash\" instead of \"tear off the best roof on the street\" is both honest and profitable.</div>"
        },
        {
          t: "Estimating slate",
          min: 6,
          html: "<p>Pieces per square comes from the size and exposure table (e.g., 18\"×10\" slates at 3\" headlap ≈ 192 pieces/square). Then: copper flashing package, copper/stainless nails (~2 lbs per square), snow retention where climate demands it, breakage allowance 3–5%, and labor at the top of the trade — a skilled two-person slate crew measures production in fractions of the squares-per-day an asphalt crew runs. New S1 slate is a premium-of-premium bid; salvage slate supports repair work and blend-in additions.</p>"
        }
      ],
      bank: [
        { cat: "Materials & grades", q: "ASTM S1 grade slate carries a service-life expectancy of:", a: ["10 years", "20–40 years", "75+ years", "5 years"], correct: 2 },
        { cat: "Materials & grades", q: "Slate roof details use copper and stainless because:", a: ["They're cheaper", "The stone outlives ordinary fasteners and flashings", "Code bans aluminum everywhere", "Color matching"], correct: 1 },
        { cat: "Installation & repair", q: "Slate should be fastened:", a: ["Driven tight to clamp the stone", "Hung on its two nails with the head just touching", "With adhesive only", "With one nail centered"], correct: 1 },
        { cat: "Installation & repair", q: "What primarily keeps water out of a slate roof?", a: ["Caulk", "Headlap", "Paint", "Mortar"], correct: 1 },
        { cat: "Installation & repair", q: "The tool that removes a broken slate's hidden nails is a:", a: ["Slate ripper", "Cat's paw", "Roofing hatchet", "Seamer"], correct: 0 },
        { cat: "Installation & repair", q: "On very old S1 slate roofs, the usual failure is:", a: ["The stone itself", "Fasteners and flashings wearing out before the slate", "The rafters", "The paint"], correct: 1 },
        { cat: "Estimating slate", q: "Slate exposure is calculated as:", a: ["Length ÷ 2", "(Length − headlap) ÷ 2", "Width × 2", "Headlap × 3"], correct: 1 },
        { cat: "Estimating slate", q: "A reasonable slate breakage allowance is:", a: ["0%", "3–5%", "20%", "40%"], correct: 1 }
      ],
      gens: [
        {
          cat: "Estimating slate",
          gen: function (R) {
            var len = R.pick([16, 18, 20, 22, 24]);
            var lap = R.pick([3, 4]);
            var exp = (len - lap) / 2;
            return {
              q: "A " + len + "\" slate installed with " + lap + "\" headlap runs what exposure?",
              a: [exp + "\"", (len / 2) + "\"", (exp + 1) + "\"", lap + "\""],
              correct: 0
            };
          }
        }
      ]
    },

    /* ================= 8. METAL ================= */
    {
      id: "metal",
      title: "Metal Roofing",
      tagline: "From ag panels to architectural standing seam — the fastest-growing steep-slope category, where every detail is about thermal movement.",
      cats: ["Panel systems & materials", "Details & movement", "Estimating metal"],
      lessons: [
        {
          t: "Panel systems and metals",
          min: 12,
          html: "<p><strong>Exposed-fastener panels</strong> (corrugated, R/PBR, 5V-crimp, ag panel): screwed through the face with gasketed screws into purlins or deck. Economical and fast — but several hundred gasketed holes per roof, each a future maintenance point as washers age. Common on barns, shops, budget residential.</p><p><strong>Standing seam</strong>: vertical ribs with <strong>concealed clips</strong>; panels attach with no holes through the weather surface and can move with temperature. Two families: <strong>snap-lock</strong> (panels click together — faster, needs more slope) and <strong>mechanically seamed</strong> (a seamer folds the ribs closed — the low-slope and high-performance choice, down to 1/2:12 in some double-lock specs). Architectural roofs, metal-over-solid-deck residential, commercial.</p><p><strong>Metal shingles and stone-coated steel</strong> mimic shake/tile/slate at ~1.5 lbs/sq ft — a favorite for weight-restricted re-roofs.</p><p><strong>Metals:</strong> Galvalume/galvanized steel in 29–24 ga (lower gauge = thicker = better); aluminum for coastal salt; copper and zinc for premium longevity. <strong>Finishes:</strong> PVDF/Kynar paint systems hold color and chalk resistance far longer than polyester (SMP) — spec the finish, not just the color.</p>"
        },
        {
          t: "Movement, corrosion and the details that fail",
          min: 12,
          html: "<p>A 40' steel panel can move roughly 1/2\" through a seasonal temperature swing. Every detail must let it:</p><ul><li>Clips or slotted holes let panels float; fix the panel at one point (usually eave or ridge) and let the other end travel.</li><li>Ridge, hip and eave closures (foam or metal Z's) seal the rib openings while allowing slide.</li><li><strong>Sealants:</strong> butyl tape in laps — it stays elastic and hidden. Exposed caulk beads on a metal roof are a two-year fix and a ten-year callback.</li><li><strong>Oil-canning</strong> — visible waviness in wide flat pans — is controlled with striations/ribbing, heavier gauge, and a flat deck; tell the customer about it up front, because light at a low angle will find it.</li><li><strong>Dissimilar metals:</strong> copper runoff destroys steel and aluminum; treated lumber eats aluminum; walk the galvanic series before mixing. Even graphite pencil marks can etch bare Galvalume.</li><li>Underlayment: high-temp synthetic or high-temp self-adhered — panel temperatures cook standard membranes.</li></ul><div class='tip'>💡 <strong>Screw discipline on exposed-fastener roofs:</strong> driven straight and snug — a tilted or overdriven screw dimples the panel and splays the washer, and that's the leak. Budget a 10–15 year screw re-tighten/replace visit into the customer's maintenance plan (and your service pipeline).</div>"
        },
        {
          t: "Estimating metal roofs",
          min: 10,
          html: "<p>Panels are ordered <strong>cut to length</strong> — takeoff is by run, not by square:</p><ul><li><strong>Panel count per plane</strong> = eave length ÷ panel coverage width (commonly 12\", 16\", 18\", 24\", 36\"). Panel length = eave-to-ridge dimension plus overhang.</li><li><strong>Trim is its own takeoff:</strong> ridge, hip, rake/gable, eave/drip, sidewall, endwall, valley, and transitions — each by LF with the profile drawing.</li><li>Fasteners/clips by schedule (exposed-fastener: ~80 screws per square as a sanity check); butyl tape by lap LF; closures at every rib termination.</li><li>Waste is low in the field (panels come cut) but hips and valleys generate real offcut — diagonal cuts on a hip roof can push metal waste past 15%.</li><li>Labor: standing seam details (hand-folded pans, seamed hips) are skilled-hours-heavy; price the details, not the field.</li></ul>"
        }
      ],
      bank: [
        { cat: "Panel systems & materials", q: "Standing seam's key advantage over exposed-fastener panels:", a: ["Cheaper", "Concealed fasteners plus designed-in thermal movement", "No underlayment needed", "Lighter gauge"], correct: 1 },
        { cat: "Panel systems & materials", q: "Mechanically seamed (double-lock) standing seam matters because it:", a: ["Looks shinier", "Performs on the lowest slopes metal can serve", "Uses no clips", "Is the cheapest system"], correct: 1 },
        { cat: "Panel systems & materials", q: "In steel gauge numbers:", a: ["Higher gauge = thicker metal", "Lower gauge = thicker metal", "Gauge is the paint thickness", "Gauge is the panel width"], correct: 1 },
        { cat: "Panel systems & materials", q: "The premium paint system for metal roofing is:", a: ["Polyester (SMP)", "PVDF (Kynar)", "Powder coat", "Primer only"], correct: 1 },
        { cat: "Details & movement", q: "Oil-canning refers to:", a: ["Lubricating seams", "Visible waviness in the flat areas of panels", "A rust pattern", "A seaming tool"], correct: 1 },
        { cat: "Details & movement", q: "Copper runoff onto a steel roof causes:", a: ["Nothing", "Galvanic corrosion of the steel", "Better grounding", "A protective patina"], correct: 1 },
        { cat: "Details & movement", q: "The right sealant strategy on metal laps is:", a: ["Exposed caulk beads", "Concealed butyl tape in the lap", "Silicone smears", "None ever"], correct: 1 },
        { cat: "Details & movement", q: "Under metal panels, the underlayment should be:", a: ["Standard felt", "High-temperature rated synthetic or self-adhered", "Rosin paper", "None"], correct: 1 },
        { cat: "Estimating metal", q: "Panel quantity for a roof plane is figured by:", a: ["Total area ÷ 32", "Eave length ÷ panel coverage width", "Ridge length × 2", "Squares × 3"], correct: 1 },
        { cat: "Estimating metal", q: "Metal trim (ridge, rake, eave, valley) is estimated:", a: ["It comes free with panels", "As its own lineal-foot takeoff per profile", "By the square", "By weight only"], correct: 1 }
      ],
      gens: [
        {
          cat: "Estimating metal",
          gen: function (R) {
            var w = R.pick([[12, '12"'], [16, '16"'], [18, '18"'], [24, '24"']]);
            var eave = R.int(30, 90);
            var panels = Math.ceil(eave * 12 / w[0]);
            return {
              q: "A roof plane has a " + eave + "' eave. Using " + w[1] + "-coverage standing seam panels, how many panels does the plane take (round up)?",
              a: [panels + " panels", (panels - 3) + " panels", (panels + 3) + " panels", (panels + 10) + " panels"],
              correct: 0
            };
          }
        }
      ]
    },

    /* ================= 9. LOW SLOPE ================= */
    {
      id: "lowslope",
      title: "Low-Slope: BUR, Mod-Bit & Roll Roofing",
      tagline: "When the roof goes flat the rules change: continuous membranes, laps, drainage — and fire discipline on every torch job.",
      cats: ["Built-up roofing", "Mod-bit & roll roofing", "Drainage & safety"],
      lessons: [
        {
          t: "Built-up roofing: the original membrane",
          min: 10,
          html: "<p>A <strong>built-up roof (BUR)</strong> is site-built waterproofing: alternating plies of reinforcing felt and hot bitumen — \"three-ply\" and \"four-ply\" describe exactly that — finished with flood coat and gravel, a mineral cap sheet, or a reflective coating. The redundancy is the appeal: four plies means four chances to stop water.</p><p>The work is its own trade: kettle temperatures around 450–500°F, moppers and felt-layers in rhythm, EVT (equiviscous temperature) discipline so plies actually bond. Estimating: felt by squares <em>per ply</em>, bitumen at roughly 20–25 lbs per square per mopping plus the flood coat (~60 lbs), gravel ~400 lbs/sq, insulation, cants at every wall, and edge metal. Kettle work also carries real insurance and safety overhead — price it in.</p><p>You'll meet BUR mostly in repair, restoration and tear-off decisions on older commercial stock — knowing how it's built tells you what you're cutting into.</p>"
        },
        {
          t: "Modified bitumen and roll roofing",
          min: 12,
          html: "<p><strong>Modified bitumen</strong> is factory-built BUR: asphalt blended with polymers, reinforced, rolled at ~1 square of net coverage per roll.</p><ul><li><strong>APP</strong> (plastic-modified): torch-applied — the flame melts the underside into the substrate.</li><li><strong>SBS</strong> (rubber-modified): the flexible one — torch, hot mop, cold-process adhesive, or <strong>self-adhered</strong> (the residential-friendly, flame-free option over porches and low garages).</li></ul><p>Systems run base sheet + granulated cap; laps 3–4\" side, 6\" end, staggered; granules pressed into the bleed-out at seams for UV cover. <strong>Torch safety is non-negotiable:</strong> hot-work permit where required, charged extinguishers on deck, never torch directly on wood decks or into concealed cavities (torch-to-base-sheet, not torch-to-deck), and a <strong>minimum 1-hour fire watch after the last flame</strong> — smoldering starts in hidden cavities are how roofing companies end.</p><p><strong>Mineral-surfaced roll roofing</strong> (90-lb) remains the budget answer on sheds and outbuildings: single- or double-coverage, 2\"–4\" laps cemented and nailed. Short life (8–12 years), low cost, honest product when sold as exactly that.</p>"
        },
        {
          t: "Drainage: the flat-roof estimator's first question",
          min: 8,
          html: "<p>\"Flat\" must still drain — design slope is <strong>1/4\" per foot minimum</strong>. Standing water 48 hours after rain is <strong>ponding</strong>: it magnifies UV attack, doubles down on any seam flaw, breeds vegetation, and voids many warranties.</p><ul><li>Fix ponding with <strong>tapered insulation</strong> packages, <strong>crickets</strong> between drains and behind curbs, or added drains/scuppers — that's estimating work: tapered layouts come with their own shop drawings and per-square-foot pricing.</li><li>Every low-slope bid should count drains, scuppers, overflow provisions and their condition — a perfect membrane draining to a clogged, rusted drain bowl is a warranty claim on schedule.</li><li>Walk the deck after core cuts on re-covers: wet insulation stays wet under a new membrane. Infrared or moisture scans pay for themselves on big re-covers.</li></ul>"
        }
      ],
      bank: [
        { cat: "Built-up roofing", q: "A built-up roof is made of:", a: ["One thick membrane", "Alternating plies of reinforcing felt and bitumen", "Metal panels", "Interlocking tiles"], correct: 1 },
        { cat: "Built-up roofing", q: "\"Four-ply BUR\" refers to:", a: ["Four coats of paint", "Four alternating felt/bitumen layers of redundancy", "Four inches of gravel", "Four drains"], correct: 1 },
        { cat: "Built-up roofing", q: "BUR bitumen quantity is estimated at roughly:", a: ["2 lbs/sq per mopping", "20–25 lbs/sq per mopping plus the flood coat", "100 lbs/sq per mopping", "None — it's self-adhered"], correct: 1 },
        { cat: "Mod-bit & roll roofing", q: "APP modified bitumen is typically applied by:", a: ["Nails only", "Torch", "Staples", "Clips"], correct: 1 },
        { cat: "Mod-bit & roll roofing", q: "The flame-free mod-bit option suited to residential porches is:", a: ["APP torch", "Self-adhered SBS", "Hot-mopped BUR", "Coal tar"], correct: 1 },
        { cat: "Mod-bit & roll roofing", q: "After torch work stops, the crew must:", a: ["Leave immediately", "Maintain a fire watch (minimum ~1 hour)", "Hose the roof", "Remove all flashing"], correct: 1 },
        { cat: "Mod-bit & roll roofing", q: "Mineral-surfaced 90-lb roll roofing is honestly sold as:", a: ["A 40-year system", "A budget 8–12 year cover for sheds and outbuildings", "A slate substitute", "A commercial standard"], correct: 1 },
        { cat: "Drainage & safety", q: "Ponding water is defined as water standing:", a: ["During rain", "48 hours after rain", "10 minutes after rain", "In the gutters"], correct: 1 },
        { cat: "Drainage & safety", q: "Minimum design slope for 'flat' roofs is:", a: ["Zero", "1/4\" per foot", "2\" per foot", "4/12"], correct: 1 },
        { cat: "Drainage & safety", q: "Ponding is corrected with:", a: ["Thicker gravel", "Tapered insulation, crickets, or added drains/scuppers", "More sealant", "Paint"], correct: 1 }
      ],
      gens: [
        {
          cat: "Mod-bit & roll roofing",
          gen: function (R) {
            var sq = R.int(12, 45);
            var waste = R.pick([8, 10, 12]);
            var rolls = Math.ceil(sq * (1 + waste / 100)) * 2;
            return {
              q: "A two-layer mod-bit system (base + cap, each ~1 square net per roll) over " + sq + " squares with " + waste + "% for laps/waste. Total rolls (round up)?",
              a: [rolls + " rolls", sq * 2 + " rolls", (rolls / 2) + " rolls", (rolls + 15) + " rolls"],
              correct: 0
            };
          }
        }
      ]
    },

    /* ================= 10. SINGLE PLY ================= */
    {
      id: "singleply",
      title: "Single-Ply Membranes & Coatings",
      tagline: "TPO, PVC and EPDM own modern commercial roofing; fluid-applied coatings extend aging roofs — and both feed a service business.",
      cats: ["Membrane systems", "Attachment & seams", "Coatings & restoration"],
      lessons: [
        {
          t: "EPDM, TPO and PVC: choosing among the big three",
          min: 12,
          html: "<p><strong>EPDM</strong> — black synthetic rubber, 45–90 mil, decades of field history. Seams rely on tape/adhesive chemistry and clean priming; black absorbs heat (white EPDM exists at a premium). The forgiving, proven choice, big in re-cover and ballasted work.</p><p><strong>TPO</strong> — white thermoplastic polyolefin, 45–80 mil, <strong>hot-air welded seams</strong> that fuse into monolithic plastic. Today's commercial volume leader: reflective (cooling-cost story), competitive price. Quality varies by mil thickness <em>over scrim</em> and by welder skill — a cold weld looks fine and peels in year three.</p><p><strong>PVC</strong> — the original weldable thermoplastic; superior chemical and <strong>grease resistance</strong> (restaurants, food plants), excellent weldability, premium price. Keep PVC and TPO accessories separate — the two plastics don't weld to each other.</p><p>Membrane choice in one line: EPDM for proven simplicity, TPO for reflective value, PVC for chemistry and grease.</p>"
        },
        {
          t: "Attachment methods and seam quality control",
          min: 10,
          html: "<p>Three ways to hold a membrane down:</p><ul><li><strong>Fully adhered:</strong> bonded to insulation/deck — cleanest look, best wind uplift on the field, priciest.</li><li><strong>Mechanically attached:</strong> screws and plates in the seam rows — fastest and cheapest; the membrane flutters in wind between rows.</li><li><strong>Ballasted:</strong> loose-laid EPDM under river rock or pavers — needs structure for the weight and stays out of hail/wind-borne-debris zones.</li></ul><p><strong>Seams are the roof.</strong> Welded systems get test welds each morning (temperature, speed, pressure change with the weather), a seam probe on every cooled seam, and periodic destructive test cuts patched properly. Details — inside/outside corners, pipe boots, T-joint patches, terminations at walls and edge metal — separate a 20-year roof from a 5-year callback machine. Wind design (corner/perimeter enhancement) comes from the uplift calcs, not habit.</p>"
        },
        {
          t: "Coatings and restoration: the service-revenue play",
          min: 10,
          html: "<p>Fluid-applied restoration puts a new weather surface on a sound old roof at a fraction of replacement cost:</p><ul><li><strong>Silicone:</strong> the ponding-water champion; single-coat-capable, but recoat-only-with-silicone thereafter, and slick when wet.</li><li><strong>Acrylic:</strong> economical, easy, reflective — wants positive drainage and dry-weather cure windows.</li><li><strong>Urethane:</strong> toughest traffic/impact resistance, common as a base with silicone or acrylic top.</li></ul><p>The workflow is non-negotiable: clean (usually pressure-wash), repair wet insulation and failed seams first, treat rust, reinforce seams and details with fabric or mastic, verify adhesion with test patches, then apply to the specified <strong>dry-film thickness</strong> — coverage runs in gallons per square at spec mils, and skimping mils is the classic coating failure.</p><div class='tip'>💡 <strong>Business model:</strong> coating jobs convert into maintenance agreements — annual inspection, minor repairs, scheduled recoat. Recurring revenue smooths the storm-cycle rollercoaster.</div>"
        }
      ],
      bank: [
        { cat: "Membrane systems", q: "Which membrane is heat-welded and known for grease/chemical resistance?", a: ["EPDM", "PVC", "90-lb roll roofing", "BUR"], correct: 1 },
        { cat: "Membrane systems", q: "EPDM seams are joined by:", a: ["Hot-air welding", "Seam tape/adhesive over primed rubber", "Torching", "Soldering"], correct: 1 },
        { cat: "Membrane systems", q: "TPO membrane quality is judged partly by:", a: ["Color brightness", "Mil thickness over the scrim (reinforcement)", "Roll width only", "Smell"], correct: 1 },
        { cat: "Membrane systems", q: "TPO and PVC accessories:", a: ["Weld to each other fine", "Don't weld to each other — keep the systems separate", "Are identical products", "Both require torches"], correct: 1 },
        { cat: "Attachment & seams", q: "A mechanically attached membrane is held by:", a: ["Glue over 100% of the deck", "Screws and plates in the seam rows", "River rock ballast", "Suction"], correct: 1 },
        { cat: "Attachment & seams", q: "Morning test welds exist because:", a: ["The crew needs practice", "Weld settings change with temperature and weather", "The membrane is cheaper then", "Inspectors require coffee breaks"], correct: 1 },
        { cat: "Attachment & seams", q: "A ballasted EPDM roof requires:", a: ["Nothing special", "Structure verified for the rock/paver weight", "Torch permits", "Steep slope"], correct: 1 },
        { cat: "Coatings & restoration", q: "The best coating chemistry for ponding-water areas:", a: ["Acrylic", "Silicone", "Latex paint", "Linseed oil"], correct: 1 },
        { cat: "Coatings & restoration", q: "The classic coating failure is:", a: ["Too many coats", "Under-applying the specified dry-film thickness", "Cleaning too well", "Using fabric at seams"], correct: 1 },
        { cat: "Coatings & restoration", q: "Before any coating goes down you must:", a: ["Just spray it", "Clean, repair, reinforce seams and verify adhesion with test patches", "Remove all flashing", "Add gravel"], correct: 1 }
      ],
      gens: [
        {
          cat: "Coatings & restoration",
          gen: function (R) {
            var sq = R.int(30, 120);
            var rate = R.pick([1.5, 2, 2.5]);
            var gals = Math.ceil(sq * rate);
            return {
              q: "A silicone spec calls for " + rate + " gallons per square at final dry-film thickness. For a " + sq + "-square roof, how many gallons (round up)?",
              a: [gals + " gallons", Math.ceil(gals / 2) + " gallons", (gals + 15) + " gallons", (gals + 40) + " gallons"],
              correct: 0
            };
          }
        }
      ]
    },

    /* ================= 11. FLASHING/VENT/GUTTERS ================= */
    {
      id: "flashing",
      title: "Flashing, Ventilation & Gutters",
      tagline: "Roofs rarely leak in the field — they leak at the details. This is where reputations (and callback budgets) are made.",
      cats: ["Flashing details", "Attic ventilation", "Gutters & drainage"],
      lessons: [
        {
          t: "Flashing: metal beats caulk, every time",
          min: 14,
          html: "<p>Caulk is a gasket, not a water strategy. Flashing is shaped metal that <em>laps</em> water downhill. The details every roof estimate must account for:</p><ul><li><strong>Drip edge</strong> at eaves and rakes — kicks water off the deck edge into the gutter, protects the fascia.</li><li><strong>Step flashing</strong> where shingles meet a sloped wall: one L-shaped piece <em>per course</em>, woven in, each lapping the one below. One continuous bent strip is not step flashing — it's a leak with extra steps.</li><li><strong>Counterflashing</strong> covers the top of step/base flashing: let into a masonry reglet or behind siding/housewrap so water can't get behind the assembly.</li><li><strong>Valley treatment:</strong> open metal (W-profile with center rib, hemmed edges) for longevity and debris shedding; closed-cut for production asphalt work; membrane-lined beneath either.</li><li><strong>Chimneys:</strong> base flashing low side, step flashing up the sides, and a <strong>cricket/saddle</strong> on the high side of any chimney wider than ~24\" to split the water. Counterflash the whole assembly.</li><li><strong>Penetrations:</strong> pipe boots (the sun-rotted neoprene boot is America's most common roof leak — upgrade to silicone or metal-collar versions), vent flashings shingled in top-over-bottom.</li></ul><p><strong>Reuse of old flashing is false economy</strong> — a new roof plumbed into 25-year-old bent metal inherits 25-year-old leaks. Replace it with the roof.</p>"
        },
        {
          t: "Attic ventilation: the roof's climate control",
          min: 10,
          html: "<p>A vented attic flushes heat in summer (cooler shingles, longer life, lower cooling bills) and moisture in winter (no condensation rot, fewer ice dams). The code baseline: <strong>1 sq ft of net free vent area (NFA) per 150 sq ft of attic floor</strong> — improved to 1/300 with a balanced system (about half the vent area high, half low) and a ceiling vapor retarder where required.</p><ul><li><strong>Balanced means intake AND exhaust:</strong> soffit vents low bringing air in, ridge vent (or box vents) high letting it out. Exhaust without intake just pulls conditioned air — or rain — through whatever gap it can find.</li><li><strong>Never mix exhaust types</strong> on one attic: a power fan or turbine near a ridge vent short-circuits the airflow, pulling air (and weather) in through the ridge instead of the soffits.</li><li>Verify soffit vents aren't painted shut or insulation-blocked — baffles at the eaves keep the intake path open.</li><li>Convert NFA math to product: each vent style publishes NFA per unit or per lineal foot (ridge vent commonly ~18 sq in/LF).</li></ul><div class='tip'>💡 <strong>Warranty leverage:</strong> shingle manufacturers can prorate or deny claims on under-ventilated attics. Documenting the ventilation fix in your proposal protects the customer's warranty — and upsells honestly.</div>"
        },
        {
          t: "Gutters and getting water away from the building",
          min: 8,
          html: "<p>The roof's job ends only when water is away from the foundation:</p><ul><li><strong>Sizing:</strong> 5\" K-style handles most homes; 6\" for big/steep roofs and high-intensity rain regions; half-round for historic looks; box gutters on commercial.</li><li><strong>Slope</strong> runs toward downspouts at about 1/16\"–1/8\" per foot — visually level, functionally pitched.</li><li><strong>Downspouts:</strong> one 2\"×3\" per ~600 sq ft of roof served (3\"×4\" ≈ 1,200 sq ft); extensions/leaders discharging 4'+ from the foundation.</li><li><strong>Hangers</strong> every 24\"–36\" (closer in snow country); hidden hangers with screws over spikes.</li><li>Estimate by LF of gutter + downspout, plus elbows, miters (inside/outside corners), end caps, outlets and guards. Seamless machine-run aluminum priced per LF is the residential standard.</li></ul>"
        }
      ],
      bank: [
        { cat: "Flashing details", q: "Along a sloped wall, shingles get:", a: ["One long bent strip", "Step flashing — one piece woven into each course", "Caulk only", "No flashing"], correct: 1 },
        { cat: "Flashing details", q: "Counterflashing's job is to:", a: ["Replace step flashing", "Cover the top edge of base/step flashing so water can't get behind it", "Hold the gutter", "Ventilate the ridge"], correct: 1 },
        { cat: "Flashing details", q: "A cricket (saddle) is built:", a: ["At the eave", "On the high side of a wide chimney to split water flow", "Inside the attic", "Under downspouts"], correct: 1 },
        { cat: "Flashing details", q: "America's most common small roof leak is:", a: ["The ridge cap", "The sun-rotted neoprene pipe boot", "The drip edge", "The gable trim"], correct: 1 },
        { cat: "Flashing details", q: "Reusing old flashing on a new roof is:", a: ["Standard practice", "False economy — it inherits the old leaks", "Required by code", "Cheaper and better"], correct: 1 },
        { cat: "Attic ventilation", q: "The common code baseline for attic ventilation is:", a: ["1/50", "1 sq ft NFA per 150 sq ft of attic (1/300 balanced with vapor retarder)", "1/1000", "No requirement"], correct: 1 },
        { cat: "Attic ventilation", q: "Balanced ventilation pairs:", a: ["Two exhaust types", "Soffit intake low with ridge exhaust high", "Fans with turbines", "No intake, all exhaust"], correct: 1 },
        { cat: "Attic ventilation", q: "Mixing a power fan with a ridge vent on one attic:", a: ["Doubles airflow", "Short-circuits airflow and can pull weather in through the ridge", "Is code-required", "Saves energy"], correct: 1 },
        { cat: "Gutters & drainage", q: "Gutter slope toward downspouts should be about:", a: ["Dead level", "1/16\"–1/8\" per foot", "1\" per foot", "Sloped away from downspouts"], correct: 1 },
        { cat: "Gutters & drainage", q: "A 2\"×3\" downspout serves roughly:", a: ["100 sq ft of roof", "600 sq ft of roof", "5,000 sq ft of roof", "Unlimited area"], correct: 1 }
      ],
      gens: [
        {
          cat: "Attic ventilation",
          gen: function (R) {
            var attic = R.int(12, 30) * 100;
            var nfa = Math.round(attic / 150 * 144);
            return {
              q: "An attic floor measures " + attic.toLocaleString() + " sq ft. At the 1/150 baseline, how much net free vent area is required (in square inches)?",
              a: [nfa.toLocaleString() + " sq in", Math.round(nfa / 2).toLocaleString() + " sq in", (attic).toLocaleString() + " sq in", Math.round(nfa * 2).toLocaleString() + " sq in"],
              correct: 0
            };
          }
        },
        {
          cat: "Gutters & drainage",
          gen: function (R) {
            var area = R.int(18, 42) * 100;
            var ds = Math.ceil(area / 600);
            return {
              q: "A roof drains " + area.toLocaleString() + " sq ft to its gutters. Using 2\"×3\" downspouts at one per ~600 sq ft, how many downspouts minimum?",
              a: [ds + " downspouts", Math.max(1, ds - 2) + " downspouts", (ds + 4) + " downspouts", "1 downspout"],
              correct: 0
            };
          }
        }
      ]
    },

    /* ================= 12. ESTIMATING ================= */
    {
      id: "estimating",
      title: "Estimating, Overhead & Bidding to Win",
      tagline: "The capstone: turning takeoffs into profitable bids. Costs are facts; price is strategy — and overhead is not profit.",
      cats: ["Direct costs & labor", "Overhead & profit", "Bidding strategy"],
      lessons: [
        {
          t: "Direct costs: materials, labor, equipment",
          min: 15,
          html: "<p>A complete estimate stacks five layers of <strong>direct cost</strong> before a dollar of markup:</p><ol><li><strong>Materials</strong> — from the takeoff, with waste, accessories (the starter/caps/disposal trio), and sales tax. Lock supplier pricing in writing; asphalt and panel prices move.</li><li><strong>Labor</strong> — crew-hours × the <strong>loaded rate</strong>: base wage + payroll taxes + workers' comp (a major number in roofing) + benefits. A $25/hr roofer costs $34–40/hr loaded before he picks up a nail gun.</li><li><strong>Equipment</strong> — dumpsters, boom/crane time, kettles, lifts, compressors, harness/staging gear amortized over jobs.</li><li><strong>Subcontractors</strong> — gutters, HVAC disconnects, electrical for fans — with their scope in writing.</li><li><strong>Job-specific costs</strong> — permits, disposal tonnage, travel, steep/high charges, tarps and landscaping protection, portable toilet on bigger jobs.</li></ol><p><strong>Productivity is the heart of labor pricing:</strong> squares per crew-day by material, pitch, stories and cut-up factor. Track actuals on every single job — a job-cost review each Friday builds a database no estimating book can match, because it's <em>your</em> crews on <em>your</em> market's houses.</p>"
        },
        {
          t: "Overhead and profit: the numbers that keep the doors open",
          min: 12,
          html: "<p><strong>Overhead is not profit.</strong> Overhead is every cost of existing that no single job creates: office/shop rent, truck payments and fuel, liability insurance, phones and software, advertising, estimating time (including all the bids you lose), the bookkeeper, and <em>your own salary</em>. Total it annually, divide by expected annual direct-cost volume, and you get your overhead percentage — for many roofing companies, <strong>15–30% on direct costs</strong>.</p><p><strong>Profit</strong> is what remains after ALL costs, direct and overhead. It's the company's reward for risk — warranty reserve, slow-season cash, growth capital. Pricing formula:</p><p style='text-align:center'><strong>Price = Direct Cost × (1 + Overhead%) × (1 + Profit%)</strong></p><p>Example: $10,000 direct × 1.25 overhead × 1.10 profit = <strong>$13,750</strong>. Skip the overhead layer and that \"10% profit\" job actually loses money — the office still got paid, just out of your pocket.</p><p><strong>Discount math nobody survives ignoring:</strong> at a 10% net margin, a \"small\" 5% discount hands away <em>half the profit</em>. Know your break-even to the dollar before you negotiate a nickel.</p>"
        },
        {
          t: "Bidding strategy and the contract that protects you",
          min: 12,
          html: "<p>Winning work is a system, not a mood:</p><ul><li><strong>Qualify before you bid:</strong> decision-maker identified, budget reality checked, timeline honest. The wrong customer at the right price is still a loss.</li><li><strong>Track your bid-hit ratio</strong> by job type and lead source. Winning nearly everything means you're underpriced; winning nothing means you're mis-targeted or over-market. Healthy ratios often land in the 25–40% range on qualified residential leads.</li><li><strong>Scope in writing:</strong> exactly what's included; exactly what's excluded; unit prices for hidden conditions (decking per sheet, fascia per LF); brand/color/warranty specifics; payment schedule tied to milestones; change-order procedure. \"Turn your estimate into a bid, and your bid into a contract\" — verbal agreements roof nothing.</li><li><strong>Present value, not just price:</strong> ventilation fixes, ice-dam protection, workmanship warranty, photos of your flashing details. When you're never the cheapest, you need to be the clearest.</li><li><strong>Insurance/storm work:</strong> scope from the adjuster's estimate line-for-line, supplement legitimately with documentation, and keep the homeowner informed — trust is the entire storm business.</li></ul><div class='tip'>💡 <strong>The Friday habit:</strong> job-cost every completed job against its estimate — materials, hours, dump fees. Twenty minutes a week turns every roof into tuition for the next hundred bids.</div>"
        }
      ],
      bank: [
        { cat: "Direct costs & labor", q: "A 'loaded' labor rate includes:", a: ["Base wage only", "Wage plus payroll taxes, workers' comp and benefits", "Wage plus profit", "Overtime only"], correct: 1 },
        { cat: "Direct costs & labor", q: "The most valuable productivity data comes from:", a: ["National estimating books", "Job-costing your own crews on every job", "Supplier salesmen", "Competitors' rumors"], correct: 1 },
        { cat: "Direct costs & labor", q: "Which belongs in job-specific direct costs?", a: ["Office rent", "Permits, disposal tonnage and steep charges for this job", "Your salary", "The bookkeeper"], correct: 1 },
        { cat: "Overhead & profit", q: "In pricing a job, overhead is best defined as:", a: ["The same as profit", "The indirect cost of running the business, recovered on every job", "Only office rent", "Optional on small jobs"], correct: 1 },
        { cat: "Overhead & profit", q: "Which of these is OVERHEAD, not a direct job cost?", a: ["Shingles", "Advertising and estimating time", "The job's dumpster", "This job's permit"], correct: 1 },
        { cat: "Overhead & profit", q: "At a 10% net margin, a 5% discount gives away:", a: ["5% of profit", "Nothing", "About half your profit", "Only overhead"], correct: 2 },
        { cat: "Overhead & profit", q: "The pricing formula is:", a: ["Price = cost + gut feel", "Price = direct cost × (1 + OH%) × (1 + profit%)", "Price = competitor's bid − $500", "Price = materials × 2 always"], correct: 1 },
        { cat: "Bidding strategy", q: "Hidden conditions like rotten decking are best handled by:", a: ["Eating the cost", "Verbal promises", "Unit prices written into the contract", "Ignoring them"], correct: 2 },
        { cat: "Bidding strategy", q: "Winning nearly every bid you submit usually means:", a: ["Great salesmanship", "Your prices are too low", "The market is hot", "Your overhead is zero"], correct: 1 },
        { cat: "Bidding strategy", q: "A healthy close ratio on qualified residential leads often falls around:", a: ["100%", "25–40%", "1–2%", "90%"], correct: 1 }
      ],
      gens: [
        {
          cat: "Overhead & profit",
          gen: function (R) {
            var dc = R.int(8, 24) * 1000;
            var oh = R.pick([20, 25, 30]);
            var pf = R.pick([8, 10, 12]);
            var price = Math.round(dc * (1 + oh / 100) * (1 + pf / 100));
            return {
              q: "Direct costs are $" + dc.toLocaleString() + ". Overhead is " + oh + "% and target profit is " + pf + "%. Using Price = DC × (1+OH) × (1+P), the bid price is about:",
              a: ["$" + price.toLocaleString(), "$" + Math.round(dc * (1 + (oh + pf) / 100)).toLocaleString(), "$" + Math.round(dc * (1 + pf / 100)).toLocaleString(), "$" + Math.round(dc * 2).toLocaleString()],
              correct: 0
            };
          }
        },
        {
          cat: "Direct costs & labor",
          gen: function (R) {
            var wage = R.pick([22, 25, 28, 30]);
            var burden = R.pick([35, 40, 45]);
            var loaded = Math.round(wage * (1 + burden / 100) * 100) / 100;
            return {
              q: "A roofer earns $" + wage + "/hr and your labor burden (taxes, comp, benefits) is " + burden + "%. The loaded rate you must estimate with is:",
              a: ["$" + loaded.toFixed(2) + "/hr", "$" + wage.toFixed(2) + "/hr", "$" + (wage + 5).toFixed(2) + "/hr", "$" + (wage * 2).toFixed(2) + "/hr"],
              correct: 0
            };
          }
        }
      ]
    }
  ]
};
