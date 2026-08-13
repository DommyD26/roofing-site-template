/* Course content for "Roofing Construction & Estimating — The E-Course"
   Companion course to the book by Daniel Atcheson (Craftsman Book Company).
   Lesson text is an original summary of each topic area — read the full
   chapter in the book for complete depth, tables and worked examples. */

window.COURSE = {
  title: "Roofing Construction & Estimating",
  subtitle: "The Companion E-Course",
  bookUrl: "https://drive.google.com/file/d/1ZG6sCgc3P_V1si596NiOlgW5_caGKJ7g/view",
  passScore: 70,
  modules: [
    {
      id: "measuring",
      title: "Measuring Roofs: Slope, Area & Quantities",
      minutes: 25,
      intro: "Every estimate starts with an accurate takeoff. This module covers how to measure any roof — level or sloped — and convert plan dimensions into real roof area.",
      sections: [
        {
          h: "Level vs. sloped roofs",
          body: "<p>A <strong>level (flat) roof</strong> is measured directly: length × width, plus parapets and penetrations. A <strong>sloped roof</strong> is bigger than its footprint — the plan area must be multiplied by a slope factor to get true surface area.</p><p>Slope is expressed as <em>rise over run</em>: a 6/12 roof rises 6 inches for every 12 inches of horizontal run. You can read slope with a speed square and level on the rake, from inside the attic against a rafter, or from measurement software — but always verify software numbers on site when you can.</p>"
        },
        {
          h: "Slope factors",
          body: "<p>Multiply the horizontal (plan) area by the factor for the pitch to get actual roof area:</p><table><tr><th>Pitch</th><th>Slope factor</th><th>Pitch</th><th>Slope factor</th></tr><tr><td>3/12</td><td>1.031</td><td>8/12</td><td>1.202</td></tr><tr><td>4/12</td><td>1.054</td><td>9/12</td><td>1.250</td></tr><tr><td>5/12</td><td>1.083</td><td>10/12</td><td>1.302</td></tr><tr><td>6/12</td><td>1.118</td><td>12/12</td><td>1.414</td></tr><tr><td>7/12</td><td>1.158</td><td>18/12</td><td>1.803</td></tr></table><p>Example: a house with a 30' × 50' footprint (1,500 sq ft plan area) at 6/12 has 1,500 × 1.118 = <strong>1,677 sq ft</strong> of actual roof — about 16.8 squares before waste.</p>"
        },
        {
          h: "Net vs. gross area, hips, valleys and ridges",
          body: "<p><strong>Gross area</strong> is the whole surface; <strong>net area</strong> subtracts large openings like skylights and chimneys. Small penetrations are usually ignored — the waste factor covers them.</p><p>Hips and valleys run diagonally, so they're longer than they look on plan. Use hip/valley factors (e.g., about 1.452 at 4/12, 1.564 at 8/12, 1.732 at 12/12 applied to plan length) to get true lengths for hip/ridge caps and valley metal. Ridge length on a simple gable equals building length; on hip roofs the ridge shortens by the building width.</p><p>Always add <strong>waste</strong>: typically 5–10% on simple gables, 10–15%+ on cut-up hip roofs with many valleys and dormers.</p>"
        }
      ],
      quiz: [
        { q: "A roof rises 6\" for every 12\" of horizontal run. Its slope is:", a: ["6/12", "12/6", "50/100", "6 degrees"], correct: 0 },
        { q: "Plan area is 2,000 sq ft and the roof is 8/12 (factor 1.202). Actual roof area is about:", a: ["2,000 sq ft", "2,404 sq ft", "1,664 sq ft", "2,800 sq ft"], correct: 1 },
        { q: "Net roof area is:", a: ["Gross area plus waste", "Plan area before the slope factor", "Gross area minus large openings like skylights", "The area of the ridge caps"], correct: 2 },
        { q: "Which roof type generally needs the HIGHEST waste factor?", a: ["Simple gable", "Cut-up hip roof with many valleys and dormers", "Flat roof", "Shed roof"], correct: 1 },
        { q: "One roofing 'square' equals:", a: ["10 sq ft", "100 sq ft", "1,000 sq ft", "One bundle"], correct: 1 }
      ]
    },
    {
      id: "sheathing",
      title: "Roof Sheathing & Decking",
      minutes: 20,
      intro: "The deck is the foundation of the roof system. Before roofing anything, verify the framing and sheathing can carry the load — and know how to estimate replacement decking.",
      sections: [
        {
          h: "Check the framing first",
          body: "<p>Before loading a roof with material, check rafter/truss condition, spacing and span. Sagging ridges, cracked rafters, or rot at eaves must be corrected first — heavier materials like tile and slate may require an engineer's sign-off on the structure.</p>"
        },
        {
          h: "Sheathing types",
          body: "<p><strong>Solid sheathing</strong> — plywood or OSB panels (commonly 7/16\" to 5/8\") — is required under asphalt shingles and most modern systems. Panels run long-dimension across rafters, ends staggered, with proper nailing and 1/8\" gaps for expansion; H-clips support unblocked edges.</p><p><strong>Spaced (skip) sheathing</strong> — 1x4 or 1x6 boards with gaps — is traditional under wood shakes/shingles and some tile, letting the material breathe from below.</p><p><strong>Plank decking</strong> (2x6 T&G) shows up on exposed-beam construction and must be treated as both structure and ceiling finish.</p>"
        },
        {
          h: "Estimating sheathing",
          body: "<p>Sheathing quantity = actual roof area ÷ 32 sq ft per 4x8 panel, plus 5–10% waste for cuts. On re-roofs, walk the deck after tear-off and price decking replacement per sheet as a unit-cost line item — you can't see rot until the old roof is off, so put a per-sheet price in the contract up front.</p><p>Don't overload the deck when staging material: spread bundles over framing near the ridge, never stack a pallet's worth in one spot mid-span.</p>"
        }
      ],
      quiz: [
        { q: "Spaced (skip) sheathing is traditionally used under:", a: ["Asphalt shingles", "Wood shakes and shingles", "TPO membrane", "Modified bitumen"], correct: 1 },
        { q: "A 4x8 sheathing panel covers:", a: ["24 sq ft", "32 sq ft", "40 sq ft", "48 sq ft"], correct: 1 },
        { q: "The best way to handle unknown deck rot on a re-roof bid is to:", a: ["Ignore it", "Guess a lump sum", "Put a per-sheet replacement unit price in the contract", "Promise free replacement"], correct: 2 },
        { q: "Panels should be installed with:", a: ["Ends aligned in a straight line", "Staggered ends and small expansion gaps", "No gaps, tight joints", "Long dimension parallel to rafters"], correct: 1 }
      ]
    },
    {
      id: "underlayment",
      title: "Underlayment & Dry-In",
      minutes: 15,
      intro: "Underlayment is the roof's second line of defense and the dry-in layer that protects the job between tear-off and final roofing.",
      sections: [
        {
          h: "Types of underlayment",
          body: "<p><strong>Asphalt-saturated felt</strong> (No. 15 and No. 30) is the traditional choice — cheap, but it wrinkles when wet and tears in wind.</p><p><strong>Synthetic underlayment</strong> (woven polypropylene/polyethylene) is lighter, far stronger, walkable, and stands up to longer UV exposure — it has largely replaced felt on quality jobs.</p><p><strong>Self-adhering ice &amp; water membrane</strong> seals around nails and is used at eaves (in ice-dam regions), valleys, penetrations, and low-slope transitions — and full-coverage in high-wind/hail markets.</p>"
        },
        {
          h: "Installation & estimating",
          body: "<p>Roll out horizontally starting at the eave, upper courses lapping over lower (typically 2–4\" horizontal laps, 6\" end laps) so water always sheds over, never under. Double coverage or self-adhered membrane is required as slope drops toward the material's minimum.</p><p>Estimating: a square of No. 15 felt ≈ 4 squares per roll; synthetics commonly cover about 10 squares per roll. Quantity = net roof area ÷ coverage per roll, plus laps and waste. Ice &amp; water is estimated by lineal feet of eave/valley × membrane width.</p>"
        }
      ],
      quiz: [
        { q: "Underlayment courses must lap so that:", a: ["Lower courses overlap upper ones", "Upper courses overlap lower ones", "Laps face uphill", "No laps are needed"], correct: 1 },
        { q: "Self-adhering ice & water membrane is most critical at:", a: ["The middle of open field", "Eaves, valleys and penetrations", "Gable trim", "Fascia boards"], correct: 1 },
        { q: "Compared to felt, synthetic underlayment is generally:", a: ["Heavier and weaker", "Stronger, lighter and more UV-tolerant", "Cheaper per square", "Not walkable"], correct: 1 }
      ]
    },
    {
      id: "asphalt",
      title: "Asphalt Shingles",
      minutes: 25,
      intro: "Asphalt shingles cover more American roofs than every other material combined. Master the product types, the nailing, and the takeoff.",
      sections: [
        {
          h: "Product types",
          body: "<p><strong>3-tab strip shingles</strong> — single-layer, budget product, lower wind ratings, fading from the market. <strong>Laminated/architectural shingles</strong> — two bonded layers, heavier, better wind and hail ratings, dimensional look; the standard today. <strong>Designer/luxury shingles</strong> mimic slate or shake at premium weight and price. Impact-rated (Class 4) shingles can earn insurance discounts in hail markets.</p>"
        },
        {
          h: "Installation fundamentals",
          body: "<p>Minimum slope is 2/12 with special double-coverage underlayment procedures; 4/12 and above is standard territory. Start with a starter strip at eaves and rakes, keep courses to the manufacturer's exposure (typically 5-5/8\" on laminates), and nail in the nailing zone — 4 nails standard, 6 nails for high-wind. Overdriven, angled, or high nails are the #1 workmanship failure. Hips and ridges get cap shingles; ridge vent goes under the caps.</p>"
        },
        {
          h: "Estimating asphalt",
          body: "<p>Squares = net area × waste factor (5–10% gable, 10–15% cut-up). Laminates typically run 3 bundles per square — always confirm, some heavies run 4. Add: starter (eave + rake LF), caps (hip + ridge LF), nails (~1.5–2 lbs/sq), underlayment, drip edge, vents, and flashing. Tear-off and disposal are separate labor + dump lines — weight matters: figure roughly 250–350 lbs per square per layer of old asphalt roofing.</p>"
        }
      ],
      quiz: [
        { q: "The standard residential shingle sold today is:", a: ["3-tab", "Laminated/architectural", "T-lock", "Roll roofing"], correct: 1 },
        { q: "Standard nailing per shingle (non-high-wind) is:", a: ["2 nails", "4 nails", "6 nails", "8 nails"], correct: 1 },
        { q: "Most laminated shingles cover one square with:", a: ["2 bundles", "3 bundles", "5 bundles", "1 bundle"], correct: 1 },
        { q: "Below 4/12 down to the 2/12 minimum, asphalt shingles require:", a: ["Nothing special", "Double-coverage or self-adhered underlayment procedures", "Skip sheathing", "Wider exposure"], correct: 1 },
        { q: "Class 4 shingles matter to homeowners mainly because:", a: ["They're lighter", "Possible insurance discounts for impact resistance", "They need no nails", "They install faster"], correct: 1 }
      ]
    },
    {
      id: "wood",
      title: "Wood Shingles & Shakes",
      minutes: 15,
      intro: "Cedar delivers a look nothing else matches — and demands craftsmanship, ventilation and honest labor pricing.",
      sections: [
        {
          h: "Shingles vs. shakes",
          body: "<p><strong>Shingles</strong> are sawn smooth on both faces and laid to tighter tolerances. <strong>Shakes</strong> are split (at least on the exposed face), thicker and more rustic, and require an 18\"-felt interlay between courses to keep wind-driven water out of the thicker keyways. Grades run from premium 100% edge-grain heartwood down to economy grades — roof work should use the top grades.</p>"
        },
        {
          h: "Installation & estimating",
          body: "<p>Wood roofs want to breathe: spaced sheathing or a ventilating underlayment mat under the courses. Joints offset between courses, proper keyway gaps for expansion, only two corrosion-resistant nails per piece. Exposure depends on length and slope (e.g., 5\" for 16\" shingles at 4/12+).</p><p>Estimating: coverage per bundle varies with exposure — check the label tables. Labor runs well above asphalt: figure the steep learning curve, the felt interlay on shakes, and premium waste at hips and valleys (often 15%+).</p>"
        }
      ],
      quiz: [
        { q: "The main physical difference between shakes and shingles:", a: ["Shakes are sawn smooth; shingles are split", "Shakes are split and thicker; shingles are sawn", "No difference", "Shingles are only for walls"], correct: 1 },
        { q: "Shake installation requires what between courses?", a: ["Ice & water shield", "18\" felt interlay", "Metal strips", "Nothing"], correct: 1 },
        { q: "How many nails per wood shingle/shake?", a: ["Two", "Four", "Six", "One"], correct: 0 }
      ]
    },
    {
      id: "tile",
      title: "Concrete & Clay Tile",
      minutes: 15,
      intro: "Tile roofs last generations — if the structure can carry them and the details are right.",
      sections: [
        {
          h: "Materials and weight",
          body: "<p>Clay tile (barrel/mission, S-tile, flat) and concrete tile (S, flat, shake-profile) run roughly <strong>600–1,100+ lbs per square</strong> — versus ~250 for asphalt. Verify the framing can take the load before you bid; re-roofs from asphalt to tile often need engineering.</p>"
        },
        {
          h: "System details & estimating",
          body: "<p>Tile is a water-shedding, not waterproof, system — the underlayment is the real waterproofing, so spec a premium two-layer or self-adhered base. Tiles hang on battens or nail direct depending on profile and slope; hips, ridges, and rakes use trim tiles set in mortar or on adhesive/clip systems. Bird stops, weep details, and flashing pans at penetrations make or break the roof.</p><p>Estimating: tiles per square varies by profile (check manufacturer data), plus trim tile LF, battens, fasteners/clips, upgraded underlayment, and much slower labor than asphalt. Add a breakage allowance for handling and foot traffic.</p>"
        }
      ],
      quiz: [
        { q: "Compared to asphalt (~250 lbs/sq), tile weighs roughly:", a: ["The same", "300 lbs/sq", "600–1,100+ lbs/sq", "100 lbs/sq"], correct: 2 },
        { q: "In a tile roof, the primary waterproofing layer is:", a: ["The tile itself", "The underlayment", "The battens", "The mortar"], correct: 1 },
        { q: "Before bidding asphalt-to-tile conversion you must:", a: ["Nothing special", "Verify structure can carry the load", "Remove all sheathing", "Double the ridge vent"], correct: 1 }
      ]
    },
    {
      id: "slate",
      title: "Slate Roofing",
      minutes: 10,
      intro: "The century roof. Slate is stone — beautiful, brittle, heavy, and unforgiving of shortcuts.",
      sections: [
        {
          h: "Working with slate",
          body: "<p>Roofing slate is split natural stone, graded by expected service life (the best beds run 75–150+ years). Like tile, it's heavy (700–1,000+ lbs/sq) and needs verified structure. Each slate is punched or drilled for two nails, hung — not pinned tight — on copper or stainless nails so the stone can move without cracking. Headlap (typically 3\" standard-slope) is what keeps the water out.</p><p>Repairs use a slate ripper and hook or copper-tab methods; walking slate wrong breaks it, so stagers, hook ladders and chicken ladders are part of the job. Estimating follows tile logic: pieces per square by size, premium flashing metals (copper), slow skilled labor, and a real breakage allowance.</p>"
        }
      ],
      quiz: [
        { q: "Slate should be fastened:", a: ["Driven tight to clamp the slate", "Hung loosely on the nails so it can move", "With adhesive only", "With one nail"], correct: 1 },
        { q: "Preferred fasteners for slate are:", a: ["Electro-galvanized steel", "Copper or stainless steel", "Aluminum staples", "Drywall screws"], correct: 1 },
        { q: "What primarily keeps water out of a slate roof?", a: ["Caulk", "Headlap", "Paint", "Mortar"], correct: 1 }
      ]
    },
    {
      id: "metal",
      title: "Metal Roofing",
      minutes: 20,
      intro: "From ag panels to architectural standing seam, metal is the fastest-growing steep-slope category — and the details are all about movement.",
      sections: [
        {
          h: "Panel systems",
          body: "<p><strong>Exposed-fastener panels</strong> (corrugated, R/PBR panel) screw through the face with gasketed screws — economical, but every fastener is a future maintenance point. <strong>Standing seam</strong> conceals fasteners with clips inside a raised seam (snap-lock or mechanically seamed) and allows thermal movement — the premium system. Metal shingles/stone-coated steel mimic shake and tile at light weight.</p><p>Materials: galvanized/Galvalume steel (24–29 ga), aluminum for coastal, copper and zinc for premium work. Kynar (PVDF) paint systems outlast cheaper polyester finishes.</p>"
        },
        {
          h: "Details & estimating",
          body: "<p>Metal moves with temperature — every detail (clips, slotted holes, closures at ridge/eave, sealant choices) must allow it. Watch for oil-canning on wide flat pans, dissimilar-metal corrosion (copper against steel, treated lumber against aluminum), and minimum slopes: mechanically seamed systems can go low (down to 1/2/12 in some specs), snap-lock and exposed-fastener need more pitch.</p><p>Estimating: panels are ordered cut-to-length — quantity = eave LF ÷ panel coverage width, by run length. Add trim (ridge, hip, rake, eave, gable, Z-closures), clips and screws, butyl tape, and slower labor for hips/valleys on standing seam.</p>"
        }
      ],
      quiz: [
        { q: "Standing seam's key advantage over exposed-fastener panels:", a: ["Cheaper", "Concealed fasteners and allowance for thermal movement", "No underlayment needed", "Heavier gauge always"], correct: 1 },
        { q: "Oil-canning refers to:", a: ["Lubricating seams", "Visible waviness in flat areas of panels", "A rust pattern", "A seaming tool"], correct: 1 },
        { q: "Placing copper in runoff contact with a steel roof causes:", a: ["Nothing", "Galvanic (dissimilar metal) corrosion", "Better grounding", "A stronger seam"], correct: 1 },
        { q: "Panel quantity for a run is figured by:", a: ["Total area ÷ 32", "Eave length ÷ panel coverage width", "Ridge length × 2", "Squares × 3"], correct: 1 }
      ]
    },
    {
      id: "lowslope",
      title: "Low-Slope: BUR, Mod-Bit & Roll Roofing",
      minutes: 20,
      intro: "When the roof goes flat, the rules change: continuous membranes, laps, and drainage become everything.",
      sections: [
        {
          h: "Built-up roofing (BUR)",
          body: "<p>The classic hot-asphalt system: alternating plies of felt and bitumen (3–5 plies), surfaced with gravel, a cap sheet, or coating. Estimated by squares per ply plus asphalt (moppings run roughly 20–25 lbs/sq per ply), insulation, and edge metal. Kettle work is skilled, hot and increasingly rare — safety and insurance costs are real line items.</p>"
        },
        {
          h: "Modified bitumen & roll roofing",
          body: "<p><strong>Mod-bit</strong> is factory-built BUR: asphalt modified with APP (torch-applied) or SBS (torch, mop, cold-process, or self-adhered) rubberizers, usually a base sheet plus granulated cap sheet in 1-square rolls (~33' × 3'). Laps 3–4\" side, 6\" end. Torch work means hot-work permits, extinguishers, and a fire watch after torching stops.</p><p><strong>Roll roofing</strong> (mineral-surfaced, 90-lb) is the budget end — single or double coverage on sheds, porches, outbuildings. Short life, but cheap and fast; estimate by roll coverage with laps.</p><p>On every low-slope job, check drainage: ponding water kills membranes and voids warranties. Tapered insulation or crickets may belong in your scope.</p>"
        }
      ],
      quiz: [
        { q: "A built-up roof is made of:", a: ["One thick membrane", "Alternating plies of felt and bitumen", "Metal panels", "Interlocking tiles"], correct: 1 },
        { q: "APP modified bitumen is typically applied by:", a: ["Nails only", "Torch", "Staples", "Clips"], correct: 1 },
        { q: "After torch work stops, the crew must:", a: ["Leave immediately", "Maintain a fire watch", "Hose the roof", "Remove all flashing"], correct: 1 },
        { q: "Ponding water on low-slope roofs:", a: ["Helps cool the building", "Degrades membranes and can void warranties", "Is required by code", "Only matters on metal"], correct: 1 }
      ]
    },
    {
      id: "singleply",
      title: "Single-Ply Membranes & Coatings",
      minutes: 20,
      intro: "TPO, PVC and EPDM dominate modern commercial roofing; fluid-applied coatings extend the life of aging roofs — and both are strong service revenue.",
      sections: [
        {
          h: "The big three membranes",
          body: "<p><strong>EPDM</strong> — black synthetic rubber, seamed with tape/adhesive; proven for decades. <strong>TPO</strong> — white heat-weldable polyolefin, today's commercial volume leader; reflective and economical. <strong>PVC</strong> — heat-weldable, superior chemical/grease resistance (the restaurant roof). Attachment: fully adhered, mechanically fastened in the laps, or ballasted. Welded seams get probed and test-cut for quality control.</p>"
        },
        {
          h: "Coatings & restoration",
          body: "<p>Silicone (great ponding resistance), acrylic (economical, needs slope), and urethane coatings can restore metal, mod-bit, BUR and single-ply roofs at a fraction of replacement cost — after proper cleaning, rust treatment, seam reinforcement and adhesion testing. Estimated by coverage rate (gal/sq at spec mil thickness) plus detail work. Coatings are also a natural maintenance-contract product: inspect, clean, recoat on a cycle.</p>"
        }
      ],
      quiz: [
        { q: "Which membrane is heat-welded and known for grease/chemical resistance?", a: ["EPDM", "PVC", "90-lb roll roofing", "BUR"], correct: 1 },
        { q: "EPDM seams are joined by:", a: ["Hot-air welding", "Seam tape/adhesive", "Torching", "Soldering"], correct: 1 },
        { q: "Best coating chemistry for roofs with ponding water:", a: ["Acrylic", "Silicone", "Latex paint", "Linseed oil"], correct: 1 },
        { q: "Before coating an old roof you must:", a: ["Just spray it", "Clean, repair, reinforce seams and verify adhesion", "Remove all flashing", "Add gravel"], correct: 1 }
      ]
    },
    {
      id: "flashing",
      title: "Flashing, Ventilation & Gutters",
      minutes: 20,
      intro: "Roofs rarely leak in the field — they leak at the details. Flashing, ventilation and drainage are where reputations are made.",
      sections: [
        {
          h: "Flashing fundamentals",
          body: "<p>Water always wins against caulk; flashing wins against water. Key details: <strong>drip edge</strong> at eaves/rakes; <strong>step flashing</strong> woven into each course along walls; <strong>counterflashing</strong> let into masonry over step flashing; <strong>valley metal</strong> (open W-valley) or woven/closed-cut shingle valleys; <strong>pipe boots</strong> and vent flashings; and <strong>chimney pans/crickets</strong> behind wide chimneys. Reuse of old flashing is false economy — replace it with the roof.</p>"
        },
        {
          h: "Ventilation & gutters",
          body: "<p>Attic ventilation extends shingle life and prevents ice dams and moisture rot. The common code baseline is 1 sq ft of net free vent area per 150 sq ft of attic (1/300 with balanced intake/exhaust and a vapor retarder) — balanced means soffit intake low and ridge/box exhaust high, and never mixing exhaust types that short-circuit airflow.</p><p>Gutters: size (5\" or 6\" K-style are standard residential) to roof area and rainfall intensity, slope runs toward downspouts (~1/16\"–1/8\" per foot), one downspout per 600–800 sq ft of roof served. Gutter work estimates by LF plus downspouts, elbows, miters and hangers.</p>"
        }
      ],
      quiz: [
        { q: "Along a sloped wall, shingles get:", a: ["One long piece of flashing", "Step flashing woven into each course", "Caulk only", "No flashing"], correct: 1 },
        { q: "Balanced attic ventilation means:", a: ["All exhaust at the ridge", "Intake low at soffits and exhaust high at ridge", "Two ridge vents", "Power fans plus turbines together"], correct: 1 },
        { q: "A cricket (saddle) is built:", a: ["At the eave", "On the high side of a wide chimney", "Inside the attic", "Under downspouts"], correct: 1 },
        { q: "Relying on caulk instead of flashing at details is:", a: ["Standard practice", "A temporary fix that will fail", "Required by code", "Cheaper and better"], correct: 1 }
      ]
    },
    {
      id: "estimating",
      title: "Estimating, Overhead & Bidding to Win",
      minutes: 30,
      intro: "The capstone: turning takeoffs into profitable bids. Costs are facts; price is strategy.",
      sections: [
        {
          h: "Building the estimate",
          body: "<p>A complete estimate stacks five layers: <strong>materials</strong> (from your takeoff, with waste and tax), <strong>labor</strong> (crew hours × loaded rate — wages plus payroll taxes, comp and benefits), <strong>equipment</strong> (dumpsters, cranes, kettles, lifts), <strong>subcontractors</strong>, and <strong>job-specific costs</strong> (permits, disposal by the ton, travel, steep/high charges). Productivity rates — squares per crew-day by material and pitch — are the heart of labor pricing; track your own on every job, because your numbers beat any book's.</p>"
        },
        {
          h: "Overhead and profit",
          body: "<p><strong>Overhead is not profit.</strong> Rent, trucks, insurance, office staff, advertising, and your salary must be recovered on every job — typically applied as a percentage markup on direct costs (many roofing companies run 15–30% overhead). Profit is what's left after ALL costs, direct and indirect. Price = direct cost × (1 + overhead %) × (1 + profit %). Cutting price comes straight out of profit: at 10% net margin, a 5% discount gives away half your profit.</p>"
        },
        {
          h: "Bidding strategy",
          body: "<p>Know your break-even before you negotiate. Qualify jobs — the wrong customer at the right price is still a loss. Put scope in writing: exactly what's included, what's excluded, unit prices for hidden conditions (decking, fascia), and payment terms. Track your bid-hit ratio by job type; winning everything means you're too cheap. Turn the estimate into a contract, and never start work on a handshake.</p>"
        }
      ],
      quiz: [
        { q: "A 'loaded' labor rate includes:", a: ["Base wage only", "Wage plus payroll taxes, workers' comp and benefits", "Wage plus profit", "Overtime only"], correct: 1 },
        { q: "Overhead is:", a: ["The same as profit", "Indirect cost of running the business, recovered on every job", "Only office rent", "Optional on small jobs"], correct: 1 },
        { q: "At a 10% net margin, giving a 5% discount costs you:", a: ["5% of profit", "Nothing", "About half your profit", "Only overhead"], correct: 2 },
        { q: "Hidden conditions like rotten decking are best handled by:", a: ["Eating the cost", "Verbal promises", "Unit prices written into the contract", "Ignoring them"], correct: 2 },
        { q: "Winning nearly every bid you submit usually means:", a: ["Great salesmanship", "Your prices are too low", "The market is hot", "Your overhead is zero"], correct: 1 }
      ]
    }
  ],
  finalExam: {
    title: "Final Exam",
    intro: "Twelve questions drawn from across the course. Score 70% or better to complete the course.",
    quiz: [
      { q: "Plan area 1,500 sq ft at 6/12 slope (factor 1.118). Actual area is about:", a: ["1,500 sq ft", "1,677 sq ft", "1,342 sq ft", "2,236 sq ft"], correct: 1 },
      { q: "Underlayment always laps so water sheds:", a: ["Under the course below", "Over the course below", "Sideways only", "Into the valley"], correct: 1 },
      { q: "The primary waterproofing in a tile roof system is:", a: ["The tile", "The underlayment", "The battens", "The ridge mortar"], correct: 1 },
      { q: "Standard bundles per square for laminated shingles:", a: ["2", "3", "4", "5"], correct: 1 },
      { q: "Shakes require an 18\" felt interlay because they are:", a: ["Sawn smooth", "Split and thicker, with open keyways", "Made of metal", "Pre-painted"], correct: 1 },
      { q: "Slate and tile bids must start by verifying:", a: ["Paint color", "Structural capacity for the weight", "Gutter size", "Attic insulation brand"], correct: 1 },
      { q: "The premium metal system with concealed clips and thermal movement is:", a: ["Exposed-fastener R-panel", "Standing seam", "Corrugated", "5V-crimp"], correct: 1 },
      { q: "A built-up roof consists of:", a: ["Single membrane", "Alternating felt plies and bitumen", "Wood boards", "Foam only"], correct: 1 },
      { q: "The heat-weldable membrane preferred for grease exposure is:", a: ["EPDM", "PVC", "Felt", "BUR"], correct: 1 },
      { q: "Step flashing is used:", a: ["At eaves", "Where shingles meet a sloped wall, one piece per course", "Only on flat roofs", "Under ridge caps"], correct: 1 },
      { q: "Balanced ventilation pairs:", a: ["Two exhaust types", "Soffit intake with ridge exhaust", "Fans with turbines", "No intake, all exhaust"], correct: 1 },
      { q: "Price = direct cost × (1 + overhead%) × (1 + profit%). Skipping the overhead markup means:", a: ["More profit", "The business's fixed costs eat the job's profit", "Lower taxes", "Faster jobs"], correct: 1 }
    ]
  }
};
