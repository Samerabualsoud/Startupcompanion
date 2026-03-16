/**
 * Term Sheet Glossary & Red Flags
 * Plain-English explanations of 35+ VC term sheet terms
 */

export interface TermDefinition {
  term: string;
  category: 'economics' | 'control' | 'protection' | 'governance' | 'exit';
  plain: string;           // One-sentence plain English
  detail: string;          // 2-3 sentence explanation
  redFlag: boolean;
  redFlagReason?: string;
  founderTip?: string;
  example?: string;
}

export const TERM_SHEET_GLOSSARY: TermDefinition[] = [
  // ─── Economics ────────────────────────────────────────────────────────────
  {
    term: 'Pre-Money Valuation',
    category: 'economics',
    plain: 'What your company is worth BEFORE the investor puts in money.',
    detail: 'If an investor puts in $2M at a $8M pre-money valuation, the post-money valuation is $10M and the investor owns 20%. This is the number you negotiate hardest.',
    redFlag: false,
    founderTip: 'Always clarify whether a valuation is pre- or post-money. Some investors quote post-money to make the deal look bigger.',
    example: '$8M pre-money + $2M investment = $10M post-money, investor owns 20%',
  },
  {
    term: 'Post-Money Valuation',
    category: 'economics',
    plain: 'What your company is worth AFTER the investor puts in money.',
    detail: 'Post-money = Pre-money + Investment. Investors often quote post-money valuations because the number sounds larger. Make sure you know which one you\'re discussing.',
    redFlag: false,
    example: 'Pre-money $8M + $2M investment = Post-money $10M',
  },
  {
    term: 'Dilution',
    category: 'economics',
    plain: 'The reduction in your ownership percentage when new shares are issued.',
    detail: 'Every time you raise money or issue stock options, existing shareholders get diluted. If you own 100% and raise money at a 20% stake, you now own 80%. Over multiple rounds, founders typically end up owning 15-30% at IPO.',
    redFlag: false,
    founderTip: 'Model your dilution across all future rounds before agreeing to any single round. Use the dilution simulator in this tool.',
  },
  {
    term: 'Option Pool',
    category: 'economics',
    plain: 'A reserved block of shares set aside for future employee stock options.',
    detail: 'Investors often require a 10-20% option pool to be created BEFORE their investment, which dilutes founders (not investors). This is called the "option pool shuffle" and effectively lowers your pre-money valuation.',
    redFlag: true,
    redFlagReason: 'If the option pool is created pre-investment, it dilutes founders, not investors. Negotiate to create it post-investment or keep it smaller.',
    founderTip: 'Ask for the option pool to be created post-money, or negotiate a smaller pool (10% vs 20%).',
    example: 'A $10M pre-money with a 20% option pool created pre-investment effectively values the company at $8M for founders.',
  },
  {
    term: 'Liquidation Preference',
    category: 'economics',
    plain: 'Investors get paid back first in an exit before founders see any money.',
    detail: 'A 1x non-participating preference means investors get their money back first, then founders split the rest. A 2x preference means investors get 2x their money before founders get anything. Participating preferred means investors get their preference AND share in the remaining proceeds.',
    redFlag: true,
    redFlagReason: 'Participating preferred with a high multiple (2x+) can leave founders with nothing in a modest exit. Push for 1x non-participating.',
    founderTip: 'Always push for 1x non-participating liquidation preference. Anything above 1x or "participating" is founder-unfriendly.',
    example: 'Investor puts in $5M with 2x participating preferred. In a $15M exit, investor gets $10M first, then 30% of remaining $5M = $11.5M total. Founders split $3.5M.',
  },
  {
    term: 'Participating Preferred',
    category: 'economics',
    plain: 'Investors get their money back AND share in the remaining proceeds — they get paid twice.',
    detail: 'This is one of the most founder-unfriendly terms. After getting their liquidation preference, participating preferred investors also participate in the remaining proceeds as if they had converted to common stock.',
    redFlag: true,
    redFlagReason: 'Participating preferred is often called "double-dipping." It significantly reduces founder proceeds in exits below a certain threshold.',
    founderTip: 'Negotiate for non-participating preferred, or add a cap (e.g., 3x) after which it converts to common.',
  },
  {
    term: 'Anti-Dilution Protection',
    category: 'protection',
    plain: 'Protects investors if you raise money at a lower valuation in the future (a "down round").',
    detail: 'Full ratchet anti-dilution reprices all investor shares to the new lower price — very bad for founders. Weighted average anti-dilution is more common and fairer, adjusting the conversion price based on how many shares were sold at the lower price.',
    redFlag: true,
    redFlagReason: 'Full ratchet anti-dilution is extremely founder-unfriendly. Insist on broad-based weighted average instead.',
    founderTip: 'Only accept "broad-based weighted average" anti-dilution. Never accept "full ratchet."',
    example: 'You raised at $10/share. Next round is at $5/share. Full ratchet: all previous investor shares reprice to $5 (massive dilution for founders). Weighted average: partial adjustment based on volume.',
  },
  {
    term: 'Valuation Cap',
    category: 'economics',
    plain: 'The maximum valuation at which a SAFE or convertible note converts into equity.',
    detail: 'Used in SAFEs and convertible notes. If you raise a SAFE with a $5M cap and later raise a priced round at $20M, the SAFE holder converts at $5M — getting 4x more shares than new investors. This rewards early risk-takers.',
    redFlag: false,
    founderTip: 'Set your SAFE cap at a realistic future valuation. Too low and you over-dilute yourself; too high and early investors won\'t bite.',
  },
  {
    term: 'Discount Rate (SAFE/Note)',
    category: 'economics',
    plain: 'A reward for early investors — they convert at a lower price than new investors.',
    detail: 'A 20% discount means early investors convert their note into equity at 80% of the price new investors pay. This is separate from the valuation cap — investors usually get whichever gives them more shares.',
    redFlag: false,
    example: 'New investors pay $1/share. Note holder with 20% discount converts at $0.80/share.',
  },
  {
    term: 'SAFE (Simple Agreement for Future Equity)',
    category: 'economics',
    plain: 'A simple investment instrument where investors give you money now and get equity later when you raise a priced round.',
    detail: 'Created by Y Combinator. No interest, no maturity date, no debt. Converts to equity at the next priced round based on the cap and/or discount. Very founder-friendly for early rounds.',
    redFlag: false,
    founderTip: 'SAFEs are generally founder-friendly. Watch out for "post-money SAFEs" (YC\'s current standard) vs "pre-money SAFEs" — post-money SAFEs are more dilutive to founders.',
  },
  {
    term: 'Convertible Note',
    category: 'economics',
    plain: 'A loan that converts into equity at a future round, with interest.',
    detail: 'Unlike a SAFE, a convertible note is debt with an interest rate (typically 5-8%) and a maturity date. If you don\'t raise before the maturity date, the note holder can demand repayment. Less founder-friendly than a SAFE.',
    redFlag: false,
    founderTip: 'Prefer SAFEs over convertible notes. If you must use a note, negotiate a long maturity date (24+ months) and automatic conversion.',
  },

  // ─── Control ──────────────────────────────────────────────────────────────
  {
    term: 'Board Seat',
    category: 'control',
    plain: 'The investor gets a seat on your board of directors and votes on major company decisions.',
    detail: 'Board composition is critical. A typical early-stage board is 2 founders + 1 investor + 1 independent. Watch out for investors demanding majority board control — they could override founder decisions.',
    redFlag: true,
    redFlagReason: 'If investors get majority board control early, they can fire founders, block acquisitions, or force decisions against founder interests.',
    founderTip: 'Maintain board control in early rounds. Aim for 2 founder seats, 1 investor seat, and 1 neutral independent you choose.',
  },
  {
    term: 'Protective Provisions',
    category: 'control',
    plain: 'A list of actions the company cannot take without investor approval.',
    detail: 'Standard protective provisions include: selling the company, raising more money, changing the charter, issuing new shares. These are generally reasonable. Watch out for overly broad provisions that require investor approval for routine business decisions.',
    redFlag: false,
    founderTip: 'Standard protective provisions are fine. Push back on any that require investor approval for day-to-day operations.',
  },
  {
    term: 'Drag-Along Rights',
    category: 'control',
    plain: 'If a majority of shareholders want to sell the company, they can force all other shareholders to sell too.',
    detail: 'This prevents a minority shareholder from blocking an acquisition. Generally reasonable, but watch out for drag-along rights held by investors alone — they could force a sale you don\'t want.',
    redFlag: true,
    redFlagReason: 'If investors have drag-along rights without founder consent, they could force a sale at a price that benefits them (due to liquidation preference) but leaves founders with little.',
    founderTip: 'Require that drag-along can only be triggered with both founder and investor consent, or by a supermajority including common shareholders.',
  },
  {
    term: 'Tag-Along Rights (Co-Sale)',
    category: 'control',
    plain: 'If a founder sells shares, investors have the right to sell their shares on the same terms.',
    detail: 'Protects investors from being left behind if a founder exits. Generally reasonable and standard.',
    redFlag: false,
  },
  {
    term: 'Right of First Refusal (ROFR)',
    category: 'control',
    plain: 'Before selling shares to a third party, you must offer them to existing investors first.',
    detail: 'Standard and generally reasonable. Prevents outside parties from buying into the company without existing investor knowledge.',
    redFlag: false,
    founderTip: 'ROFR is standard. Make sure it has a reasonable time window (30 days) and doesn\'t apply to small transfers like gifts to family.',
  },
  {
    term: 'Pro-Rata Rights',
    category: 'control',
    plain: 'The right to invest in future rounds to maintain their ownership percentage.',
    detail: 'Investors with pro-rata rights can invest in your Series A, B, etc. to avoid dilution. This is generally good — it signals investor confidence. But it can complicate future rounds if many investors exercise pro-rata.',
    redFlag: false,
    founderTip: 'Pro-rata is standard and generally fine. Be careful about giving "super pro-rata" rights which allow investors to buy MORE than their pro-rata share.',
  },

  // ─── Governance ───────────────────────────────────────────────────────────
  {
    term: 'Vesting Schedule',
    category: 'governance',
    plain: 'Founders and employees earn their equity over time, not all at once.',
    detail: 'Standard is 4-year vesting with a 1-year cliff: you earn 25% after 1 year, then 1/48th per month for 3 more years. This protects the company if a co-founder leaves early.',
    redFlag: false,
    founderTip: 'Negotiate for acceleration on change of control (double-trigger acceleration) — if the company is acquired AND you\'re fired, your unvested shares vest immediately.',
    example: '4-year vest, 1-year cliff: nothing for 12 months, then 25% vests, then 2.08%/month for 36 more months.',
  },
  {
    term: 'Cliff',
    category: 'governance',
    plain: 'A minimum time you must stay before any equity vests.',
    detail: 'A 1-year cliff means if you leave before 12 months, you get nothing. After the cliff, vesting continues monthly. Protects the company from co-founders who leave early.',
    redFlag: false,
  },
  {
    term: 'Double-Trigger Acceleration',
    category: 'governance',
    plain: 'Your unvested shares vest immediately if the company is acquired AND you\'re fired.',
    detail: 'Two triggers must happen: (1) acquisition and (2) involuntary termination. This protects founders from being fired after an acquisition before their equity vests. Always negotiate for this.',
    redFlag: false,
    founderTip: 'Always ask for double-trigger acceleration. Single-trigger (just acquisition) is less common but even better for founders.',
  },
  {
    term: 'Information Rights',
    category: 'governance',
    plain: 'Investors\' right to receive regular financial reports from the company.',
    detail: 'Standard information rights include monthly/quarterly financials and annual audited statements. Reasonable and expected. Watch out for overly broad information rights that require sharing competitive information.',
    redFlag: false,
  },

  // ─── Exit ─────────────────────────────────────────────────────────────────
  {
    term: 'IPO Ratchet',
    category: 'exit',
    plain: 'If the IPO price is below a certain level, investors get extra shares to compensate.',
    detail: 'Very founder-unfriendly. Essentially guarantees investors a minimum return at the expense of founders and employees.',
    redFlag: true,
    redFlagReason: 'IPO ratchets can massively dilute founders at the moment of IPO. Avoid entirely.',
    founderTip: 'Refuse IPO ratchets. They are rare but extremely harmful to founders.',
  },
  {
    term: 'Pay-to-Play',
    category: 'exit',
    plain: 'Investors who don\'t participate in future rounds lose some of their special rights.',
    detail: 'Actually founder-friendly! Investors who don\'t invest in future rounds convert their preferred shares to common, losing liquidation preferences and other protections. Incentivizes continued investor support.',
    redFlag: false,
    founderTip: 'Pay-to-play provisions are actually good for founders — they keep investors engaged and committed.',
  },
  {
    term: 'Redemption Rights',
    category: 'exit',
    plain: 'Investors can demand their money back after a certain period.',
    detail: 'Typically after 5-7 years, investors can demand redemption if there\'s been no exit. This creates pressure to sell or IPO. Can be catastrophic if the company is doing well but hasn\'t exited.',
    redFlag: true,
    redFlagReason: 'Redemption rights can force a premature sale or create financial distress. Push to remove entirely or extend the timeline significantly.',
    founderTip: 'Push to remove redemption rights entirely. If you must accept them, negotiate for 7+ years and require a supermajority vote to exercise.',
  },
  {
    term: 'No-Shop Clause',
    category: 'exit',
    plain: 'You agree not to talk to other investors while negotiating with this one.',
    detail: 'Standard in term sheets. Usually 30-60 days. Reasonable — investors don\'t want you shopping their term sheet to get a better deal.',
    redFlag: false,
    founderTip: 'No-shop clauses are standard. Keep the window short (30 days) and ensure it expires automatically.',
  },
];

export const TERM_CATEGORIES = [
  { id: 'all', label: 'All Terms' },
  { id: 'economics', label: 'Economics' },
  { id: 'control', label: 'Control' },
  { id: 'protection', label: 'Protection' },
  { id: 'governance', label: 'Governance' },
  { id: 'exit', label: 'Exit' },
];
