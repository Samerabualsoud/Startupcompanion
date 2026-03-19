/**
 * Full Toolkit PDF Report Generator
 * Compiles: Startup Profile + Valuation + Fundraising Readiness + Pitch Deck Score + Dilution Table
 * Uses browser print-to-PDF via a styled HTML page
 * Design: "Venture Capital Clarity" — Editorial Finance
 */

import { formatCurrency, type StartupInputs, type ValuationSummary } from './valuation';
import type { StartupSnapshot } from '@/contexts/StartupContext';

export interface ReadinessData {
  score: number;
  maxScore: number;
  pct: number;
  checkedItems: string[];
  totalItems: number;
}

export interface PitchScoreData {
  totalScore: number;
  maxScore: number;
  pct: number;
  slideScores: { slide: string; score: number; max: number }[];
}

export interface DilutionRoundData {
  stage: string;
  founders: { name: string; pct: number; value: number }[];
  investorPct: number;
  postMoney: number;
  raised: number;
}

export interface FullReportData {
  companyName: string;
  profile?: StartupSnapshot | null;
  valuation?: { inputs: StartupInputs; summary: ValuationSummary } | null;
  readiness?: ReadinessData | null;
  pitchScore?: PitchScoreData | null;
  dilution?: DilutionRoundData[] | null;
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', sans-serif; color: #1a2a3a; background: #fff; font-size: 11px; line-height: 1.55; }
  .page { max-width: 820px; margin: 0 auto; padding: 40px 48px; }

