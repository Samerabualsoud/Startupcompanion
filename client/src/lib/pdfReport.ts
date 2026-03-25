/**
 * Enhanced PDF Report Generator — Polaris Arabia
 * Includes charts, AI insights, sensitivity analysis, and custom branding
 * Uses html2canvas + jsPDF for professional multi-page reports
 */

import { formatCurrency, type StartupInputs, type ValuationSummary } from './valuation';

export async function generatePDFReport(inputs: StartupInputs, summary: ValuationSummary, aiNarrative?: string): Promise<void> {
  try {
    // Dynamically import html2canvas and jsPDF
    const html2canvas = (await import('html2canvas')).default;
    const jsPDF = (await import('jspdf')).jsPDF;

    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // Create container for PDF content
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '1200px';
    container.style.backgroundColor = '#ffffff';
    container.style.padding = '40px';
    container.style.fontFamily = "'DM Sans', sans-serif";
    document.body.appendChild(container);

    // Build HTML content
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

    const sensitivityHTML = `
      <div class="sensitivity-section">
        <h4>Revenue Growth Sensitivity</h4>
        <div class="sensitivity-grid">
          ${[-30, -15, 0, +15, +30].map(delta => {
            const adjustedGrowth = Math.max(0, inputs.revenueGrowthRate + delta);
            const scaleFactor = adjustedGrowth / Math.max(1, inputs.revenueGrowthRate);
            const adjustedVal = summary.blended * (0.6 + scaleFactor * 0.4);
            const isBase = delta === 0;
            return `
              <div class="sensitivity-item ${isBase ? 'base' : ''}">
                <div class="label">${delta === 0 ? 'Base' : `${delta > 0 ? '+' : ''}${delta}%`}</div>
                <div class="value">${formatCurrency(adjustedVal, true)}</div>
                <div class="bar" style="width: ${Math.min(100, (adjustedVal / (summary.blended * 1.6)) * 100)}%"></div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    const aiInsightsHTML = aiNarrative ? `
      <div class="ai-insights">
        <h3>AI Analyst Insights</h3>
        <div class="insights-content">
          ${aiNarrative.split('\n').map(p => `<p>${p.trim()}</p>`).join('')}
        </div>
      </div>
    ` : '';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Valuation Report — ${inputs.companyName}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', sans-serif; color: #1a2a3a; background: #fff; font-size: 12px; line-height: 1.6; }
  
  .page { page-break-after: always; padding: 40px; background: #fff; }
  .page:last-child { page-break-after: avoid; }
  
  /* Header */
  .report-header { background: linear-gradient(135deg, #0F1B2D 0%, #1a3a52 100%); color: #FAF6EF; padding: 40px; margin: -40px -40px 32px; border-radius: 8px; }
  .report-header .label { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: #C4614A; margin-bottom: 8px; }
  .report-header h1 { font-family: 'Playfair Display', serif; font-size: 36px; font-weight: 700; margin-bottom: 8px; }
  .report-header .meta { font-size: 12px; color: rgba(250,246,239,0.7); }
  .report-header .logo { display: inline-block; width: 40px; height: 40px; background: #C4614A; border-radius: 6px; margin-bottom: 16px; }
  
  .valuation-badge { display: inline-block; margin-top: 20px; background: rgba(196,97,74,0.2); border: 2px solid #C4614A; border-radius: 8px; padding: 16px 24px; }
  .valuation-badge .badge-label { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: #C4614A; }
  .valuation-badge .badge-value { font-family: 'JetBrains Mono', monospace; font-size: 28px; font-weight: 700; color: #FAF6EF; margin-top: 4px; }
  .valuation-badge .badge-range { font-size: 11px; color: rgba(250,246,239,0.6); margin-top: 4px; }

  /* Section */
  .section { margin-bottom: 32px; }
  .section-title { font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 700; color: #0F1B2D; border-bottom: 3px solid #C4614A; padding-bottom: 8px; margin-bottom: 16px; }
  .section-stamp { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #C4614A; margin-right: 10px; }

  /* Metrics grid */
  .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
  .metric-card { background: linear-gradient(135deg, #f8f5f0 0%, #faf7f3 100%); border: 1px solid #e8e0d5; border-radius: 8px; padding: 14px 16px; }
  .metric-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em; color: #888; margin-bottom: 4px; font-weight: 600; }
  .metric-value { font-family: 'JetBrains Mono', monospace; font-size: 18px; font-weight: 700; color: #0F1B2D; }
  .metric-sub { font-size: 10px; color: #aaa; margin-top: 3px; }

  /* Tables */
  table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 16px; }
  th { background: #0F1B2D; color: #FAF6EF; padding: 10px 12px; text-align: left; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
  td { padding: 9px 12px; border-bottom: 1px solid #ede8e0; }
  tr:last-child td { border-bottom: none; }
  tr:nth-child(even) { background: #faf7f3; }
  .num { text-align: right; font-family: 'JetBrains Mono', monospace; font-weight: 600; }

  /* Method sections */
  .method-section { margin-bottom: 20px; padding: 16px 18px; background: #faf7f3; border: 1px solid #ede8e0; border-radius: 6px; border-left: 4px solid #C4614A; }
  .method-section h3 { font-family: 'Playfair Display', serif; font-size: 14px; font-weight: 600; margin-bottom: 6px; color: #0F1B2D; }
  .method-section .desc { font-size: 11px; color: #666; margin-bottom: 12px; line-height: 1.6; }
  .breakdown-table td.key { color: #888; width: 55%; }
  .breakdown-table td.val { font-family: 'JetBrains Mono', monospace; font-weight: 600; color: #0F1B2D; text-align: right; }
  .breakdown-table td { padding: 5px 8px; border-bottom: 1px solid #ede8e0; font-size: 10px; }

  /* Sensitivity */
  .sensitivity-section { margin-bottom: 24px; }
  .sensitivity-section h4 { font-size: 13px; font-weight: 600; margin-bottom: 12px; color: #0F1B2D; }
  .sensitivity-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; }
  .sensitivity-item { background: #f8f5f0; border: 1px solid #e8e0d5; border-radius: 6px; padding: 10px; text-align: center; }
  .sensitivity-item.base { background: #e8f5e9; border-color: #10B981; }
  .sensitivity-item .label { font-size: 10px; font-weight: 600; color: #666; margin-bottom: 4px; }
  .sensitivity-item .value { font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 700; color: #0F1B2D; margin-bottom: 6px; }
  .sensitivity-item .bar { height: 4px; background: #C4614A; border-radius: 2px; margin: 0 auto; }

  /* AI Insights */
  .ai-insights { background: linear-gradient(135deg, rgba(196,97,74,0.05) 0%, rgba(196,97,74,0.02) 100%); border: 2px solid #C4614A; border-radius: 8px; padding: 20px; margin: 24px 0; }
  .ai-insights h3 { font-family: 'Playfair Display', serif; font-size: 16px; font-weight: 700; color: #0F1B2D; margin-bottom: 12px; }
  .insights-content { font-size: 11px; line-height: 1.8; color: #333; }
  .insights-content p { margin-bottom: 10px; }
  .insights-content strong { color: #0F1B2D; font-weight: 600; }

  /* Two-col layout */
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

  /* Disclaimer */
  .disclaimer { background: #f0ede8; border: 1px solid #ddd8d0; border-radius: 6px; padding: 14px 18px; font-size: 10px; color: #888; line-height: 1.7; margin-top: 28px; }
  .disclaimer strong { color: #555; }

  /* Header/Footer */
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 12px; border-bottom: 1px solid #ede8e0; }
  .header-left { display: flex; align-items: center; gap: 12px; }
  .header-logo { width: 32px; height: 32px; background: #C4614A; border-radius: 4px; }
  .header-text { font-size: 10px; color: #666; }
  .header-text .company { font-weight: 600; color: #0F1B2D; }
  .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #ede8e0; display: flex; justify-content: space-between; font-size: 10px; color: #aaa; font-family: 'JetBrains Mono', monospace; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { margin: 0; padding: 40px; }
  }
</style>
</head>
<body>

<!-- Page 1: Cover & Executive Summary -->
<div class="page">
  <div class="report-header">
    <div class="logo"></div>
    <div class="label">Confidential Valuation Report</div>
    <h1>${inputs.companyName}</h1>
    <div class="meta">Generated ${date} · ${summary.stage} Stage · ${inputs.sector.toUpperCase()} Sector</div>
    <div class="valuation-badge">
      <div class="badge-label">Blended Valuation</div>
      <div class="badge-value">${formatCurrency(summary.blended, true)}</div>
      <div class="badge-range">Range: ${formatCurrency(summary.weightedLow, true)} — ${formatCurrency(summary.weightedHigh, true)} · Confidence: ${summary.confidenceScore}%</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title"><span class="section-stamp">01</span>Executive Summary</div>
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
        <div class="metric-value" style="font-size:16px">${summary.riskLevel}</div>
        <div class="metric-sub">burn-based</div>
      </div>
    </div>
  </div>

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
          <td class="num" style="color:#C4614A; font-size:13px">${formatCurrency(summary.blended, true)}</td>
          <td class="num" style="color:#FAF6EF">${formatCurrency(summary.weightedLow, true)}</td>
          <td class="num" style="color:#FAF6EF">${formatCurrency(summary.weightedHigh, true)}</td>
          <td class="num" style="color:#FAF6EF">${summary.confidenceScore}%</td>
          <td class="num" style="color:#FAF6EF">—</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="footer">
    <span>Polaris Arabia</span>
    <span>${inputs.companyName} · ${date}</span>
    <span>Page 1 of 4 · CONFIDENTIAL</span>
  </div>
</div>

<!-- Page 2: Method Breakdowns & Sensitivity -->
<div class="page">
  <div class="header">
    <div class="header-left">
      <div class="header-logo"></div>
      <div class="header-text">
        <div class="company">${inputs.companyName}</div>
        <div>Valuation Methods</div>
      </div>
    </div>
    <div style="font-size:10px; color:#aaa;">Page 2</div>
  </div>

  <div class="section">
    <div class="section-title"><span class="section-stamp">03</span>Method Breakdowns</div>
    ${breakdownSections}
  </div>

  <div class="section">
    <div class="section-title"><span class="section-stamp">04</span>Sensitivity Analysis</div>
    ${sensitivityHTML}
  </div>

  <div class="footer">
    <span>Polaris Arabia</span>
    <span>${inputs.companyName} · ${date}</span>
    <span>Page 2 of 4 · CONFIDENTIAL</span>
  </div>
</div>

<!-- Page 3: Scorecard, Risk & AI Insights -->
<div class="page">
  <div class="header">
    <div class="header-left">
      <div class="header-logo"></div>
      <div class="header-text">
        <div class="company">${inputs.companyName}</div>
        <div>Risk & AI Analysis</div>
      </div>
    </div>
    <div style="font-size:10px; color:#aaa;">Page 3</div>
  </div>

  <div class="section">
    <div class="section-title"><span class="section-stamp">05</span>Scorecard & Risk Factors</div>
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

  ${aiInsightsHTML}

  <div class="footer">
    <span>Polaris Arabia</span>
    <span>${inputs.companyName} · ${date}</span>
    <span>Page 3 of 4 · CONFIDENTIAL</span>
  </div>
</div>

<!-- Page 4: Scenarios & Disclaimer -->
<div class="page">
  <div class="header">
    <div class="header-left">
      <div class="header-logo"></div>
      <div class="header-text">
        <div class="company">${inputs.companyName}</div>
        <div>Scenarios & Disclaimer</div>
      </div>
    </div>
    <div style="font-size:10px; color:#aaa;">Page 4</div>
  </div>

  <div class="section">
    <div class="section-title"><span class="section-stamp">06</span>First Chicago Scenarios</div>
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

  <div class="section">
    <div class="disclaimer">
      <strong>Disclaimer:</strong> This valuation report is generated for informational and planning purposes only. The estimates presented are based on user-provided inputs and standard financial models. Actual valuations depend on negotiation, prevailing market conditions, investor thesis, due diligence findings, and other factors not captured in this model. This report does not constitute financial advice. Consult a qualified financial advisor, investment banker, or legal counsel before making any investment decisions.
    </div>
  </div>

  <div class="footer">
    <span>Polaris Arabia</span>
    <span>${inputs.companyName} · ${date}</span>
    <span>Page 4 of 4 · CONFIDENTIAL</span>
  </div>
</div>

</body>
</html>`;

    container.innerHTML = html;

    // Convert to canvas and PDF
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // Add images to PDF
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Download PDF
    pdf.save(`${inputs.companyName}-Valuation-Report-${date.replace(/\s/g, '-')}.pdf`);

    // Cleanup
    document.body.removeChild(container);
  } catch (error) {
    console.error('PDF generation error:', error);
    alert('Error generating PDF. Please try again.');
  }
}
