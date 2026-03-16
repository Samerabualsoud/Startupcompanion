# AI Startup Valuation Calculator — Design Brainstorm

## Approach A — "Precision Finance" (Brutalist Data Dashboard)
<response>
<text>
**Design Movement:** Neo-Brutalist Financial Terminal
**Core Principles:**
- Raw, unadorned data presentation — numbers are the hero
- High-contrast monochrome base with a single electric accent (neon green or amber)
- Dense information architecture: every pixel earns its place
- Monospaced type for all numeric values to evoke Bloomberg terminal aesthetics

**Color Philosophy:** Near-black (#0D0D0D) background, off-white (#F5F2E8) text, electric amber (#F5A623) as the sole accent. Evokes authority, precision, and urgency.

**Layout Paradigm:** Two-column split: left is a sticky input panel (dark), right is a live results panel (slightly lighter dark). No cards — just ruled lines and section dividers.

**Signature Elements:**
- Monospaced ticker-style number displays
- Horizontal rule separators with label stamps
- Blinking cursor on active input fields

**Interaction Philosophy:** Every input change triggers instant recalculation with a brief flash animation on updated values. No "Calculate" button — live reactive.

**Animation:** Number odometer roll-up on value change; subtle scan-line overlay on the results panel.

**Typography System:** `JetBrains Mono` for all numbers and labels; `Syne` bold for headings.
</text>
<probability>0.08</probability>
</response>

## Approach B — "Venture Capital Clarity" (Editorial Finance)
<response>
<text>
**Design Movement:** Editorial Finance / Swiss Grid
**Core Principles:**
- Clean asymmetric grid with deliberate negative space
- Data visualized through elegant charts, not raw tables
- Calm authority: deep navy + warm cream + a single coral/terracotta accent
- Progressive disclosure: complexity revealed step by step

**Color Philosophy:** Deep navy (#0F1B2D) for primary surfaces, warm cream (#FAF6EF) for backgrounds, terracotta (#C4614A) as accent. Communicates trust, sophistication, and warmth — the language of top-tier VC firms.

**Layout Paradigm:** Left sidebar for navigation between valuation methods; main content area with a top summary strip showing the blended valuation, then method-specific panels below. Sticky header with live valuation readout.

**Signature Elements:**
- Thin horizontal rule with section number stamps (01, 02, 03…)
- Radial gauge chart for confidence score
- Animated bar comparisons across methods

**Interaction Philosophy:** Tabbed method navigation; sliders for key inputs with live chart updates; tooltip explanations on hover for every financial term.

**Animation:** Smooth chart transitions (300ms ease-out); slide-in panels; number counter animations.

**Typography System:** `Playfair Display` for headings; `DM Sans` for body and labels; `JetBrains Mono` for all numeric outputs.
</text>
<probability>0.07</probability>
</response>

## Approach C — "Analytical Intelligence" (Dark Scientific Dashboard)
<response>
<text>
**Design Movement:** Scientific Instrument / Dark Analytics
**Core Principles:**
- Dark mode first, with layered depth (3 levels of surface darkness)
- Data-forward: charts and metrics dominate, inputs are secondary
- Accent system: electric blue (#3B82F6) for primary, emerald (#10B981) for positive, rose (#F43F5E) for risk
- Grid-based layout with clear visual hierarchy

**Color Philosophy:** Charcoal (#111827) base, slate (#1F2937) cards, cool gray (#374151) borders. Accent colors carry semantic meaning: blue = neutral/active, green = upside, red = risk. Inspired by Figma, Linear, and Vercel dashboards.

**Layout Paradigm:** Full-width header with live valuation summary; below: two-panel layout — left 40% for inputs (collapsible sections per method), right 60% for live results with charts. Mobile: stacked with sticky results summary at bottom.

**Signature Elements:**
- Glowing metric cards with subtle inner shadow
- Radar/spider chart for multi-method comparison
- Progress bars with gradient fill for scoring methods

**Interaction Philosophy:** Accordion-style input sections; all changes reflected live in the right panel; export to PDF button; scenario comparison toggle.

**Animation:** Framer Motion entrance animations; chart data transitions; hover glow on metric cards.

**Typography System:** `Space Grotesk` for headings and labels; `Inter` for body; `Fira Code` for numeric outputs.
</text>
<probability>0.09</probability>
</response>

---

## Selected Approach: **B — "Venture Capital Clarity" (Editorial Finance)**

Deep navy + warm cream + terracotta. Playfair Display headings, DM Sans body, JetBrains Mono for numbers. Asymmetric editorial layout with a sticky valuation summary header, left-side method navigation, and rich chart visualizations. This approach communicates the gravitas and precision that investors and founders expect from a serious valuation tool.