  /* Cover */
  .cover { background: #0F1B2D; color: #FAF6EF; padding: 56px 48px; margin: -40px -48px 40px; page-break-after: avoid; }
  .cover .eyebrow { font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase; color: #C4614A; margin-bottom: 10px; }
  .cover h1 { font-family: 'DM Sans', sans-serif; font-size: 36px; font-weight: 700; margin-bottom: 6px; }
  .cover .subtitle { font-size: 13px; color: rgba(250,246,239,0.55); margin-bottom: 24px; }
  .cover-metrics { display: flex; gap: 24px; flex-wrap: wrap; }
  .cover-metric { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; padding: 14px 20px; min-width: 140px; }
  .cover-metric .cm-label { font-family: 'JetBrains Mono', monospace; font-size: 8px; letter-spacing: 0.12em; text-transform: uppercase; color: #C4614A; margin-bottom: 4px; }
  .cover-metric .cm-value { font-family: 'JetBrains Mono', monospace; font-size: 20px; font-weight: 700; color: #FAF6EF; }
  .cover-metric .cm-sub { font-size: 9px; color: rgba(250,246,239,0.4); margin-top: 2px; }

  /* Section */
  .section { margin-bottom: 32px; page-break-inside: avoid; }
  .section-header { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #C4614A; }
  .section-num { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #C4614A; font-weight: 700; }
  .section-title { font-family: 'DM Sans', sans-serif; font-size: 16px; font-weight: 600; color: #0F1B2D; }

  /* Tables */
  table { width: 100%; border-collapse: collapse; font-size: 10px; }
  th { background: #0F1B2D; color: #FAF6EF; padding: 8px 10px; text-align: left; font-weight: 600; font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; }
  td { padding: 7px 10px; border-bottom: 1px solid #ede8e0; vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  tr:nth-child(even) td { background: #faf7f3; }
  .num { text-align: right; font-family: 'JetBrains Mono', monospace; font-weight: 600; }
  .highlight-row td { background: #0F1B2D !important; color: #FAF6EF; font-weight: 700; }
  .highlight-row .num { color: #C4614A; font-size: 12px; }

  /* Metrics grid */
  .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
  .metrics-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
  .metric-card { background: #f8f5f0; border: 1px solid #e8e0d5; border-radius: 6px; padding: 10px 12px; }
  .metric-label { font-size: 8px; text-transform: uppercase; letter-spacing: 0.1em; color: #888; margin-bottom: 3px; }
  .metric-value { font-family: 'JetBrains Mono', monospace; font-size: 15px; font-weight: 700; color: #0F1B2D; }
  .metric-sub { font-size: 9px; color: #aaa; margin-top: 2px; }

  /* Score bars */
  .score-bar-wrap { margin-bottom: 8px; }
  .score-bar-label { display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 3px; }
  .score-bar-track { height: 6px; background: #ede8e0; border-radius: 3px; overflow: hidden; }
  .score-bar-fill { height: 100%; border-radius: 3px; }

  /* Readiness */
  .readiness-badge { display: inline-flex; align-items: center; gap: 10px; background: #f8f5f0; border: 1px solid #e8e0d5; border-radius: 8px; padding: 12px 20px; margin-bottom: 16px; }
  .rb-score { font-family: 'JetBrains Mono', monospace; font-size: 28px; font-weight: 700; color: #0F1B2D; }
  .rb-label { font-size: 10px; color: #888; }

  /* Two col */
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

  /* Info row */
  .info-row { display: flex; gap: 6px; margin-bottom: 6px; }
  .info-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: #888; min-width: 110px; }
  .info-value { font-size: 10px; font-weight: 600; color: #0F1B2D; }

  /* Tag */
  .tag { display: inline-block; background: #f0ede8; border: 1px solid #ddd8d0; border-radius: 4px; padding: 2px 8px; font-size: 9px; font-weight: 600; color: #555; margin-right: 4px; }

  /* Disclaimer */
  .disclaimer { background: #f0ede8; border: 1px solid #ddd8d0; border-radius: 6px; padding: 12px 16px; font-size: 9px; color: #888; line-height: 1.6; margin-top: 24px; }

  /* Footer */
  .footer { margin-top: 32px; padding-top: 14px; border-top: 1px solid #ede8e0; display: flex; justify-content: space-between; font-size: 9px; color: #aaa; font-family: 'JetBrains Mono', monospace; }

  /* Empty section notice */
  .empty-notice { background: #fafaf8; border: 1px dashed #ddd8d0; border-radius: 6px; padding: 14px 16px; font-size: 10px; color: #aaa; text-align: center; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { padding: 0; }
    .cover { margin: 0 0 40px; }
    .section { page-break-inside: avoid; }
  }
`;

function scoreColor(pct: number) {
  if (pct >= 75) return '#10B981';
  if (pct >= 50) return '#F59E0B';
  return '#C4614A';
}

function fmt(v: number | null | undefined, compact = true): string {
  if (v == null || isNaN(v)) return '—';
  return formatCurrency(v, compact);
}

function fmtPct(v: number | null | undefined): string {
  if (v == null || isNaN(v)) return '—';
  return `${v.toFixed(1)}%`;
}

function fmtNum(v: number | null | undefined): string {
  if (v == null || isNaN(v)) return '—';
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return v.toLocaleString();
}

export function generateFullReport(data: FullReportData): void {
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const p = data.profile;
  const name = p?.companyName || data.companyName || 'Your Startup';

  // ── Cover metrics ──────────────────────────────────────────────────────────
  const coverMetrics: string[] = [];

  // Always show stage + sector from profile if available
  if (p?.stage || p?.sector) {
    coverMetrics.push(`
      <div class="cover-metric">
        <div class="cm-label">Stage · Sector</div>
        <div class="cm-value" style="font-size:13px; line-height:1.3">${p?.stage ? p.stage.replace('-', ' ').toUpperCase() : '—'}</div>
        <div class="cm-sub">${p?.sector || '—'}</div>
      </div>
    `);
  }

  // ARR from profile or valuation inputs
  const arr = p?.currentARR ?? data.valuation?.inputs.currentARR ?? null;
  if (arr != null) {
    coverMetrics.push(`
      <div class="cover-metric">
        <div class="cm-label">Current ARR</div>
        <div class="cm-value">${fmt(arr)}</div>
        <div class="cm-sub">${p?.revenueGrowthRate != null ? `${p.revenueGrowthRate}% YoY growth` : data.valuation?.inputs.revenueGrowthRate != null ? `${data.valuation.inputs.revenueGrowthRate}% YoY` : ''}</div>
      </div>
    `);
  }

  if (data.valuation) {
    const { summary } = data.valuation;
    coverMetrics.push(`
      <div class="cover-metric">
        <div class="cm-label">Blended Valuation</div>
        <div class="cm-value">${fmt(summary.blended)}</div>
        <div class="cm-sub">Confidence: ${summary.confidenceScore}%</div>
      </div>
    `);
  }

  if (data.readiness) {
    coverMetrics.push(`
      <div class="cover-metric">
        <div class="cm-label">Fundraising Readiness</div>
        <div class="cm-value" style="color:${scoreColor(data.readiness.pct)}">${data.readiness.pct.toFixed(0)}%</div>
        <div class="cm-sub">${data.readiness.checkedItems.length} / ${data.readiness.totalItems} checks</div>
      </div>
    `);
  }

  if (data.pitchScore) {
    coverMetrics.push(`
      <div class="cover-metric">
        <div class="cm-label">Pitch Deck Score</div>
        <div class="cm-value" style="color:${scoreColor(data.pitchScore.pct)}">${data.pitchScore.pct.toFixed(0)}%</div>
        <div class="cm-sub">${data.pitchScore.totalScore} / ${data.pitchScore.maxScore} pts</div>
      </div>
    `);
  }

  if (data.dilution && data.dilution.length > 1) {
    const last = data.dilution[data.dilution.length - 1];
    coverMetrics.push(`
      <div class="cover-metric">
        <div class="cm-label">Final Post-Money</div>
        <div class="cm-value">${fmt(last.postMoney)}</div>
        <div class="cm-sub">${data.dilution.length - 1} rounds modelled</div>
      </div>
    `);
  }

  // ── Section 1: Startup Profile ─────────────────────────────────────────────
  let sectionNum = 1;
  let profileSection = '';
  if (p) {
    const hasFinancials = p.currentARR != null || p.mrr != null || p.monthlyBurnRate != null || p.cashOnHand != null || p.grossMargin != null;
    const hasTraction = p.numberOfCustomers != null || p.monthlyActiveUsers != null || p.churnRate != null || p.ltv != null || p.cac != null;

    profileSection = `
      <div class="section">
        <div class="section-header">
          <span class="section-num">0${sectionNum++}</span>
          <span class="section-title">Company Overview — ${name}</span>
        </div>
        <div class="two-col" style="margin-bottom:16px;">
          <div>
            ${p.tagline ? `<p style="font-size:12px; font-style:italic; color:#444; margin-bottom:10px;">"${p.tagline}"</p>` : ''}
            ${p.description ? `<p style="font-size:10px; color:#555; line-height:1.6; margin-bottom:10px;">${p.description.slice(0, 400)}${p.description.length > 400 ? '…' : ''}</p>` : ''}
            <div class="info-row"><span class="info-label">Sector</span><span class="info-value">${p.sector || '—'}</span></div>
            <div class="info-row"><span class="info-label">Stage</span><span class="info-value">${p.stage ? p.stage.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '—'}</span></div>
            <div class="info-row"><span class="info-label">Location</span><span class="info-value">${[p.city, p.country].filter(Boolean).join(', ') || '—'}</span></div>
            <div class="info-row"><span class="info-label">Founded</span><span class="info-value">${p.foundedYear || '—'}</span></div>
            <div class="info-row"><span class="info-label">Incorporation</span><span class="info-value">${[p.incorporationType, p.incorporationCountry].filter(Boolean).join(' · ') || '—'}</span></div>
            ${p.websiteUrl ? `<div class="info-row"><span class="info-label">Website</span><span class="info-value">${p.websiteUrl}</span></div>` : ''}
          </div>
          <div>
            ${p.problem ? `<div style="margin-bottom:10px;"><div style="font-size:8px; text-transform:uppercase; letter-spacing:0.1em; color:#C4614A; margin-bottom:4px; font-weight:700;">Problem</div><p style="font-size:10px; color:#555; line-height:1.5;">${p.problem.slice(0, 200)}${p.problem.length > 200 ? '…' : ''}</p></div>` : ''}
            ${p.solution ? `<div style="margin-bottom:10px;"><div style="font-size:8px; text-transform:uppercase; letter-spacing:0.1em; color:#2D4A6B; margin-bottom:4px; font-weight:700;">Solution</div><p style="font-size:10px; color:#555; line-height:1.5;">${p.solution.slice(0, 200)}${p.solution.length > 200 ? '…' : ''}</p></div>` : ''}
            ${p.businessModel ? `<div><div style="font-size:8px; text-transform:uppercase; letter-spacing:0.1em; color:#888; margin-bottom:4px; font-weight:700;">Business Model</div><p style="font-size:10px; color:#555; line-height:1.5;">${p.businessModel.slice(0, 150)}${p.businessModel.length > 150 ? '…' : ''}</p></div>` : ''}
          </div>
        </div>
        ${hasFinancials ? `
        <div class="metrics-grid" style="grid-template-columns: repeat(${[p.currentARR, p.mrr, p.monthlyBurnRate, p.cashOnHand, p.grossMargin, p.totalRaised].filter(v => v != null).length > 4 ? 6 : 4}, 1fr);">
          ${p.currentARR != null ? `<div class="metric-card"><div class="metric-label">ARR</div><div class="metric-value">${fmt(p.currentARR)}</div>${p.revenueGrowthRate != null ? `<div class="metric-sub">${p.revenueGrowthRate}% YoY</div>` : ''}</div>` : ''}
          ${p.mrr != null ? `<div class="metric-card"><div class="metric-label">MRR</div><div class="metric-value">${fmt(p.mrr)}</div></div>` : ''}
          ${p.monthlyBurnRate != null ? `<div class="metric-card"><div class="metric-label">Monthly Burn</div><div class="metric-value">${fmt(p.monthlyBurnRate)}</div></div>` : ''}
          ${p.cashOnHand != null ? `<div class="metric-card"><div class="metric-label">Cash on Hand</div><div class="metric-value">${fmt(p.cashOnHand)}</div>${p.monthlyBurnRate != null && p.cashOnHand != null ? `<div class="metric-sub">${Math.round(p.cashOnHand / p.monthlyBurnRate)} mo runway</div>` : ''}</div>` : ''}
          ${p.grossMargin != null ? `<div class="metric-card"><div class="metric-label">Gross Margin</div><div class="metric-value">${fmtPct(p.grossMargin)}</div></div>` : ''}
          ${p.totalRaised != null ? `<div class="metric-card"><div class="metric-label">Total Raised</div><div class="metric-value">${fmt(p.totalRaised)}</div></div>` : ''}
        </div>` : ''}
        ${hasTraction ? `
        <div class="metrics-grid-3">
          ${p.numberOfCustomers != null ? `<div class="metric-card"><div class="metric-label">Customers</div><div class="metric-value">${fmtNum(p.numberOfCustomers)}</div></div>` : ''}
          ${p.monthlyActiveUsers != null ? `<div class="metric-card"><div class="metric-label">MAU</div><div class="metric-value">${fmtNum(p.monthlyActiveUsers)}</div></div>` : ''}
          ${p.churnRate != null ? `<div class="metric-card"><div class="metric-label">Monthly Churn</div><div class="metric-value">${fmtPct(p.churnRate)}</div></div>` : ''}
          ${p.ltv != null ? `<div class="metric-card"><div class="metric-label">LTV</div><div class="metric-value">${fmt(p.ltv)}</div></div>` : ''}
          ${p.cac != null ? `<div class="metric-card"><div class="metric-label">CAC</div><div class="metric-value">${fmt(p.cac)}</div></div>` : ''}
          ${p.ltv != null && p.cac != null && p.cac > 0 ? `<div class="metric-card"><div class="metric-label">LTV:CAC</div><div class="metric-value">${(p.ltv / p.cac).toFixed(1)}x</div></div>` : ''}
        </div>` : ''}
        ${p.teamMembers && p.teamMembers.length > 0 ? `
        <div style="margin-top:12px;">
          <div style="font-size:9px; text-transform:uppercase; letter-spacing:0.1em; color:#888; margin-bottom:8px; font-weight:700;">Founding Team</div>
          <div style="display:flex; gap:12px; flex-wrap:wrap;">
            ${p.teamMembers.slice(0, 6).map(m => `
              <div style="background:#f8f5f0; border:1px solid #e8e0d5; border-radius:6px; padding:8px 12px; min-width:120px;">
                <div style="font-size:10px; font-weight:700; color:#0F1B2D;">${m.name}</div>
                <div style="font-size:9px; color:#888;">${m.role}</div>
                ${m.equityPercent != null && m.equityPercent > 0 ? `<div style="font-family:'JetBrains Mono',monospace; font-size:9px; color:#C4614A; margin-top:2px;">${m.equityPercent.toFixed(1)}%</div>` : ''}
              </div>
            `).join('')}
          </div>
        </div>` : ''}
      </div>
    `;
  }

  // ── Section 2: Valuation ───────────────────────────────────────────────────
  let valuationSection = '';
  if (data.valuation) {
    const { inputs, summary } = data.valuation;
    const methodRows = summary.results.map(r => `
      <tr>
        <td>${r.method}</td>
        <td class="num">${fmt(r.value)}</td>
        <td class="num">${fmt(r.low)} – ${fmt(r.high)}</td>
        <td class="num">${r.confidence}%</td>
        <td class="num">${r.applicability}%</td>
      </tr>
    `).join('');

    valuationSection = `
      <div class="section">
        <div class="section-header">
          <span class="section-num">0${sectionNum++}</span>
          <span class="section-title">Valuation Analysis — ${inputs.companyName || name}</span>
        </div>
        <div class="metrics-grid">
          <div class="metric-card"><div class="metric-label">Current ARR</div><div class="metric-value">${fmt(inputs.currentARR)}</div><div class="metric-sub">${inputs.revenueGrowthRate}% YoY</div></div>
          <div class="metric-card"><div class="metric-label">Runway</div><div class="metric-value">${summary.runway === 999 ? '∞' : summary.runway} mo</div><div class="metric-sub">${fmt(inputs.burnRate)}/mo burn</div></div>
          <div class="metric-card"><div class="metric-label">Gross Margin</div><div class="metric-value">${inputs.grossMargin}%</div></div>
          <div class="metric-card"><div class="metric-label">TAM</div><div class="metric-value">${fmt(inputs.totalAddressableMarket)}</div></div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Valuation Method</th>
              <th style="text-align:right">Value</th>
              <th style="text-align:right">Range</th>
              <th style="text-align:right">Confidence</th>
              <th style="text-align:right">Applicability</th>
            </tr>
          </thead>
          <tbody>
            ${methodRows}
            <tr class="highlight-row">
              <td>Blended (Weighted Average)</td>
              <td class="num">${fmt(summary.blended)}</td>
              <td class="num" style="color:#FAF6EF">${fmt(summary.weightedLow)} – ${fmt(summary.weightedHigh)}</td>
              <td class="num" style="color:#FAF6EF">${summary.confidenceScore}%</td>
              <td class="num" style="color:#FAF6EF">—</td>
            </tr>
          </tbody>
        </table>
        <div style="margin-top:10px; padding:10px 14px; background:#f8f5f0; border-radius:6px; font-size:10px; color:#555; line-height:1.6;">
          <strong>Analyst Note:</strong> ${summary.riskLevel} risk profile. Blended confidence: ${summary.confidenceScore}%. Implied ARR multiple: ${summary.impliedARRMultiple}x. Burn multiple: ${summary.burnMultiple}x.
        </div>
        <div style="margin-top:10px; padding:10px 14px; background:#fff8f0; border:1px solid #f0d9c0; border-radius:6px; font-size:9px; color:#7a5c3a; line-height:1.6;">
          <strong>Important Context:</strong> This is a <em>pre-money estimate</em> based on your inputs — not a guaranteed investor offer. Actual deal valuations depend on investor thesis, due diligence, market conditions, and negotiation. For ${inputs.stage} stage ${inputs.sector} startups in MENA, typical pre-money valuations range from $500K–$3M (Pre-Seed), $2M–$8M (Seed), and $10M–$30M (Series A). Use this estimate as a starting point for conversations, not as a final number.
        </div>
      </div>
    `;
  } else if (!p) {
    valuationSection = `
      <div class="section">
        <div class="section-header">
          <span class="section-num">0${sectionNum++}</span>
          <span class="section-title">Valuation Analysis</span>
        </div>
        <div class="empty-notice">Complete the Valuation Calculator chat flow to include a full valuation analysis in this report.</div>
      </div>
    `;
  }

  // ── Section 3: Fundraising Readiness ──────────────────────────────────────
  let readinessSection = '';
  if (data.readiness) {
    const { pct, checkedItems, totalItems } = data.readiness;
    const level = pct >= 80 ? 'Investor-Ready' : pct >= 60 ? 'Nearly Ready' : pct >= 40 ? 'Getting There' : 'Early Stage';
    readinessSection = `
      <div class="section">
        <div class="section-header">
          <span class="section-num">0${sectionNum++}</span>
          <span class="section-title">Fundraising Readiness Assessment</span>
        </div>
        <div class="readiness-badge">
          <div>
            <div class="rb-score" style="color:${scoreColor(pct)}">${pct.toFixed(0)}%</div>
            <div class="rb-label">${level} · ${checkedItems.length} of ${totalItems} criteria met</div>
          </div>
          <div style="flex:1; max-width:200px;">
            <div class="score-bar-track" style="height:10px;">
              <div class="score-bar-fill" style="width:${pct}%; background:${scoreColor(pct)}"></div>
            </div>
          </div>
        </div>
        <p style="font-size:10px; color:#666; margin-bottom:12px;">
          ${pct >= 80 ? 'Your startup shows strong signals of investor readiness. Focus on polishing your data room and practicing your pitch.' :
            pct >= 60 ? 'You\'re close to investor-ready. Address the remaining gaps — especially around traction metrics and legal structure.' :
            pct >= 40 ? 'Good progress, but several key areas need attention before approaching institutional investors.' :
            'Focus on building core fundamentals before fundraising: product-market fit, team, and initial traction.'}
        </p>
        <p style="font-size:10px; color:#888;"><strong>Criteria met (${checkedItems.length}):</strong> ${checkedItems.slice(0, 15).join(' · ')}${checkedItems.length > 15 ? ` · +${checkedItems.length - 15} more` : ''}</p>
      </div>
    `;
  } else {
    readinessSection = `
      <div class="section">
        <div class="section-header">
          <span class="section-num">0${sectionNum++}</span>
          <span class="section-title">Fundraising Readiness Assessment</span>
        </div>
        <div class="empty-notice">Open the Fundraising Readiness tool and complete the checklist to include your readiness score in this report.</div>
      </div>
    `;
  }

  // ── Section 4: Pitch Deck Scorecard ───────────────────────────────────────
  let pitchSection = '';
  if (data.pitchScore && data.pitchScore.slideScores.length > 0) {
    const bars = data.pitchScore.slideScores.map(s => {
      const pct = s.max > 0 ? (s.score / s.max) * 100 : 0;
      return `
        <div class="score-bar-wrap">
          <div class="score-bar-label">
            <span>${s.slide}</span>
            <span style="font-family:'JetBrains Mono',monospace; font-weight:600; color:${scoreColor(pct)}">${s.score}/${s.max}</span>
          </div>
          <div class="score-bar-track">
            <div class="score-bar-fill" style="width:${pct}%; background:${scoreColor(pct)}"></div>
          </div>
        </div>
      `;
    }).join('');

    pitchSection = `
      <div class="section">
        <div class="section-header">
          <span class="section-num">0${sectionNum++}</span>
          <span class="section-title">Pitch Deck Scorecard</span>
        </div>
        <div style="display:flex; align-items:center; gap:16px; margin-bottom:16px; padding:12px 16px; background:#f8f5f0; border-radius:8px;">
          <div style="text-align:center; min-width:80px;">
            <div style="font-family:'JetBrains Mono',monospace; font-size:28px; font-weight:700; color:${scoreColor(data.pitchScore.pct)}">${data.pitchScore.pct.toFixed(0)}%</div>
            <div style="font-size:9px; color:#888;">Overall Score</div>
          </div>
          <div style="flex:1;">${bars}</div>
        </div>
      </div>
    `;
  } else {
    pitchSection = `
      <div class="section">
        <div class="section-header">
          <span class="section-num">0${sectionNum++}</span>
          <span class="section-title">Pitch Deck Scorecard</span>
        </div>
        <div class="empty-notice">Open the Pitch Deck Scorecard tool and rate your slides to include your pitch score in this report.</div>
      </div>
    `;
  }

  // ── Section 5: Dilution Table ──────────────────────────────────────────────
  let dilutionSection = '';
  if (data.dilution && data.dilution.length > 1) {
    const founderNames = data.dilution[0].founders.map(f => f.name);
    const headerCols = founderNames.map(n => `<th style="text-align:right">${n}</th>`).join('');
    const rows = data.dilution.map((s, i) => {
      const founderCols = s.founders.map(f => `
        <td class="num">
          ${f.pct.toFixed(1)}%
          <div style="font-size:8px; color:#aaa; font-family:'JetBrains Mono',monospace;">${fmt(f.value)}</div>
        </td>
      `).join('');
      return `
        <tr>
          <td><strong>${s.stage}</strong></td>
          ${founderCols}
          <td class="num">${s.investorPct.toFixed(1)}%</td>
          <td class="num">${fmt(s.postMoney)}</td>
          <td class="num">${i === 0 ? '—' : fmt(s.raised)}</td>
        </tr>
      `;
    }).join('');

    dilutionSection = `
      <div class="section">
        <div class="section-header">
          <span class="section-num">0${sectionNum++}</span>
          <span class="section-title">Dilution Simulation</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Stage</th>
              ${headerCols}
              <th style="text-align:right">Investors</th>
              <th style="text-align:right">Post-Money</th>
              <th style="text-align:right">Raised</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="font-size:9px; color:#888; margin-top:8px; line-height:1.5;">
          Note: Models economic dilution only. Actual ownership depends on option pool refreshes, convertible notes, SAFEs, and pro-rata rights.
        </p>
      </div>
    `;
  } else {
    dilutionSection = `
      <div class="section">
        <div class="section-header">
          <span class="section-num">0${sectionNum++}</span>
          <span class="section-title">Dilution Simulation</span>
        </div>
        <div class="empty-notice">Open the Dilution Simulator, add your founders and funding rounds, to include a dilution table in this report.</div>
      </div>
    `;
  }

  // ── Assemble HTML ──────────────────────────────────────────────────────────
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Startup Report — ${name}</title>
<style>${CSS}</style>
</head>
<body>
<div class="page">

  <div class="cover">
    <div class="eyebrow">Confidential Startup Report</div>
    <h1>${name}</h1>
    <div class="subtitle">Generated ${date} · Polaris Arabia${p?.country ? ` · ${p.country}` : ''}</div>
    <div class="cover-metrics">${coverMetrics.join('')}</div>
  </div>

  ${profileSection}
  ${valuationSection}
  ${readinessSection}
  ${pitchSection}
  ${dilutionSection}

  <div class="disclaimer">
    <strong>Disclaimer:</strong> This report is generated for informational and planning purposes only. All estimates are based on user-provided inputs and standard financial models. Actual valuations depend on negotiation, market conditions, investor thesis, due diligence, and other factors not captured here. This report does not constitute financial, legal, or investment advice. Consult a qualified advisor before making any investment decisions. Pre-money valuation estimates are not guaranteed investor offers.
  </div>

  <div class="footer">
    <span>Polaris Arabia</span>
    <span>${name} · ${date}</span>
    <span>CONFIDENTIAL</span>
  </div>

</div>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=950,height=750');
  if (!win) {
    alert('Please allow pop-ups to generate the PDF report.');
    return;
  }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 900);
}
