/**
 * Full Toolkit PDF Report Generator
 * Compiles: Valuation + Fundraising Readiness + Pitch Deck Score + Dilution Table
 * Uses browser print-to-PDF via a styled HTML page
 * Design: "Venture Capital Clarity" — Editorial Finance
 */

import { formatCurrency, type StartupInputs, type ValuationSummary } from './valuation';

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
  .cover h1 { font-family: 'Playfair Display', serif; font-size: 36px; font-weight: 700; margin-bottom: 6px; }
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
  .section-title { font-family: 'Playfair Display', serif; font-size: 16px; font-weight: 600; color: #0F1B2D; }

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

  /* Method card */
  .method-card { background: #faf7f3; border: 1px solid #ede8e0; border-radius: 6px; padding: 12px 14px; border-left: 3px solid #C4614A; margin-bottom: 10px; }
  .method-card h4 { font-family: 'Playfair Display', serif; font-size: 11px; font-weight: 600; color: #0F1B2D; margin-bottom: 4px; }
  .method-card .mc-val { font-family: 'JetBrains Mono', monospace; font-size: 16px; font-weight: 700; color: #C4614A; }
  .method-card .mc-range { font-size: 9px; color: #888; margin-top: 2px; }

  /* Disclaimer */
  .disclaimer { background: #f0ede8; border: 1px solid #ddd8d0; border-radius: 6px; padding: 12px 16px; font-size: 9px; color: #888; line-height: 1.6; margin-top: 24px; }

  /* Footer */
  .footer { margin-top: 32px; padding-top: 14px; border-top: 1px solid #ede8e0; display: flex; justify-content: space-between; font-size: 9px; color: #aaa; font-family: 'JetBrains Mono', monospace; }

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

export function generateFullReport(data: FullReportData): void {
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const name = data.companyName || 'Your Startup';

  // ── Cover metrics ──────────────────────────────────────────────────────────
  const coverMetrics: string[] = [];
  if (data.valuation) {
    const { summary } = data.valuation;
    coverMetrics.push(`
      <div class="cover-metric">
        <div class="cm-label">Blended Valuation</div>
        <div class="cm-value">${formatCurrency(summary.blended, true)}</div>
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
        <div class="cm-value">${formatCurrency(last.postMoney, true)}</div>
        <div class="cm-sub">${data.dilution.length - 1} rounds modelled</div>
      </div>
    `);
  }

  // ── Section 1: Valuation ───────────────────────────────────────────────────
  let sectionNum = 1;
  let valuationSection = '';
  if (data.valuation) {
    const { inputs, summary } = data.valuation;
    const methodRows = summary.results.map(r => `
      <tr>
        <td>${r.method}</td>
        <td class="num">${formatCurrency(r.value, true)}</td>
        <td class="num">${formatCurrency(r.low, true)} – ${formatCurrency(r.high, true)}</td>
        <td class="num">${r.confidence}%</td>
        <td class="num">${r.applicability}%</td>
      </tr>
    `).join('');

    valuationSection = `
      <div class="section">
        <div class="section-header">
          <span class="section-num">0${sectionNum++}</span>
          <span class="section-title">Valuation Analysis — ${inputs.companyName}</span>
        </div>
        <div class="metrics-grid">
          <div class="metric-card"><div class="metric-label">Current ARR</div><div class="metric-value">${formatCurrency(inputs.currentARR, true)}</div><div class="metric-sub">${inputs.revenueGrowthRate}% YoY</div></div>
          <div class="metric-card"><div class="metric-label">Runway</div><div class="metric-value">${summary.runway === 999 ? '∞' : summary.runway} mo</div><div class="metric-sub">$${(inputs.burnRate / 1000).toFixed(0)}K/mo burn</div></div>
          <div class="metric-card"><div class="metric-label">Gross Margin</div><div class="metric-value">${inputs.grossMargin}%</div></div>
          <div class="metric-card"><div class="metric-label">TAM</div><div class="metric-value">${formatCurrency(inputs.totalAddressableMarket, true)}</div></div>
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
              <td class="num">${formatCurrency(summary.blended, true)}</td>
              <td class="num" style="color:#FAF6EF">${formatCurrency(summary.weightedLow, true)} – ${formatCurrency(summary.weightedHigh, true)}</td>
              <td class="num" style="color:#FAF6EF">${summary.confidenceScore}%</td>
              <td class="num" style="color:#FAF6EF">—</td>
            </tr>
          </tbody>
        </table>
        <div style="margin-top:10px; padding:10px 14px; background:#f8f5f0; border-radius:6px; font-size:10px; color:#555; line-height:1.6;">
          <strong>Analyst Note:</strong> ${summary.riskLevel} risk profile. Blended confidence: ${summary.confidenceScore}%. Implied ARR multiple: ${summary.impliedARRMultiple}x. Burn multiple: ${summary.burnMultiple}x.
        </div>
      </div>
    `;
  }

  // ── Section 2: Fundraising Readiness ──────────────────────────────────────
  let readinessSection = '';
  if (data.readiness) {
    const { pct, checkedItems, totalItems } = data.readiness;
    const level = pct >= 80 ? 'Investor-Ready' : pct >= 60 ? 'Nearly Ready' : pct >= 40 ? 'Getting There' : 'Early Stage';
    readinessSection = `
      <div class="section">
        <div class="section-header">
          <span class="section-num">0${sectionNum++}</span>
          <span class="section-title">Fundraising Readiness</span>
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
        <p style="font-size:10px; color:#888;"><strong>Criteria met (${checkedItems.length}):</strong> ${checkedItems.slice(0, 12).join(' · ')}${checkedItems.length > 12 ? ` · +${checkedItems.length - 12} more` : ''}</p>
      </div>
    `;
  }

  // ── Section 3: Pitch Deck Scorecard ───────────────────────────────────────
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
  }

  // ── Section 4: Dilution Table ──────────────────────────────────────────────
  let dilutionSection = '';
  if (data.dilution && data.dilution.length > 1) {
    const founderNames = data.dilution[0].founders.map(f => f.name);
    const headerCols = founderNames.map(n => `<th style="text-align:right">${n}</th>`).join('');
    const rows = data.dilution.map((s, i) => {
      const founderCols = s.founders.map(f => `
        <td class="num">
          ${f.pct.toFixed(1)}%
          <div style="font-size:8px; color:#aaa; font-family:'JetBrains Mono',monospace;">${formatCurrency(f.value, true)}</div>
        </td>
      `).join('');
      return `
        <tr>
          <td><strong>${s.stage}</strong></td>
          ${founderCols}
          <td class="num">${s.investorPct.toFixed(1)}%</td>
          <td class="num">${formatCurrency(s.postMoney, true)}</td>
          <td class="num">${i === 0 ? '—' : formatCurrency(s.raised, true)}</td>
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
    <div class="subtitle">Generated ${date} · AI Startup Toolkit</div>
    <div class="cover-metrics">${coverMetrics.join('')}</div>
  </div>

  ${valuationSection}
  ${readinessSection}
  ${pitchSection}
  ${dilutionSection}

  <div class="disclaimer">
    <strong>Disclaimer:</strong> This report is generated for informational and planning purposes only. All estimates are based on user-provided inputs and standard financial models. Actual valuations depend on negotiation, market conditions, investor thesis, due diligence, and other factors not captured here. This report does not constitute financial, legal, or investment advice. Consult a qualified advisor before making any investment decisions.
  </div>

  <div class="footer">
    <span>AI Startup Toolkit</span>
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
