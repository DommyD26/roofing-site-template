/* Reading assignments (mapped to the book's table of contents) and
   end-of-lesson recaps: Summary · Key Points · Remember · Tips & Tricks.
   Reading references point students to the full text in the book —
   the course summarizes; the book is the master reference. */

window.COURSE_READING = {
  measuring: { ref: "Book Chapter 1 — Measuring and Calculating Roofs (pp. 1–22), plus Appendix A (Roof-Slope Factors, p. 430) and Appendix B (Valley Length Factors, p. 431)" },
  sheathing: { ref: "Book Chapter 2 — Roof Sheathing and Decking (pp. 23–34)" },
  underlayment: { ref: "Book Chapter 3 — Underlayment (pp. 35–70)" },
  asphalt: { ref: "Book Chapter 4 — Asphalt Shingles (pp. ~71–120)" },
  wood: { ref: "Book Chapter 6 — Wood Shingles and Shakes (pp. ~149–187)" },
  tile: { ref: "Book Chapter 7 — Tile Roofing (pp. ~188–219)" },
  slate: { ref: "Book Chapter 8 — Slate Roofing (pp. ~220–244)" },
  metal: { ref: "Book Chapter 9 — Metal Roofing and Siding (pp. 245–276)" },
  lowslope: { ref: "Book Chapter 5 — Mineral-Surfaced Roll Roofing (pp. ~121–148) and Chapter 10 — Built-Up Roofing (pp. 277–318)" },
  singleply: { ref: "Book Chapter 11 — Elastomeric Roofing (pp. 319–336) and Chapter 13 — Roof Coatings (pp. 369–386)" },
  flashing: { ref: "Book Chapter 3 — Eaves & Valley Flashing (pp. 60–70), Chapter 12 — Wall Flashing (pp. 359–367), and Chapter 14 — Attic Ventilation & Gutters (pp. 407–412)" },
  insulation: { ref: "Book Chapter 12 — Insulation, Vapor Retarders and Waterproofing (pp. 337–368)" },
  repair: { ref: "Book Chapter 14 — Roofing Repair and Maintenance (pp. 387–412)" },
  estimating: { ref: "Book Chapter 15 — Estimating (and Maximizing) Production Rates (pp. 413–429) and Appendix C — Equations Used in This Book (p. 432)" }
};

