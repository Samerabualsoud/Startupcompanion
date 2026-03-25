/**
 * PDF Report Generator — Polaris Arabia
 * Uses browser's print-to-PDF via a hidden iframe with styled HTML
 * Design: "Venture Capital Clarity" — Editorial Finance
 */

import { formatCurrency, type StartupInputs, type ValuationSummary } from './valuation';

export function generatePDFReport(inputs: StartupInputs, summary: ValuationSummary): void {
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const methodRows = summary.results.map(r => `
    <tr>
      <td>${r.method}</td>
      <td class="num">${formatCurrency(r.value, true)}</td>
      <td class="num">${formatCurrency(r.low, true)}</td>
      <td class="num">${formatCurrency(r.high, true)}</td>
      <td class="num">${r.confidence}%</td>
      <td class="num">${r.applicability}%</td>
    </tr>
  `).join('');

  const breakdownSections = summary.results.map(r => `
    <div class="method-section">
      <h3>${r.method}</h3>
      <p class="desc">${r.description}</p>
      <table class="breakdown-table">
        <tbody>
          ${Object.entries(r.breakdown).map(([k, v]) => `
            <tr>
              <td class="key">${k}</td>
              <td class="val">${typeof v === 'number' ? formatCurrency(v, true) : v}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `).join('');

  const riskRows = [
    ['Management Team', inputs.riskManagement],
    ['Stage of Business', inputs.riskStage],
    ['Legislation / Political', inputs.riskLegislation],
    ['Manufacturing', inputs.riskManufacturing],
    ['Sales & Marketing', inputs.riskSalesMarketing],
    ['Funding / Capital', inputs.riskFunding],
    ['Competition', inputs.riskCompetition],
    ['Technology', inputs.riskTechnology],
    ['Litigation', inputs.riskLitigation],
    ['International', inputs.riskInternational],
    ['Reputation', inputs.riskReputation],
    ['Lucrative Exit Potential', inputs.riskPotentialLucrative],
  ].map(([label, val]) => `
    <tr>
      <td>${label}</td>
      <td class="num" style="color: ${Number(val) > 0 ? '#2d6a4f' : Number(val) < 0 ? '#c4614a' : '#555'}">${Number(val) > 0 ? '+' : ''}${val}</td>
    </tr>
  `).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Valuation Report — ${inputs.companyName}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', sans-serif; color: #1a2a3a; background: #fff; font-size: 11px; line-height: 1.5; }
  .page { max-width: 800px; margin: 0 auto; padding: 40px 48px; }
  
  /* Header */
  .report-header { background: #0F1B2D; color: #FAF6EF; padding: 32px 40px; margin: -40px -48px 32px; }
  .report-header .label { font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 0.15em; text-transform: uppercase; color: #C4614A; margin-bottom: 6px; }
  .report-header h1 { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 28px; font-weight: 700; margin-bottom: 4px; }
  .report-header .meta { font-size: 11px; color: rgba(250,246,239,0.6); }
  .valuation-badge { display: inline-block; margin-top: 16px; background: rgba(196,97,74,0.15); border: 1px solid #C4614A; border-radius: 6px; padding: 12px 20px; }
  .valuation-badge .badge-label { font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; color: #C4614A; }
  .valuation-badge .badge-value { font-family: 'JetBrains Mono', monospace; font-size: 24px; font-weight: 700; color: #FAF6EF; }
  .valuation-badge .badge-range { font-size: 10px; color: rgba(250,246,239,0.5); margin-top: 2px; }

  /* Section */
  .section { margin-bottom: 28px; }
  .section-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 15px; font-weight: 600; color: #0F1B2D; border-bottom: 2px solid #C4614A; padding-bottom: 6px; margin-bottom: 14px; }
  .section-stamp { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: #C4614A; margin-right: 8px; }

  /* Metrics grid */
  .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
  .metric-card { background: #f8f5f0; border: 1px solid #e8e0d5; border-radius: 6px; padding: 10px 12px; }
  .metric-label { font-size: 8px; text-transform: uppercase; letter-spacing: 0.1em; color: #888; margin-bottom: 3px; }
  .metric-value { font-family: 'JetBrains Mono', monospace; font-size: 16px; font-weight: 700; color: #0F1B2D; }
  .metric-sub { font-size: 9px; color: #aaa; margin-top: 2px; }

  /* Tables */
  table { width: 100%; border-collapse: collapse; font-size: 10px; }
  th { background: #0F1B2D; color: #FAF6EF; padding: 7px 10px; text-align: left; font-weight: 600; font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; }
  td { padding: 7px 10px; border-bottom: 1px solid #ede8e0; }
  tr:last-child td { border-bottom: none; }
  tr:nth-child(even) { background: #faf7f3; }
  .num { text-align: right; font-family: 'JetBrains Mono', monospace; font-weight: 600; }

  /* Method sections */
  .method-section { margin-bottom: 18px; padding: 14px 16px; background: #faf7f3; border: 1px solid #ede8e0; border-radius: 6px; border-left: 3px solid #C4614A; }
  .method-section h3 { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; font-weight: 600; margin-bottom: 5px; color: #0F1B2D; }
  .method-section .desc { font-size: 10px; color: #666; margin-bottom: 10px; line-height: 1.5; }
  .breakdown-table td.key { color: #888; width: 55%; }
  .breakdown-table td.val { font-family: 'JetBrains Mono', monospace; font-weight: 600; color: #0F1B2D; text-align: right; }
  .breakdown-table td { padding: 4px 6px; border-bottom: 1px solid #ede8e0; font-size: 10px; }

  /* Two-col layout */
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

  /* Disclaimer */
  .disclaimer { background: #f0ede8; border: 1px solid #ddd8d0; border-radius: 6px; padding: 12px 16px; font-size: 9px; color: #888; line-height: 1.6; margin-top: 24px; }
  .disclaimer strong { color: #555; }

  /* Footer */
  .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #ede8e0; display: flex; justify-content: space-between; font-size: 9px; color: #aaa; font-family: 'JetBrains Mono', monospace; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { padding: 0; }
    .report-header { margin: 0 0 32px; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="report-header">
    <div class="label">Confidential Valuation Report</div>
    <h1>${inputs.companyName}</h1>
    <div class="meta">Generated ${date} · ${summary.stage} Stage · ${inputs.sector.toUpperCase()} Sector</div>
    <div class="valuation-badge">
      <div class="badge-label">Blended Valuation</div>
      <div class="badge-value">${formatCurrency(summary.blended, true)}</div>
      <div class="badge-range">Range: ${formatCurrency(summary.weightedLow, true)} — ${formatCurrency(summary.weightedHigh, true)} · Confidence: ${summary.confidenceScore}%</div>
    </div>
  </div>

  <!-- Operational Metrics -->
  <div class="section">
    <div class="section-title"><span class="section-stamp">01</span>Operational Metrics</div>
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">Current ARR</div>
        <div class="metric-value">${formatCurrency(inputs.currentARR, true)}</div>
        <div class="metric-sub">${inputs.revenueGrowthRate}% YoY growth</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Runway</div>
        <div class="metric-value">${summary.runway === 999 ? '∞' : summary.runway} mo</div>
        <div class="metric-sub">at $${(inputs.burnRate / 1000).toFixed(0)}K/mo burn</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Burn Multiple</div>
        <div class="metric-value">${summary.burnMultiple}x</div>
        <div class="metric-sub">capital efficiency</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">ARR Multiple</div>
        <div class="metric-value">${summary.impliedARRMultiple}x</div>
        <div class="metric-sub">implied by blended</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Gross Margin</div>
        <div class="metric-value">${inputs.grossMargin}%</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">TAM</div>
        <div class="metric-value">${formatCurrency(inputs.totalAddressableMarket, true)}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">5Y Revenue Target</div>
        <div class="metric-value">${formatCurrency(inputs.projectedRevenue5Y, true)}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Risk Level</div>
        <div class="metric-value" style="font-size:13px">${summary.riskLevel}</div>
        <div class="metric-sub">burn-based</div>
      </div>
    </div>
  </div>

  <!-- Valuation Summary Table -->
  <div class="section">
    <div class="section-title"><span class="section-stamp">02</span>Valuation Summary — All Methods</div>
    <table>
      <thead>
        <tr>
          <th>Method</th>
          <th style="text-align:right">Value</th>
          <th style="text-align:right">Low</th>
          <th style="text-align:right">High</th>
          <th style="text-align:right">Confidence</th>
          <th style="text-align:right">Applicability</th>
        </tr>
      </thead>
      <tbody>
        ${methodRows}
        <tr style="background:#0F1B2D; color:#FAF6EF; font-weight:700">
          <td style="color:#FAF6EF">Blended (Weighted)</td>
          <td class="num" style="color:#C4614A; font-size:12px">${formatCurrency(summary.blended, true)}</td>
          <td class="num" style="color:#FAF6EF">${formatCurrency(summary.weightedLow, true)}</td>
          <td class="num" style="color:#FAF6EF">${formatCurrency(summary.weightedHigh, true)}</td>
          <td class="num" style="color:#FAF6EF">${summary.confidenceScore}%</td>
          <td class="num" style="color:#FAF6EF">—</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Method Breakdowns -->
  <div class="section">
    <div class="section-title"><span class="section-stamp">03</span>Method Breakdowns</div>
    ${breakdownSections}
  </div>

  <!-- Scorecard & Risk -->
  <div class="section">
    <div class="section-title"><span class="section-stamp">04</span>Scorecard & Risk Factors</div>
    <div class="two-col">
      <div>
        <table>
          <thead><tr><th>Scorecard Factor</th><th style="text-align:right">Score</th></tr></thead>
          <tbody>
            <tr><td>Team Quality (30%)</td><td class="num">${inputs.teamScore}/100</td></tr>
            <tr><td>Market Opportunity (25%)</td><td class="num">${inputs.marketScore}/100</td></tr>
            <tr><td>Product / Technology (15%)</td><td class="num">${inputs.productScore}/100</td></tr>
            <tr><td>Competitive Environment (10%)</td><td class="num">${inputs.competitiveScore}/100</td></tr>
            <tr><td>Marketing & Sales (10%)</td><td class="num">${inputs.marketingScore}/100</td></tr>
            <tr><td>Funding Need (5%)</td><td class="num">${inputs.fundingScore}/100</td></tr>
            <tr><td>Other Factors (5%)</td><td class="num">${inputs.otherScore}/100</td></tr>
          </tbody>
        </table>
      </div>
      <div>
        <table>
          <thead><tr><th>Risk Factor</th><th style="text-align:right">Score</th></tr></thead>
          <tbody>${riskRows}</tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- Scenarios -->
  <div class="section">
    <div class="section-title"><span class="section-stamp">05</span>First Chicago Scenarios</div>
    <table>
      <thead>
        <tr>
          <th>Scenario</th>
          <th style="text-align:right">Revenue</th>
          <th style="text-align:right">Probability</th>
          <th style="text-align:right">Exit Multiple</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Bear Case</td><td class="num">${formatCurrency(inputs.bearCaseRevenue, true)}</td><td class="num">${inputs.bearCaseProbability}%</td><td class="num">${inputs.scenarioExitMultiple}x</td></tr>
        <tr><td>Base Case</td><td class="num">${formatCurrency(inputs.baseCaseRevenue, true)}</td><td class="num">${inputs.baseCaseProbability}%</td><td class="num">${inputs.scenarioExitMultiple}x</td></tr>
        <tr><td>Bull Case</td><td class="num">${formatCurrency(inputs.bullCaseRevenue, true)}</td><td class="num">${inputs.bullCaseProbability}%</td><td class="num">${inputs.scenarioExitMultiple}x</td></tr>
      </tbody>
    </table>
  </div>

  <!-- Disclaimer -->
  <div class="disclaimer">
    <strong>Disclaimer:</strong> This valuation report is generated for informational and planning purposes only. The estimates presented are based on user-provided inputs and standard financial models. Actual valuations depend on negotiation, prevailing market conditions, investor thesis, due diligence findings, and other factors not captured in this model. This report does not constitute financial advice. Consult a qualified financial advisor, investment banker, or legal counsel before making any investment decisions.
  </div>

  <!-- Footer -->
  <div class="footer">
    <span>Polaris Arabia</span>
    <span>${inputs.companyName} · ${date}</span>
    <span>CONFIDENTIAL</span>
  </div>

</div>
</body>
</html>`;

  // Open in new window and trigger print
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) {
    alert('Please allow pop-ups to generate the PDF report.');
    return;
  }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
  }, 800);
}