window.COURSE_RECAPS = {
  /* ---------- 1. measuring ---------- */
  "measuring|0": {
    sum: "Roof shapes combine a few basic forms, and slope — rise over run — is the number that drives material choice, labor pricing and safety planning.",
    points: ["Gable, hip, shed, gambrel/mansard and flat are the building blocks; real houses combine them", "Slope is rise per 12\" of run — 6/12 rises 6 inches per foot", "Read pitch with a speed square, in the attic against a rafter, with a gauge, or from aerial reports", "Steep-slope practice starts at 4/12; 2/12–4/12 needs special underlayment; below 2/12 is membrane territory"],
    remember: ["Slope ≠ degrees: 6/12 ≈ 26.6°, 12/12 = 45°", "Verify software-reported pitch on site", "Record pitch per plane, not per house"],
    tips: ["Different pitches on one house = different labor rates on one bid", "A phone level app on a rake edge beats guessing from the ground"]
  },
  "measuring|1": {
    sum: "Plan area understates a sloped roof — multiply by the slope factor to get true surface area, and always measure to the drip edge.",
    points: ["Actual area = plan area × slope factor", "Factor = √(rise² + 144) ÷ 12 — computable for any pitch", "A square = 100 sq ft, the trade's unit of measure", "Overhangs are roof you must cover but don't show on floor plans"],
    remember: ["Key factors: 4/12→1.054, 6/12→1.118, 8/12→1.202, 12/12→1.414", "32' × 48' at 8/12 ≈ 1,846 sq ft ≈ 18.5 squares before waste"],
    tips: ["If a report and your tape disagree by more than ~3%, re-measure", "Keep the factor table taped inside your clipboard until it's memorized"]
  },
  "measuring|2": {
    sum: "Net area subtracts big openings; hips, valleys and ridges get their own length math; and waste factors turn geometry into an order.",
    points: ["Net = gross − skylights/chimneys; small penetrations ride in the waste factor", "Hip/valley true length = plan length × hip-valley factor (1.452 at 4/12 up to 1.732 at 12/12)", "Gable ridge = building length; hip-roof ridge = length − width", "Waste: 5–10% clean gables, 10–15%+ cut-up hips"],
    remember: ["Hip/valley lengths drive cap and valley-metal orders", "Laminate rake offcuts often reuse; valley cuts usually don't"],
    tips: ["100+ LF of hips and valleys on one house = price premium waste AND premium labor", "Sketch every roof — the drawing catches the plane you forgot"]
  },

  /* ---------- 2. sheathing ---------- */
  "sheathing|0": {
    sum: "The roof is only as good as the structure under it — verify framing condition, spacing and load capacity before you bid, and again after tear-off.",
    points: ["Look for cracked rafters, water staining, eave rot and insect damage", "Sight the ridge and planes from the ground for sag", "16\" or 24\" o.c. spacing sets the panel span rating you need", "Heavy materials (tile/slate) demand a structural evaluation in writing"],
    remember: ["Eave rot starts where gutters back up", "Asphalt ~2.5 lbs/sq ft vs tile/slate 6–11+ lbs/sq ft"],
    tips: ["Photograph structural problems before AND after tear-off", "Signed change orders before fixing — unpapered work is donated work"]
  },
  "sheathing|1": {
    sum: "Panels across rafters with staggered ends and expansion gaps; skip sheathing under wood; plank decking where structure is also the ceiling.",
    points: ["7/16\" OSB to 5/8\" ply common; match span rating to spacing", "Long dimension across rafters, ends staggered, edges supported (framing or H-clips)", "~1/8\" gaps — tight decks buckle and telegraph", "Nail 6\" edges / 12\" field; ring-shanks and tighter schedules in wind zones"],
    remember: ["Skip sheathing = 1x4/1x6 with gaps, for shakes/shingles that must breathe", "2x6 T&G plank = structure + finished ceiling; watch fastener length"],
    tips: ["Re-nailing an old deck to current code is a legitimate storm-market line item", "A nail through an exposed-beam ceiling is a service call you never forget"]
  },
  "sheathing|2": {
    sum: "Sheets = area ÷ 32 plus waste; hidden rot gets a written per-sheet unit price; and staged material must never point-load the deck.",
    points: ["4x8 panel covers 32 sq ft; add 5–10% cutting waste", "Re-quote panel prices on bids older than ~30 days", "Unit-price decking replacement in the contract protects both sides", "Spread bundle stacks along framing near the ridge"],
    remember: ["30 squares of laminate is well over a ton of staged load", "Soft spots, flaky OSB and stained nail lines = replace that sheet"],
    tips: ["Mark bad sheets with paint and count them with the homeowner watching", "Boom to the ridge beats ladder-humping for deck and backs alike"]
  },

  /* ---------- 3. underlayment ---------- */
  "underlayment|0": {
    sum: "Felt is the legacy product, synthetics are the modern standard, and self-adhered membrane goes wherever water concentrates or backs up.",
    points: ["No. 15/No. 30 felt: cheap, wrinkles wet, tears in wind, days of UV life", "Synthetics: lighter, far stronger, walkable, months of rated UV exposure", "Ice & water seals around fasteners — eaves in ice country, valleys, penetrations, low-slope transitions", "Full-deck ice & water is a sellable upgrade in severe-weather markets"],
    remember: ["Ice-dam eave coverage: from edge to ≥24\" inside the warm wall", "Granular membrane in open metal valleys; high-temp smooth under metal roofing"],
    tips: ["Check the cap-nail spec on synthetics, not just the roll price", "Standard ice & water under a hot metal panel can flow — spec high-temp"]
  },
  "underlayment|1": {
    sum: "Underlayment shingles water downhill: upper courses over lower, straight lines, proper laps, and double coverage as slope drops.",
    points: ["Start at the eave; head laps 2–4\", end laps 6\"; wrap hips and ridges", "2/12–4/12 with shingles = double coverage (19\" exposure) or self-adhered base", "Drip edge: under membrane at eaves per many ice-region specs, over at rakes — follow local code", "Fasten to pattern; wind destroys loose dry-ins"],
    remember: ["No lap ever faces uphill", "A proper dry-in means rain tonight does no harm"],
    tips: ["Never open more roof than you can dry-in the same day", "Chalk lines (or the synthetic's printed grid) keep courses honest"]
  },
  "underlayment|2": {
    sum: "Dry-in estimating is roll-coverage division plus the accessories that ride along — and double-coverage areas literally double the count.",
    points: ["No. 15 ≈ 4 sq/roll; No. 30 ≈ 2; synthetics commonly ~10 (read the label)", "Ice & water estimates by lineal feet of eave/valley/penetration perimeter", "Add cap nails, drip edge LF and temporary protection", "Steep pitches slow the whole dry-in operation — price the labor"],
    remember: ["Rolls = net area ÷ coverage, rounded up, plus laps/waste", "The 3/12 porch doubles its underlayment quantity"],
    tips: ["Order one extra roll on cut-up roofs — laps eat more than math says", "Above 8/12, everything about dry-in takes longer; bid accordingly"]
  },

  /* ---------- 4. asphalt ---------- */
  "asphalt|0": {
    sum: "Laminated architectural shingles are today's standard; three-tabs are fading; designer and Class 4 impact products serve premium and hail markets.",
    points: ["Three-tab: single layer, 60–70 mph ratings, budget/repair work", "Laminate: two bonded layers, 110–130 mph with proper nailing, the default", "Designer/luxury: multi-layer slate/shake looks at 400+ lbs/sq", "UL 2218 Class 4 = top impact rating; often earns insurance discounts"],
    remember: ["Wind warranties depend on correct nailing — not just the product", "Bundle lot numbers must match across a plane or you risk color banding"],
    tips: ["In hail states, lead with the Class 4 insurance-discount story", "Work off one pallet at a time to keep lots together"]
  },
  "asphalt|1": {
    sum: "Drip edge → underlayment → starter → field → caps, with nailing as the make-or-break skill: right zone, right count, driven flush.",
    points: ["Starter at eaves AND rakes puts sealant where lift starts", "Laminate exposure typically 5-5/8\" — follow the shingle, not habit", "4 nails standard, 6 in high-wind/steep; overdriven, angled or high nails are the #1 defect", "Offset joints per pattern; keep valley nails 6\"+ off centerline; ridge vent under caps"],
    remember: ["Open metal sheds debris best; closed-cut is the production standard", "Racking straight up is prohibited on most laminates"],
    tips: ["Cold-season installs may need hand-sealing — build in the labor", "One overdriven gun setting can void a whole slope's warranty; check pressure at start"]
  },
  "asphalt|2": {
    sum: "A real asphalt takeoff covers field, starter, caps, fasteners, accessories, tear-off and tiered labor — the forgotten lines are 10–15% of the job.",
    points: ["Squares = net × (1 + waste); laminates usually 3 bundles/sq — confirm on the wrapper", "Starter by eave+rake LF; caps by hip+ridge LF (20–35 LF/bundle)", "Nails ~1.5–2 lbs/sq at 4-nail; more at 6-nail", "Tear-off debris ~250–350 lbs per square per layer"],
    remember: ["30 squares single-layer tear-off ≈ 4–5 tons of debris", "Labor tiers: walkable ≤6/12, steep 7–9/12, extra-steep 10/12+"],
    tips: ["The estimate isn't done until starter, caps and disposal are on it", "Two-story and cut-up each add — stack the adders honestly"]
  },

  /* ---------- 5. wood ---------- */
  "wood|0": {
    sum: "Shingles are sawn and tailored; shakes are split and rustic — and only No. 1 Blue Label edge-grain heartwood belongs on a roof.",
    points: ["Shingles: sawn both faces, 16\"/18\"/24\" lengths, tight tolerances", "Shakes: split face(s), thicker butts, deeper shadow lines", "Grades: No. 1 Blue Label for roofs; No. 2/No. 3 for economy walls and sheds", "Fire codes restrict untreated wood roofs in wildfire areas — check before quoting"],
    remember: ["100% edge-grain heartwood is what makes Blue Label roof-worthy", "Class B/C fire-rated pressure-treated product exists where code demands"],
    tips: ["Confirm the fire-code situation before the sales call, not after", "Western red cedar dominates; yellow cedar and treated pine appear regionally"]
  },
  "wood|1": {
    sum: "Wood roofs must breathe from both faces and move with moisture — spaced sheathing, keyway gaps, exactly two nails, and felt interlay on shakes.",
    points: ["Spaced sheathing or a vent mat under every wood roof", "Keyways: ~1/4\"–3/8\" shingles, 3/8\"–5/8\" shakes; offset joints 1-1/2\"+, no alignment within three courses", "Two corrosion-resistant nails per piece — extra nails split moving wood", "Shakes: 18\" No. 30 felt interlay between courses blocks wind-driven water"],
    remember: ["Exposure by length and slope: 16\" at 5\", 18\" at 5-1/2\", 24\" at 7-1/2\" (4/12+)", "Nails ~3/4\" from edges, 1-1/2\" above the exposure line"],
    tips: ["A wood roof shows its installer's skill from the curb — straight courses sell the next job", "Stainless fasteners near salt air, always"]
  },
  "wood|2": {
    sum: "Cedar coverage depends on the exposure you run, labor runs 2–3× asphalt, and the maintenance conversation is both honesty and future revenue.",
    points: ["Bundle labels rate coverage at a standard exposure — different exposure, different coverage", "Shakes commonly 5 bundles/sq at standard exposure plus interlay felt", "Waste 10% straight, 15%+ hips/valleys", "Premium fasteners and interlay felt ride the materials list"],
    remember: ["Labor 2–3× asphalt is real — every piece is hand-placed", "One 18\" felt roll per 2–3 squares of shakes"],
    tips: ["Set the maintenance expectation in the proposal — moss care and cleaning are service contracts waiting", "Price the learning curve if your crew is new to cedar"]
  },

  /* ---------- 6. tile ---------- */
  "tile|0": {
    sum: "Clay is colorfast for a century, concrete is the value play — and both are heavy enough that structure gets verified before anything gets promised.",
    points: ["Clay: barrel/mission, S, flat; fired color never fades", "Concrete: S, flat, shake/slate looks; heavier value option, color can soften over decades", "600–1,100+ lbs/sq vs ~250 for asphalt", "Lightweight (~600 lb) concrete exists for re-roofs — still verify structure"],
    remember: ["Asphalt-to-tile conversions need an engineer's sign-off", "Tile is brittle: walk headlaps/lower thirds or foam pads"],
    tips: ["Leave the customer spare tiles from the same production run", "Never let sales promise tile before the framing verdict"]
  },
  "tile|1": {
    sum: "Tile sheds water; the underlayment waterproofs — which is why the base layer is premium and remove-and-relay is a whole market.",
    points: ["Premium two-ply, self-adhered or high-performance synthetic base rated for the tile's life", "Direct-nail low slopes/flat profiles; battens (often counter-battened) steeper and barrel profiles", "Foam adhesive or storm clips in high-wind zones", "Bird stops, wide valley metal, lead/flexible penetration flashings dressed to the profile"],
    remember: ["'Tile's fine but it leaks' = the underlayment died — relay market", "Every flashing pan must lap over the underlayment below it"],
    tips: ["Remove-and-relay sells as saving irreplaceable clay — because it does", "Ridge/hip on adhesive or clip systems beats crumbling mortar in freeze country"]
  },
  "tile|2": {
    sum: "Tile estimating runs on the manufacturer's data sheet: pieces per square by profile, trim by lineal foot, breakage allowance, and honest slow-labor pricing.",
    points: ["Tiles/sq varies by profile (commonly 80–100 concrete) — use the data sheet every time", "Trim tiles by ridge/hip/rake LF; bird stops by eave LF", "Battens, fasteners/clips/foam by schedule; premium underlayment is a big cost line", "Breakage allowance 2–5%; labor 2–4× asphalt"],
    remember: ["A full tile load is 8–10+ tons — plan pallet spreading, never point-load", "Cut-heavy hips and mortar work add labor beyond the base rate"],
    tips: ["Order field and trim together from one run for color match", "Walk boards and foam pads on every relay — broken replacement tile eats margin"]
  },

  /* ---------- 7. slate ---------- */
  "slate|0": {
    sum: "Slate is graded stone: S1 quarries deliver 75+ year roofs, sizes and thickness vary, and the weight conversation matches tile's.",
    points: ["ASTM C406: S1 75+ years, S2 40–75, S3 20–40", "Vermont/NY, Virginia Buckingham, and Pennsylvania beds have distinct colors and lifespans", "~3/16\"–1/4\" standard thickness; sizes 10\"×6\" to 24\"×14\"", "700–1,000+ lbs/sq — structural evaluation required"],
    remember: ["S1 stone outlives ordinary fasteners and flashings — details must match the stone", "'Unfading' vs 'weathering' colors are quarry designations"],
    tips: ["Salvage slate supports repairs and blend-ins — know your regional sources", "Quarry samples wet and dry show the customer the real long-term color"]
  },
  "slate|1": {
    sum: "Slate hangs on two copper or stainless nails with the head just touching — and headlap, not sealant, is what keeps the water out.",
    points: ["Overdriven cracks now; underdriven punctures the slate above later", "Headlap: 3\" standard slopes, 4\" low, 2\" very steep; exposure = (length − headlap) ÷ 2", "Joints break by half-slate; copper valleys and flashings on serious work", "Repairs: ripper + hook or nail-and-bib; walk ladders, not stone"],
    remember: ["On a 90-year-old S1 roof, fasteners and flashings fail before stone", "Restore-and-reflash often beats tear-off — and it's the honest recommendation"],
    tips: ["Gray bar-flashing repairs across a slate field mark amateurs — use hooks", "Hook ladders and chicken ladders are part of the bid, not extras"]
  },
  "slate|2": {
    sum: "Slate estimating is pieces-per-square from the size table, copper everything, a breakage allowance, and labor at the top of the trade.",
    points: ["Pieces/sq from size + headlap tables (18\"×10\" at 3\" lap ≈ 192)", "Copper/stainless nails ~2 lbs/sq; copper flashing package", "Breakage 3–5%; snow retention where climate demands", "Crew production is a fraction of asphalt pace — price reality, not hope"],
    remember: ["Exposure = (length − headlap) ÷ 2 — the formula that sizes everything", "New S1 slate is a premium-of-premium bid"],
    tips: ["Bid slate repairs by the day for small work — piece rates lie on old roofs", "Photograph existing broken slates before you're blamed for them"]
  },

  /* ---------- 8. metal ---------- */
  "metal|0": {
    sum: "Exposed-fastener panels are the economy play with hundreds of gasketed holes; standing seam conceals clips and moves with temperature; metals and finishes set lifespan.",
    points: ["Corrugated/R-panel: fast, cheap, every screw a future maintenance point", "Snap-lock standing seam: clicks together, needs more slope; mechanical double-lock goes low-slope", "Metal shingles/stone-coated steel: shake/tile looks at ~1.5 lbs/sq ft", "Steel gauge: lower number = thicker; aluminum coastal; copper/zinc premium"],
    remember: ["PVDF/Kynar finishes outlast polyester (SMP) — spec the finish, not the color", "Mechanically seamed systems reach ~1/2:12 in some specs"],
    tips: ["Weight-restricted re-roof? Metal shingle systems solve it", "Ask what's under the paint: same profile, very different steel"]
  },
  "metal|1": {
    sum: "Metal moves — every clip, closure and sealant detail exists to let it — and dissimilar metals plus trapped heat are the silent killers.",
    points: ["A 40' panel moves ~1/2\" seasonally; fix one end, float the rest", "Butyl tape in laps, never exposed caulk beads", "Oil-canning is controlled by striations, gauge and a flat deck — and disclosed up front", "Copper runoff kills steel/aluminum; treated lumber eats aluminum; graphite marks etch Galvalume"],
    remember: ["High-temp underlayment only — panel heat cooks standard membranes", "Closures seal rib openings at ridge and eave while allowing slide"],
    tips: ["Budget the 10–15 year screw-service visit on exposed-fastener roofs — it's also your service pipeline", "Show the customer oil-canning photos before contract, not after"]
  },
  "metal|2": {
    sum: "Metal is ordered cut-to-length by run — panels from eave length ÷ coverage width, trim as its own lineal-foot takeoff, and detail labor priced like the skill it is.",
    points: ["Panels per plane = eave LF ÷ coverage width (12\"–36\")", "Panel length = eave-to-ridge + overhang", "Trim: ridge, hip, rake, eave, sidewall, endwall, valley, transitions — each by LF", "~80 screws/sq sanity check on exposed-fastener; clips by schedule on seam"],
    remember: ["Field waste is low; hips and valleys generate real diagonal offcut (15%+ possible)", "Butyl tape by lap LF; closures at every rib termination"],
    tips: ["Hand-folded pans and seamed hips are skilled hours — price the details, not just the field", "Double-check coverage width before ordering; 16\" vs 18\" ruins a takeoff"]
  },

  /* ---------- 9. lowslope ---------- */
  "lowslope|0": {
    sum: "Built-up roofing is site-built redundancy — alternating felt and bitumen plies under gravel or cap — and its estimating logic still teaches every low-slope bid.",
    points: ["Three-ply/four-ply = that many chances to stop water", "Kettle work: 450–500°F, EVT discipline so plies bond", "Estimate felt per ply, bitumen ~20–25 lbs/sq per mopping + ~60 lb flood coat, gravel ~400 lbs/sq", "Cants at every wall; edge metal; insurance/safety overhead is real money"],
    remember: ["You'll meet BUR mostly in repair and tear-off decisions on older stock", "Knowing the layers tells you what you're cutting into"],
    tips: ["Core cuts before re-cover bids — wet insulation stays wet under new roof", "Gravel-surfaced BUR hides damage; probe, don't assume"]
  },
  "lowslope|1": {
    sum: "Mod-bit is factory-built BUR — APP torches, SBS flexes and self-adheres — and roll roofing remains the honest budget cover; torch discipline is non-negotiable.",
    points: ["APP = torch; SBS = torch/mop/cold-process/self-adhered (the flame-free residential answer)", "Base + granulated cap; laps 3–4\" side, 6\" end, staggered; granules pressed into seam bleed-out", "Torch safety: permits, extinguishers, never flame-to-deck, 1-hour fire watch minimum", "90-lb roll roofing: 8–12 year cover for sheds/outbuildings, single or double coverage"],
    remember: ["Torch-to-base-sheet, never torch into concealed cavities", "Rolls ≈ 1 square net each; two-layer systems double the count"],
    tips: ["Sell roll roofing as exactly what it is — cheap and short-lived — and you keep the customer", "Smoldering hidden starts end roofing companies; the fire watch is sacred"]
  },
  "lowslope|2": {
    sum: "Flat still means 1/4\" per foot of drainage — ponding kills membranes and warranties, and fixing it with tapered systems and crickets is estimating work.",
    points: ["Ponding = standing water 48 hours after rain", "Fix with tapered insulation packages, crickets between drains, added drains/scuppers", "Count and inspect drains, scuppers and overflows on every low-slope bid", "Moisture scans pay for themselves on big re-covers"],
    remember: ["Tapered packages come with shop drawings and their own pricing", "A new membrane draining to a clogged drain is a scheduled warranty claim"],
    tips: ["Walk the roof during or right after rain when you can — water tells the truth", "Photograph ponding rings; they sell the tapered upgrade for you"]
  },

  /* ---------- 10. singleply ---------- */
  "singleply|0": {
    sum: "EPDM is proven rubber with taped seams, TPO is the welded white volume leader, PVC owns grease and chemistry — choose by exposure, budget and detail needs.",
    points: ["EPDM: black rubber, tape/adhesive seams, decades of history, great re-cover/ballast play", "TPO: hot-air welded, reflective, price-competitive; quality = mil over scrim + welder skill", "PVC: weldable, superior grease/chemical resistance — the restaurant roof", "TPO and PVC don't weld to each other; keep systems separate"],
    remember: ["A cold weld looks fine and peels in year three", "White membranes sell on cooling costs; black absorbs heat"],
    tips: ["Restaurant with grease exhaust? PVC, full stop", "Check mil thickness over scrim, not just total mil, when comparing bids"]
  },
  "singleply|1": {
    sum: "Fully adhered, mechanically attached or ballasted holds the sheet down; seam QC — test welds, probes, destructive cuts — decides whether it stays a roof.",
    points: ["Adhered: cleanest, best field uplift, priciest; mechanical: fastest, flutters between rows; ballasted: needs structure and no wind-debris zone", "Morning test welds because temperature and weather change welder settings", "Probe every cooled seam; periodic test cuts, patched properly", "Corners/perimeter get enhanced attachment from the uplift calcs"],
    remember: ["Details — corners, boots, T-patches, terminations — separate 20-year roofs from callback machines", "Ballast = verified structure + hail/debris exposure check"],
    tips: ["Watch the welder's speed on cold mornings — that's where cold welds are born", "A seam probe in your pocket makes you the sharpest person on any TPO inspection"]
  },
  "singleply|2": {
    sum: "Coatings and SPF restore sound roofs at a fraction of replacement — silicone for ponding, acrylic for economy, urethane for traffic, foam for insulation-plus-waterproofing — but prep and mils decide everything.",
    points: ["Silicone: ponding champion, recoat-only-with-silicone, slick wet", "Acrylic: economical, wants drainage and dry cure windows; urethane: toughest traffic layer", "SPF: ~R-6+/inch, self-flashing, seamless — needs UV topcoat with granules and trained applicators", "Workflow: clean → repair wet insulation/seams → rust treat → reinforce details → adhesion test → spec mils"],
    remember: ["Coverage runs gallons/sq at spec dry-film thickness — skimped mils are THE coating failure", "Coatings convert into inspect-and-recoat maintenance agreements"],
    tips: ["Test-patch adhesion before promising anything on an unknown roof", "Overspray drifts — mask, monitor wind, and park cars far away on SPF days"]
  },

  /* ---------- 11. flashing ---------- */
  "flashing|0": {
    sum: "Water always beats caulk; shaped metal that laps downhill beats water — drip edge, step, counter, valley, cricket and boot details are the whole game.",
    points: ["Step flashing = one piece per course, woven in; a bent strip is not step flashing", "Counterflashing covers step/base flashing — reglet into masonry or behind siding", "Open W-valley for longevity/debris; closed-cut for production; membrane under either", "Chimneys >24\" wide get a cricket on the high side; neoprene boots are America's #1 small leak"],
    remember: ["Reusing old flashing = inheriting old leaks — replace with the roof", "Drip edge protects the deck edge and fascia at eaves and rakes"],
    tips: ["Upgrade boots to silicone or metal-collar versions and say so in the bid", "Photograph your flashing details — they close the next sale"]
  },
  "flashing|1": {
    sum: "Balanced ventilation — soffit intake low, ridge exhaust high — extends shingle life, stops ice dams and rot, and protects the manufacturer's warranty.",
    points: ["Baseline 1/150 NFA (1/300 balanced with vapor retarder)", "About half the vent area low, half high; never mix exhaust types on one attic", "Blocked soffits (paint, insulation) starve the system — baffles keep the path open", "Convert NFA math to product: ridge vent ~18 sq in/LF"],
    remember: ["A fan or turbine near a ridge vent short-circuits airflow — and can pull in weather", "Under-ventilated attics give manufacturers warranty-proration ammunition"],
    tips: ["Document the ventilation fix in every proposal — honest upsell, warranty protection", "Frost on nails in winter attics = ventilation sales call"]
  },
  "flashing|2": {
    sum: "The roof's job ends when water is away from the foundation: sized gutters, pitched runs, enough downspouts, and extensions that actually discharge clear.",
    points: ["5\" K-style standard, 6\" for big/steep roofs and intense rain", "Slope 1/16\"–1/8\" per foot toward outlets", "2\"×3\" downspout ≈ 600 sq ft of roof; 3\"×4\" ≈ 1,200", "Hangers 24\"–36\" (closer in snow); hidden hangers with screws"],
    remember: ["Estimate gutter + downspout LF plus elbows, miters, end caps, outlets, guards", "Discharge 4'+ from the foundation or the basement pays for it"],
    tips: ["Seamless machine-run aluminum priced per LF is the residential standard", "Overflow marks on fascia tell you where the sizing or pitch failed"]
  },

  /* ---------- 12. insulation ---------- */
  "insulation|0": {
    sum: "R-value scores resistance to heat flow; blown fill, batts, rigid board and spray foam each have a place — and a re-roof is the cheapest moment to fix a cold attic.",
    points: ["Blown: fiberglass ~R-2.5/inch, cellulose ~R-3.5/inch — the attic-floor standard", "Batts lose rated R to gaps and compression", "Rigid: polyiso ~R-6 (commercial roofs, often tapered), XPS ~R-5, EPS ~R-4", "Closed-cell SPF ~R-6+ air-seals as it insulates"],
    remember: ["R-values add; codes commonly want attics at R-38 to R-60 by climate", "On low-slope roofs the insulation IS part of the roof system"],
    tips: ["Baffles at every rafter bay before topping up fill — keep soffits breathing", "Quote the insulation top-up with the re-roof while access is open"]
  },
  "insulation|1": {
    sum: "Vapor drives toward cold and condenses on the first cold surface — retarders go on the warm-in-winter side, air sealing beats vapor math, and two barriers build a terrarium.",
    points: ["Heating climates: retarder behind ceiling drywall/under attic insulation", "Class I (poly) to Class III (paint); vapor-open assemblies dry faster", "Most attic moisture rides air leaks: top plates, can lights, bath fans", "High-humidity buildings get deck-level base-sheet retarders on low-slope roofs"],
    remember: ["Bath fans duct OUTDOORS, never into the attic", "A barrier in the wrong place traps water instead of stopping it"],
    tips: ["Frost on nail tips and rusty heads = moisture call, fix with the re-roof", "Seal the leaks before adding insulation — order of operations matters"]
  },
  "insulation|2": {
    sum: "Below the roofline: dampproofing resists soil moisture, waterproofing resists water pressure, wall flashings move leaked water back out, and sealants are components — never the strategy.",
    points: ["Dampproofing = asphalt coating; waterproofing = continuous membrane rated for head pressure", "Through-wall flashing with weeps; sill pans, head flashings, kick-out flashings", "Silicone (UV-proof, unpaintable), urethane (tough, paintable), butyl (concealed laps), acrylic (light duty)", "Joint design: width-to-depth ratio, backer rod, primer where specified"],
    remember: ["A missing kick-out is a hidden-rot generator at every roof-wall end", "Caulk finishes flashed details; it never substitutes for them"],
    tips: ["Learn the sealant families — the right tube in the right joint outlasts five wrong ones", "When siding stains below a roof termination, go find the kick-out that isn't there"]
  },

  /* ---------- 13. repair ---------- */
  "repair|0": {
    sum: "The stain is the end of the water's trip, not the start — diagnose uphill from penetrations and flashings, repair permanently, and sell the maintenance program.",
    points: ["Boots, chimneys, skylights, walls and valleys cause most leaks — not open field", "Follow attic water tracks up-slope; measure from a common reference inside and out", "Hose-test one zone at a time, bottom up, spotter inside", "Replace and re-weave — roof cement smears are 12-month bandages"],
    remember: ["Moisture meters and IR find saturated low-slope insulation", "Annual inspection programs keep small problems small and keep your name on the roof"],
    tips: ["Photograph every diagnosis — it justifies the invoice and builds the file", "The maintenance customer is your future replacement customer"]
  },
  "repair|1": {
    sum: "Storm assessment runs on evidence: bruises and mat fracture for hail, creases for wind, soft metals as the lie detector, and a test square counted honestly.",
    points: ["Hail = random dark bruises, granule loss, soft spots, star-shaped mat fracture", "Blisters follow manufacturing patterns; wear paths are age — know the difference", "Soft metals (gutters, vents, AC fins) prove size and direction first", "10'×10' test square per slope; many carriers use ~8+ hits thresholds; creased wind tabs are dead"],
    remember: ["Clean soft metals = be skeptical of 'hail' on shingles", "Date-stamped photos, wide then close, every slope and accessory"],
    tips: ["Your file should let someone who never visited approve the claim", "Telling a homeowner there's NO claim earns the referral — and keeps you off fraud lists"]
  },
  "repair|2": {
    sum: "Two layers is the legal max — overlay only over one flat, sound, dry layer; tear-off wins everywhere else, and re-roof estimates carry the demolition math.",
    points: ["Overlay saves tear-off cost but hides the deck, runs hotter, telegraphs defects, trims warranties", "Tear-off required: two layers, shakes underneath, soft deck, chronic leaks, or full-warranty jobs", "Storm/insurance work is effectively always tear-off", "Estimate: tear-off labor by layer/pitch, disposal tonnage, dumpsters, protection, magnet sweep, per-sheet decking price"],
    remember: ["~250–350 lbs per square per layer drives the dumpster count", "You can't install eave ice & water on a deck you never exposed"],
    tips: ["Never open more roof than the day's weather window can close", "The magnet sweep is cheap insurance against a tire-and-paw PR disaster"]
  },

  /* ---------- 14. estimating ---------- */
  "estimating|0": {
    sum: "Five layers of direct cost — materials, loaded labor, equipment, subs, job-specifics — priced from takeoffs and your own tracked productivity.",
    points: ["Materials with waste, accessories and tax; lock supplier pricing in writing", "Loaded labor = wage + taxes + comp + benefits ($25/hr ≈ $34–40 loaded)", "Equipment, subs (scope in writing) and job-specifics (permits, disposal, steep/high) each get lines", "Squares per crew-day by material/pitch/stories is the heart of labor pricing"],
    remember: ["Workers' comp is a major number in roofing — never estimate on bare wages", "Friday job-costing builds the database no book can match"],
    tips: ["Track actuals on every job, even the ugly ones — especially the ugly ones", "A supplier quote with an expiration date beats a price from memory"]
  },
  "estimating|1": {
    sum: "Overhead is the cost of existing and it is not profit — recover it on every job, then price with the two-step formula, and guard margins from 'small' discounts.",
    points: ["Overhead: rent, trucks, insurance, office, advertising, estimating time, YOUR salary", "Annual overhead ÷ annual direct-cost volume = your overhead % (often 15–30%)", "Price = Direct Cost × (1 + OH%) × (1 + Profit%)", "Profit is what remains after ALL costs — the reward for risk"],
    remember: ["$10,000 direct × 1.25 × 1.10 = $13,750", "At 10% net margin, a 5% discount gives away half the profit"],
    tips: ["Know break-even to the dollar before negotiating a nickel", "Skipping the overhead layer means the office got paid out of your pocket"]
  },
  "estimating|2": {
    sum: "Labor prices two ways — production rates and unit prices built from them — and published books are starting points your own job-cost data must correct.",
    points: ["Squares/crew-day by material, pitch, stories, cut-up; crew-day cost × days = labor", "Unit prices ($/sq, $/LF) apply fast and match insurance-estimate format", "Price books don't know your crew, wages or that 40' eave — adjust or bleed", "Production levers: boom delivery, staging, specialized roles, sun-slope sequencing"],
    remember: ["Every crew-hour saved at the same price is pure margin", "Ten job-costed roofs teach you YOUR squares-per-day within a square"],
    tips: ["Compare your unit costs against subs' quotes to keep both honest", "Log hours against the estimate on every job — the next bid gets sharper"]
  },
  "estimating|3": {
    sum: "Bidding is a system: qualify the lead, know your ratios, write the scope, present value over price, and turn every estimate into a signed contract.",
    points: ["Qualify: decision-maker, budget reality, honest timeline", "Bid-hit ratio by job type: winning everything = underpriced; healthy ≈ 25–40% on qualified residential", "Written scope: inclusions, exclusions, unit prices for hidden conditions, payment milestones, change orders", "Insurance work: scope line-for-line from the adjuster, supplement with documentation"],
    remember: ["The wrong customer at the right price is still a loss", "Verbal agreements roof nothing — estimate → bid → contract"],
    tips: ["Show flashing photos and ventilation fixes — sell the roof they can't see", "When you're never the cheapest, be the clearest"]
  }
};
