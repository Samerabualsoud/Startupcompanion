/**
 * AI Features Router
 * Handles 6 AI-powered tools:
 * 1. Market Research
 * 2. Due Diligence Checklist
 * 3. Investor Email Writer
 * 4. Term Sheet Analyzer
 * 5. Co-founder Agreement Drafter
 * 6. Fundraising Advisor Chat
 */

import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";

export const aiRouter = router({
  // ── 1. Market Research ──────────────────────────────────────────────────────
  marketResearch: publicProcedure
    .input(
      z.object({
        companyName: z.string().min(1),
        sector: z.string().min(1),
        targetMarket: z.string().min(1),
        productDescription: z.string().min(10),
        geography: z.string().default("Global"),
        language: z.enum(['english', 'arabic']).default('english'),
      })
    )
    .mutation(async ({ input }) => {
      const langNote = input.language === 'arabic'
        ? ' IMPORTANT: Write ALL text values in the JSON response in Arabic (العربية). Keep JSON keys in English.'
        : '';
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a senior market research analyst at a top-tier venture capital firm. 
You produce comprehensive, data-driven market research reports for startups. 
Always respond with valid JSON only — no markdown, no code fences, no extra text.${langNote}`,
          },
          {
            role: "user",
            content: `Produce a detailed market research report for this startup:
Company: ${input.companyName}
Sector: ${input.sector}
Target Market: ${input.targetMarket}
Product: ${input.productDescription}
Geography: ${input.geography}

Return a JSON object with exactly this structure:
{
  "executiveSummary": "2-3 sentence overview",
  "marketSize": {
    "tam": "Total Addressable Market with $ figure and source",
    "sam": "Serviceable Addressable Market with $ figure",
    "som": "Serviceable Obtainable Market with $ figure",
    "growthRate": "CAGR % and timeframe"
  },
  "keyTrends": [
    { "trend": "trend name", "description": "2-sentence explanation", "impact": "High|Medium|Low" }
  ],
  "competitors": [
    { "name": "company name", "description": "what they do", "funding": "funding stage/amount", "weakness": "key weakness" }
  ],
  "customerSegments": [
    { "segment": "segment name", "size": "estimated size", "painPoint": "main pain point", "willingness": "willingness to pay" }
  ],
  "entryBarriers": ["barrier 1", "barrier 2", "barrier 3"],
  "opportunities": ["opportunity 1", "opportunity 2", "opportunity 3"],
  "risks": ["risk 1", "risk 2", "risk 3"],
  "goToMarketSuggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "analystVerdict": "2-3 sentence overall assessment and recommendation"
}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "market_research",
            strict: true,
            schema: {
              type: "object",
              properties: {
                executiveSummary: { type: "string" },
                marketSize: {
                  type: "object",
                  properties: {
                    tam: { type: "string" },
                    sam: { type: "string" },
                    som: { type: "string" },
                    growthRate: { type: "string" },
                  },
                  required: ["tam", "sam", "som", "growthRate"],
                  additionalProperties: false,
                },
                keyTrends: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      trend: { type: "string" },
                      description: { type: "string" },
                      impact: { type: "string" },
                    },
                    required: ["trend", "description", "impact"],
                    additionalProperties: false,
                  },
                },
                competitors: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      description: { type: "string" },
                      funding: { type: "string" },
                      weakness: { type: "string" },
                    },
                    required: ["name", "description", "funding", "weakness"],
                    additionalProperties: false,
                  },
                },
                customerSegments: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      segment: { type: "string" },
                      size: { type: "string" },
                      painPoint: { type: "string" },
                      willingness: { type: "string" },
                    },
                    required: ["segment", "size", "painPoint", "willingness"],
                    additionalProperties: false,
                  },
                },
                entryBarriers: { type: "array", items: { type: "string" } },
                opportunities: { type: "array", items: { type: "string" } },
                risks: { type: "array", items: { type: "string" } },
                goToMarketSuggestions: { type: "array", items: { type: "string" } },
                analystVerdict: { type: "string" },
              },
              required: [
                "executiveSummary", "marketSize", "keyTrends", "competitors",
                "customerSegments", "entryBarriers", "opportunities", "risks",
                "goToMarketSuggestions", "analystVerdict"
              ],
              additionalProperties: false,
            },
          },
        },
      });

      const content = response.choices[0].message.content;
      return JSON.parse(content as string);
    }),

  // ── 2. Due Diligence Checklist ───────────────────────────────────────────────
  dueDiligence: publicProcedure
    .input(
      z.object({
        companyName: z.string().min(1),
        sector: z.string().min(1),
        stage: z.string().min(1),
        description: z.string().min(10),
        language: z.enum(['english', 'arabic']).default('english'),
      })
    )
    .mutation(async ({ input }) => {
      const langNote = input.language === 'arabic'
        ? ' IMPORTANT: Write ALL text values in the JSON response in Arabic (العربية). Keep JSON keys in English.'
        : '';
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a venture capital due diligence expert. 
Generate comprehensive, stage-appropriate due diligence checklists for startups.
Always respond with valid JSON only.${langNote}`,
          },
          {
            role: "user",
            content: `Generate a due diligence checklist for:
Company: ${input.companyName}
Sector: ${input.sector}
Stage: ${input.stage}
Description: ${input.description}

Return JSON with exactly this structure:
{
  "summary": "2-sentence overview of key DD focus areas for this startup",
  "overallRiskLevel": "Low|Medium|High",
  "categories": [
    {
      "category": "category name (e.g. Team & Founders, Product & Technology, Market, Financials, Legal, IP)",
      "priority": "Critical|High|Medium",
      "items": [
        {
          "item": "specific document or question",
          "status": "pending",
          "notes": "why this matters for this specific company",
          "redFlag": true or false
        }
      ]
    }
  ],
  "topRedFlags": ["red flag 1", "red flag 2", "red flag 3"],
  "quickWins": ["easy positive signal 1", "easy positive signal 2"]
}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "due_diligence",
            strict: true,
            schema: {
              type: "object",
              properties: {
                summary: { type: "string" },
                overallRiskLevel: { type: "string" },
                categories: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      category: { type: "string" },
                      priority: { type: "string" },
                      items: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            item: { type: "string" },
                            status: { type: "string" },
                            notes: { type: "string" },
                            redFlag: { type: "boolean" },
                          },
                          required: ["item", "status", "notes", "redFlag"],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ["category", "priority", "items"],
                    additionalProperties: false,
                  },
                },
                topRedFlags: { type: "array", items: { type: "string" } },
                quickWins: { type: "array", items: { type: "string" } },
              },
              required: ["summary", "overallRiskLevel", "categories", "topRedFlags", "quickWins"],
              additionalProperties: false,
            },
          },
        },
      });

      const content = response.choices[0].message.content;
      return JSON.parse(content as string);
    }),

  // ── 3. Investor Email Writer ─────────────────────────────────────────────────
  investorEmail: publicProcedure
    .input(
      z.object({
        startupName: z.string().min(1),
        founderName: z.string().min(1),
        sector: z.string().min(1),
        stage: z.string().min(1),
        oneLiner: z.string().min(10),
        traction: z.string().optional().default(""),
        askAmount: z.string().optional().default(""),
        investorName: z.string().min(1),
        investorFirm: z.string().optional().default(""),
        investorFocus: z.string().optional().default(""),
        emailTone: z.enum(["formal", "conversational", "bold"]).default("conversational"),
        language: z.enum(['english', 'arabic']).default('english'),
      })
    )
    .mutation(async ({ input }) => {
      const langNote = input.language === 'arabic'
        ? ' IMPORTANT: Write ALL text values in the JSON response in Arabic (العربية). Keep JSON keys in English.'
        : '';
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are an expert startup fundraising advisor who has helped founders raise over $500M. 
You write highly personalized, compelling investor outreach emails that get responses.
Always respond with valid JSON only.${langNote}`,
          },
          {
            role: "user",
            content: `Write a cold outreach email to an investor:

STARTUP INFO:
- Company: ${input.startupName}
- Founder: ${input.founderName}
- Sector: ${input.sector}
- Stage: ${input.stage}
- One-liner: ${input.oneLiner}
- Traction: ${input.traction || "Early stage, pre-traction"}
- Ask: ${input.askAmount || "Not specified"}

INVESTOR INFO:
- Name: ${input.investorName}
- Firm: ${input.investorFirm || "Independent"}
- Focus: ${input.investorFocus || "General tech"}

Tone: ${input.emailTone}

Return JSON with exactly this structure:
{
  "subjectLine": "compelling subject line",
  "emailBody": "full email body with proper formatting (use \\n for line breaks)",
  "followUpEmail": "a 2-week follow-up email body",
  "tips": ["personalization tip 1", "tip 2", "tip 3"],
  "doNotDo": ["mistake to avoid 1", "mistake 2"]
}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "investor_email",
            strict: true,
            schema: {
              type: "object",
              properties: {
                subjectLine: { type: "string" },
                emailBody: { type: "string" },
                followUpEmail: { type: "string" },
                tips: { type: "array", items: { type: "string" } },
                doNotDo: { type: "array", items: { type: "string" } },
              },
              required: ["subjectLine", "emailBody", "followUpEmail", "tips", "doNotDo"],
              additionalProperties: false,
            },
          },
        },
      });

      const content = response.choices[0].message.content;
      return JSON.parse(content as string);
    }),

  // ── 4. Term Sheet Analyzer ───────────────────────────────────────────────────
  termSheetAnalyzer: publicProcedure
    .input(
      z.object({
        termSheetText: z.string().min(50),
        companyStage: z.string().default("Seed"),
        founderExperience: z.enum(["first-time", "experienced", "serial"]).default("first-time"),
        language: z.enum(['english', 'arabic']).default('english'),
      })
    )
    .mutation(async ({ input }) => {
      const langNote = input.language === 'arabic'
        ? ' IMPORTANT: Write ALL text values in the JSON response in Arabic (العربية). Keep JSON keys in English.'
        : '';
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a top-tier venture lawyer and startup advisor who has reviewed thousands of term sheets.
You explain complex legal terms in plain English and identify founder-unfriendly clauses.
Always respond with valid JSON only.${langNote}`,
          },
          {
            role: "user",
            content: `Analyze this term sheet for a ${input.companyStage} stage startup with a ${input.founderExperience} founder:

TERM SHEET:
${input.termSheetText}

Return JSON with exactly this structure:
{
  "overallScore": number between 0-100 (100 = very founder-friendly),
  "verdict": "one sentence overall assessment",
  "keyTerms": [
    {
      "term": "term name",
      "value": "what the term sheet says",
      "plainEnglish": "what this means in plain language",
      "founderImpact": "how this affects the founder",
      "rating": "Good|Neutral|Concerning|Red Flag",
      "negotiationTip": "how to negotiate this if needed"
    }
  ],
  "redFlags": ["red flag 1", "red flag 2"],
  "positives": ["positive clause 1", "positive clause 2"],
  "missingClauses": ["important clause that should be there but isn't"],
  "negotiationPriorities": ["most important thing to negotiate first", "second priority", "third priority"],
  "summary": "3-4 sentence comprehensive summary for the founder"
}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "term_sheet_analysis",
            strict: true,
            schema: {
              type: "object",
              properties: {
                overallScore: { type: "number" },
                verdict: { type: "string" },
                keyTerms: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      term: { type: "string" },
                      value: { type: "string" },
                      plainEnglish: { type: "string" },
                      founderImpact: { type: "string" },
                      rating: { type: "string" },
                      negotiationTip: { type: "string" },
                    },
                    required: ["term", "value", "plainEnglish", "founderImpact", "rating", "negotiationTip"],
                    additionalProperties: false,
                  },
                },
                redFlags: { type: "array", items: { type: "string" } },
                positives: { type: "array", items: { type: "string" } },
                missingClauses: { type: "array", items: { type: "string" } },
                negotiationPriorities: { type: "array", items: { type: "string" } },
                summary: { type: "string" },
              },
              required: ["overallScore", "verdict", "keyTerms", "redFlags", "positives", "missingClauses", "negotiationPriorities", "summary"],
              additionalProperties: false,
            },
          },
        },
      });

      const content = response.choices[0].message.content;
      return JSON.parse(content as string);
    }),

  // ── 5. Co-founder Agreement Drafter ─────────────────────────────────────────
  cofounderAgreement: publicProcedure
    .input(
      z.object({
        companyName: z.string().min(1),
        founders: z.array(
          z.object({
            name: z.string(),
            role: z.string(),
            equityPercent: z.number(),
            contribution: z.string(),
          })
        ).min(2),
        vestingSchedule: z.string().default("4 years with 1-year cliff"),
        jurisdiction: z.string().default("Delaware, USA"),
        ipAssignment: z.boolean().default(true),
        nonCompetePeriod: z.string().default("12 months"),
        decisionMakingProcess: z.string().default("Majority vote"),
        language: z.enum(['english', 'arabic', 'both']).default('english'),
      })
    )
    .mutation(async ({ input }) => {
      const langNote = input.language === 'arabic'
        ? 'IMPORTANT: Write the entire agreement in Arabic (العربية).'
        : input.language === 'both'
        ? 'IMPORTANT: Write the agreement in both English and Arabic. For each section, provide the English text first, then the Arabic translation immediately after.'
        : '';
      const foundersText = input.founders
        .map((f, i) => `${i + 1}. ${f.name} - ${f.role} - ${f.equityPercent}% equity - Contribution: ${f.contribution}`)
        .join("\n");

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a startup lawyer specializing in co-founder agreements and equity structures.
You draft clear, fair, and comprehensive co-founder agreements.
Always respond with valid JSON only.`,
          },
          {
            role: "user",
            content: `Draft a co-founder agreement for:

Company: ${input.companyName}
Jurisdiction: ${input.jurisdiction}
Vesting: ${input.vestingSchedule}
IP Assignment: ${input.ipAssignment ? "Yes, all IP assigned to company" : "No IP assignment clause"}
Non-compete: ${input.nonCompetePeriod}
Decision Making: ${input.decisionMakingProcess}

Founders:
${foundersText}
${langNote ? '\n' + langNote : ''}

Return JSON with exactly this structure:
{
  "documentTitle": "title of the agreement",
  "effectiveDate": "today's date placeholder",
  "sections": [
    {
      "title": "section title",
      "content": "full legal text of this section",
      "notes": "plain-English explanation of what this section does"
    }
  ],
  "keyHighlights": ["important point 1", "important point 2", "important point 3"],
  "warnings": ["potential issue 1", "potential issue 2"],
  "nextSteps": ["step 1 after drafting", "step 2", "step 3"],
  "disclaimer": "legal disclaimer"
}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "cofounder_agreement",
            strict: true,
            schema: {
              type: "object",
              properties: {
                documentTitle: { type: "string" },
                effectiveDate: { type: "string" },
                sections: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      content: { type: "string" },
                      notes: { type: "string" },
                    },
                    required: ["title", "content", "notes"],
                    additionalProperties: false,
                  },
                },
                keyHighlights: { type: "array", items: { type: "string" } },
                warnings: { type: "array", items: { type: "string" } },
                nextSteps: { type: "array", items: { type: "string" } },
                disclaimer: { type: "string" },
              },
              required: ["documentTitle", "effectiveDate", "sections", "keyHighlights", "warnings", "nextSteps", "disclaimer"],
              additionalProperties: false,
            },
          },
        },
      });

      const content = response.choices[0].message.content;
      return JSON.parse(content as string);
    }),

  // ── 6. Fundraising Advisor Chat ──────────────────────────────────────────────
  fundraisingChat: publicProcedure
    .input(
      z.object({
        messages: z.array(
          z.object({
            role: z.enum(["user", "assistant"]),
            content: z.string(),
          })
        ),
        startupContext: z.object({
          name: z.string().optional().default(""),
          sector: z.string().optional().default(""),
          stage: z.string().optional().default(""),
          country: z.string().optional().default(""),
          problem: z.string().optional().default(""),
          solution: z.string().optional().default(""),
          businessModel: z.string().optional().default(""),
          mrr: z.number().optional(),
          currentARR: z.number().optional(),
          monthlyBurnRate: z.number().optional(),
          numberOfCustomers: z.number().optional(),
          teamSize: z.number().optional(),
          targetRaise: z.number().optional(),
          runwayMonths: z.number().optional(),
          grossMargin: z.number().optional(),
          revenueGrowthRate: z.number().optional(),
        }).optional(),
        language: z.enum(['english', 'arabic']).default('english'),
      })
    )
    .mutation(async ({ input }) => {
      const ctx = input.startupContext;
      const contextStr = ctx
        ? `\n\nFOUNDER'S STARTUP PROFILE (use this to give highly personalized advice — always reference specific numbers and facts from this profile):
- Company: ${ctx.name || 'Not specified'}
- Sector: ${ctx.sector || 'Not specified'}
- Stage: ${ctx.stage || 'Not specified'}
- Country: ${ctx.country || 'Not specified'}
- Problem being solved: ${ctx.problem || 'Not specified'}
- Solution: ${ctx.solution || 'Not specified'}
- Business model: ${ctx.businessModel || 'Not specified'}
- MRR: ${ctx.mrr ? `$${ctx.mrr.toLocaleString()}` : 'Not specified'}
- ARR: ${ctx.currentARR ? `$${ctx.currentARR.toLocaleString()}` : 'Not specified'}
- Monthly burn rate: ${ctx.monthlyBurnRate ? `$${ctx.monthlyBurnRate.toLocaleString()}` : 'Not specified'}
- Customers: ${ctx.numberOfCustomers ?? 'Not specified'}
- Team size: ${ctx.teamSize ?? 'Not specified'}
- Fundraising target: ${ctx.targetRaise ? `$${ctx.targetRaise.toLocaleString()}` : 'Not specified'}
- Runway: ${ctx.runwayMonths ? `${ctx.runwayMonths} months` : 'Not specified'}
- Gross margin: ${ctx.grossMargin ? `${ctx.grossMargin}%` : 'Not specified'}
- Revenue growth rate: ${ctx.revenueGrowthRate ? `${ctx.revenueGrowthRate}% MoM` : 'Not specified'}`
        : "";
      const langNote = input.language === 'arabic'
        ? '\nIMPORTANT: Respond entirely in Arabic (العربية).'
        : '';

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are an expert fundraising advisor for startups with 20+ years of experience in venture capital.
You have helped hundreds of founders raise from pre-seed to Series C.
You give specific, actionable, honest advice — not generic platitudes.
You know the MENA, US, European, and Asian VC ecosystems deeply.
Keep responses concise (3-5 paragraphs max) but highly actionable.${contextStr}${langNote}`,
          },
          ...input.messages,
        ],
      });

      return {
        reply: response.choices[0].message.content as string,
      };
    }),

  // ── 7. Vesting Schedule AI Review ──────────────────────────────────────────────
  vestingRecommendation: publicProcedure
    .input(
      z.object({
        stakeholders: z.array(
          z.object({
            name: z.string(),
            role: z.string(),
            shares: z.number(),
            vestingMonths: z.number(),
            cliffMonths: z.number(),
            vestingType: z.string(),
          })
        ),
        totalShares: z.number(),
        language: z.enum(['english', 'arabic']).default('english'),
      })
    )
    .mutation(async ({ input }) => {
      const langNote = input.language === 'arabic'
        ? '\nIMPORTANT: Respond entirely in Arabic (العربية).'
        : '';
      const stakeholderSummary = input.stakeholders
        .map(
          (s) =>
            `- ${s.name} (${s.role}): ${s.shares.toLocaleString()} shares (${((s.shares / input.totalShares) * 100).toFixed(1)}%), ${s.vestingMonths}mo vesting, ${s.cliffMonths}mo cliff, ${s.vestingType} schedule`
        )
        .join('\n');

      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: `You are a startup equity and compensation expert with deep experience in VC-backed companies.
You review vesting schedules and provide concise, actionable feedback.
Focus on: fairness between founders, investor-friendliness, market norms, and red flags.
Keep your response to 3-5 paragraphs. Be direct and specific.${langNote}`,
          },
          {
            role: 'user',
            content: `Please review this vesting schedule and provide recommendations:\n\nTotal shares: ${input.totalShares.toLocaleString()}\n\nStakeholders:\n${stakeholderSummary}\n\nProvide:\n1. Overall assessment of the structure\n2. Any red flags or concerns\n3. Specific recommendations to improve fairness or investor-friendliness\n4. Market comparison (is this typical for VC-backed startups?)`,
          },
        ],
      });

      return {
        recommendation: response.choices[0].message.content as string,
      };
    }),

  // ── 8. SAFE / Convertible Note Generator ─────────────────────────────────────
  generateSAFENote: publicProcedure
    .input(
      z.object({
        inputs: z.object({
          instrumentType: z.enum(['safe', 'convertible-note']),
          investorName: z.string(),
          companyName: z.string(),
          investmentAmount: z.number(),
          valuationCap: z.number(),
          discountRate: z.number(),
          interestRate: z.number(),
          maturityMonths: z.number(),
          safeType: z.enum(['pre-money', 'post-money', 'mfn']),
          proRataRights: z.boolean(),
          mfnClause: z.boolean(),
          governingLaw: z.string(),
          closingDate: z.string(),
        }),
        language: z.enum(['english', 'arabic', 'both']).default('english'),
      })
    )
    .mutation(async ({ input }) => {
      const { inputs: i, language } = input;
      const langInstruction = language === 'arabic'
        ? ' Write the entire document in Arabic (العربية).'
        : language === 'both'
        ? ' Write the document in both English and Arabic: first the full English version, then a horizontal rule (---), then the full Arabic translation.'
        : '';
      const isNote = i.instrumentType === 'convertible-note';
      const prompt = isNote
        ? `Draft a professional convertible note term sheet for:
- Company: ${i.companyName}
- Investor: ${i.investorName}
- Investment Amount: $${i.investmentAmount.toLocaleString()}
- Valuation Cap: $${i.valuationCap.toLocaleString()}
- Discount Rate: ${i.discountRate}%
- Interest Rate: ${i.interestRate}% per annum
- Maturity: ${i.maturityMonths} months
- Pro-Rata Rights: ${i.proRataRights ? 'Yes' : 'No'}
- MFN Clause: ${i.mfnClause ? 'Yes' : 'No'}
- Governing Law: ${i.governingLaw}
- Closing Date: ${i.closingDate}

Include: recitals, definitions, investment terms, conversion mechanics, representations, and signature blocks.${langInstruction}`
        : `Draft a professional SAFE (Simple Agreement for Future Equity) for:
- Company: ${i.companyName}
- Investor: ${i.investorName}
- Investment Amount: $${i.investmentAmount.toLocaleString()}
- Valuation Cap: $${i.valuationCap.toLocaleString()}
- Discount Rate: ${i.discountRate}%
- SAFE Type: ${i.safeType}
- Pro-Rata Rights: ${i.proRataRights ? 'Yes' : 'No'}
- MFN Clause: ${i.mfnClause ? 'Yes' : 'No'}
- Governing Law: ${i.governingLaw}
- Closing Date: ${i.closingDate}

Include: recitals, definitions, investment terms, conversion events, dissolution events, representations, and signature blocks.${langInstruction}`;

      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: `You are a startup lawyer specializing in early-stage financing documents. Draft professional, legally-sound term sheets and agreements. Use clear headings, numbered sections, and standard legal language. Include all standard clauses. Add a disclaimer at the end that this is a template and should be reviewed by qualified counsel.`,
          },
          { role: 'user', content: prompt },
        ],
      });

      return { document: response.choices[0].message.content as string };
    }),

  // ── 9. NDA Generator ─────────────────────────────────────────────────────────
  generateNDA: publicProcedure
    .input(
      z.object({
        ndaType: z.enum(['mutual', 'one-way']),
        disclosingParty: z.string(),
        receivingParty: z.string(),
        purpose: z.string(),
        confidentialityPeriodYears: z.number(),
        governingLaw: z.string(),
        effectiveDate: z.string(),
        includeNonSolicit: z.boolean(),
        includeNonCompete: z.boolean(),
        language: z.enum(['english', 'arabic', 'both']).default('english'),
      })
    )
    .mutation(async ({ input }) => {
      const langInstruction = input.language === 'arabic'
        ? ' Write the entire NDA in Arabic (العربية).'
        : input.language === 'both'
        ? ' Write the NDA in both English and Arabic: first the full English version, then a horizontal rule (---), then the full Arabic translation.'
        : '';
      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: `You are a startup lawyer. Draft professional, comprehensive NDA agreements. Use clear headings, numbered sections, and standard legal language. Include all standard clauses for the jurisdiction specified. Add a disclaimer at the end.${langInstruction}`,
          },
          {
            role: 'user',
            content: `Draft a ${input.ndaType} Non-Disclosure Agreement:
- Type: ${input.ndaType === 'mutual' ? 'Mutual (both parties share confidential info)' : 'One-Way (only disclosing party shares info)'}
- Disclosing Party: ${input.disclosingParty}
- Receiving Party: ${input.receivingParty}
- Purpose: ${input.purpose}
- Confidentiality Period: ${input.confidentialityPeriodYears} years
- Governing Law: ${input.governingLaw}
- Effective Date: ${input.effectiveDate}
- Non-Solicitation Clause: ${input.includeNonSolicit ? 'Include' : 'Exclude'}
- Non-Compete Clause: ${input.includeNonCompete ? 'Include (limited, reasonable)' : 'Exclude'}

Include: recitals, definitions of confidential information, obligations, exclusions, term and termination, remedies, and signature blocks.`,
          },
        ],
      });

      return { document: response.choices[0].message.content as string };
    }),

  // ── 11. ESOP Grant Letter Generator ─────────────────────────────────────────────────────────────────────────────────
  generateGrantLetter: publicProcedure
    .input(
      z.object({
        companyName: z.string().min(1),
        employeeName: z.string().min(1),
        employeeRole: z.string().min(1),
        grantDate: z.string(),
        shares: z.number().int().positive(),
        strikePrice: z.number().positive(),
        vestingMonths: z.number().int().positive(),
        cliffMonths: z.number().int().min(0),
        jurisdiction: z.string(),
        pricePerShare: z.number().positive(),
        language: z.enum(['english', 'arabic', 'both']).default('english'),
      })
    )
    .mutation(async ({ input }) => {
      const langInstruction = input.language === 'arabic'
        ? ' Write the entire grant letter in Arabic (العربية).'
        : input.language === 'both'
        ? ' Write the grant letter in both English and Arabic: first the full English version, then a horizontal rule (---), then the full Arabic translation.'
        : '';
      const vestingDesc = input.cliffMonths > 0
        ? `${input.vestingMonths}-month vesting with a ${input.cliffMonths}-month cliff`
        : `${input.vestingMonths}-month straight-line vesting (no cliff)`;
      const totalValue = (input.shares * input.pricePerShare).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: `You are a startup equity compensation specialist. Draft professional, legally-appropriate stock option grant letters. Use a formal but warm tone. Include all required legal disclosures. Add a disclaimer at the end that this is a template and should be reviewed by qualified counsel.${langInstruction}`,
          },
          {
            role: 'user',
            content: `Draft a stock option grant letter with these details:
- Company: ${input.companyName}
- Employee: ${input.employeeName}
- Role: ${input.employeeRole}
- Grant Date: ${input.grantDate}
- Number of Options: ${input.shares.toLocaleString()} shares
- Exercise (Strike) Price: $${input.strikePrice.toFixed(4)} per share
- Current Fair Market Value: $${input.pricePerShare.toFixed(4)} per share
- Estimated Grant Value: ${totalValue}
- Vesting Schedule: ${vestingDesc}
- Governing Law / Jurisdiction: ${input.jurisdiction}

Include: greeting, grant details table, vesting schedule explanation, exercise instructions, tax notice, expiry terms, acceptance signature block, and legal disclaimer.`,
          },
        ],
      });

      return { letter: response.choices[0].message.content as string };
    }),

  // ── 10. ESOP / Option Pool Recommendation ────────────────────────────────────
  esopRecommendation: publicProcedure
    .input(
      z.object({
        companyName: z.string(),
        stage: z.string(),
        totalShares: z.number(),
        currentOptionPool: z.number(),
        plannedHires: z.number(),
        seniorHires: z.number(),
        jurisdiction: z.string(),
        nextRoundSize: z.number().optional(),
        language: z.enum(['english', 'arabic']).default('english'),
      })
    )
    .mutation(async ({ input }) => {
      const langNote = input.language === 'arabic'
        ? '\nIMPORTANT: Respond entirely in Arabic (العربية).'
        : '';
      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: `You are a startup equity compensation expert. Provide specific, actionable advice on ESOP/option pool sizing, strike prices, and vesting structures. Be concise and practical.${langNote}`,
          },
          {
            role: 'user',
            content: `Analyze this ESOP situation and provide recommendations:
- Company: ${input.companyName}
- Stage: ${input.stage}
- Total Shares: ${input.totalShares.toLocaleString()}
- Current Option Pool: ${input.currentOptionPool.toLocaleString()} shares (${((input.currentOptionPool / input.totalShares) * 100).toFixed(1)}%)
- Planned Hires (12 months): ${input.plannedHires} people
- Senior/Executive Hires: ${input.seniorHires}
- Jurisdiction: ${input.jurisdiction}
${input.nextRoundSize ? `- Next Round Size: $${input.nextRoundSize.toLocaleString()}` : ''}

Provide:
1. Is the current pool size adequate? What % is market standard for this stage?
2. Recommended pool size and reasoning
3. Suggested grant ranges by role (engineer, senior engineer, VP, C-suite)
4. Strike price considerations for this stage
5. Vesting structure recommendations
6. Tax implications to be aware of in ${input.jurisdiction}
7. Key risks and how to mitigate them`,
          },
        ],
      });

      return { analysis: response.choices[0].message.content as string };
    }),

  // ── COGS AI Analysis ─────────────────────────────────────────────────────────
  analyzeCOGS: protectedProcedure
    .input(
      z.object({
        businessModel: z.string(),
        revenuePerUnit: z.number().optional().default(0),
        unitsPerMonth: z.number().optional().default(0),
        totalRevenue: z.number().optional().default(0),
        monthlyRevenue: z.number().optional().default(0),
        totalCOGS: z.number(),
        grossMarginPct: z.number(),
        totalOpEx: z.number(),
        ebitda: z.number(),
        breakEvenUnits: z.number().nullable().optional(),
        directCosts: z.array(z.object({ name: z.string(), amount: z.number(), type: z.string() })),
        indirectCosts: z.array(z.object({ name: z.string(), amount: z.number(), category: z.string() })),
        currency: z.string().default('USD'),
        language: z.enum(['english', 'arabic']).default('english'),
      })
    )
    .mutation(async ({ input }) => {
      const langNote = input.language === 'arabic'
        ? '\nIMPORTANT: Respond entirely in Arabic (\u0627\u0644\u0639\u0631\u0628\u064a\u0629). Use Arabic financial terminology.'
        : '';

      const topDirectCosts = input.directCosts
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5)
        .map(c => `  - ${c.name}: ${input.currency} ${c.amount.toLocaleString()} (${c.type})`)
        .join('\n');

      const topIndirectCosts = input.indirectCosts
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5)
        .map(c => `  - ${c.name}: ${input.currency} ${c.amount.toLocaleString()} (${c.category})`)
        .join('\n');

      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: `You are a CFO-level financial advisor specializing in startup unit economics and cost structure optimization. Provide specific, actionable, data-driven analysis. Use industry benchmarks relevant to the business model. Be direct and practical.${langNote}`,
          },
          {
            role: 'user',
            content: `Analyze this startup's cost structure and provide optimization recommendations:

Business Model: ${input.businessModel}
Monthly Revenue: ${input.currency} ${(input.monthlyRevenue || input.totalRevenue || 0).toLocaleString()}
Monthly COGS: ${input.currency} ${input.totalCOGS.toLocaleString()}
Gross Margin: ${input.grossMarginPct.toFixed(1)}%
Monthly OpEx: ${input.currency} ${input.totalOpEx.toLocaleString()}
EBITDA: ${input.currency} ${input.ebitda.toLocaleString()}
Break-even Units: ${input.breakEvenUnits != null ? input.breakEvenUnits.toFixed(0) : 'N/A'}
Current Units/Month: ${input.unitsPerMonth}
Revenue per Unit: ${input.currency} ${input.revenuePerUnit}

Top Direct Costs (COGS):
${topDirectCosts || '  (none entered)'}

Top Indirect Costs (OpEx):
${topIndirectCosts || '  (none entered)'}

Provide:
1. **Gross Margin Assessment**: Is ${input.grossMarginPct.toFixed(1)}% healthy for a ${input.businessModel} business? What is the industry benchmark?
2. **Top 3 Cost Reduction Opportunities**: Specific, actionable ways to reduce COGS
3. **Unit Economics Health**: Is the current revenue-per-unit vs cost-per-unit ratio sustainable?
4. **Break-even Analysis**: At ${input.breakEvenUnits != null ? input.breakEvenUnits.toFixed(0) : 'N/A'} units, how realistic is this target?
5. **OpEx Efficiency**: Are the indirect costs proportionate to revenue?
6. **Path to Profitability**: What specific changes would move EBITDA to positive?
7. **Red Flags**: Any concerning cost patterns that need immediate attention?`,
          },
        ],
      });
      return { analysis: response.choices[0].message.content as string };
    }),

  // ── Executive Summary for Full Report ─────────────────────────────────────
  generateExecutiveSummary: protectedProcedure
    .input(
      z.object({
        companyName: z.string(),
        tagline: z.string().optional().default(''),
        sector: z.string().optional().default(''),
        stage: z.string().optional().default(''),
        country: z.string().optional().default(''),
        foundedYear: z.number().nullable().optional(),
        problem: z.string().optional().default(''),
        solution: z.string().optional().default(''),
        businessModel: z.string().optional().default(''),
        targetCustomer: z.string().optional().default(''),
        competitiveAdvantage: z.string().optional().default(''),
        currentARR: z.number().nullable().optional(),
        mrr: z.number().nullable().optional(),
        monthlyBurnRate: z.number().nullable().optional(),
        cashOnHand: z.number().nullable().optional(),
        totalRaised: z.number().nullable().optional(),
        targetRaise: z.number().nullable().optional(),
        grossMargin: z.number().nullable().optional(),
        revenueGrowthRate: z.number().nullable().optional(),
        numberOfCustomers: z.number().nullable().optional(),
        monthlyActiveUsers: z.number().nullable().optional(),
        churnRate: z.number().nullable().optional(),
        ltv: z.number().nullable().optional(),
        cac: z.number().nullable().optional(),
        npsScore: z.number().nullable().optional(),
        employeeCount: z.number().nullable().optional(),
        latestValuation: z.number().nullable().optional(),
        readinessScore: z.number().nullable().optional(),
        pitchScore: z.number().nullable().optional(),
        runway: z.number().nullable().optional(),
        language: z.enum(['english', 'arabic']).default('english'),
      })
    )
    .mutation(async ({ input }) => {
      const langNote = input.language === 'arabic'
        ? '\nIMPORTANT: Write entirely in Arabic (\u0627\u0644\u0639\u0631\u0628\u064a\u0629). Use professional Arabic business language.'
        : '';

      const fmt = (v: number | null | undefined, prefix = '$') =>
        v == null ? 'N/A'
        : v >= 1_000_000 ? `${prefix}${(v / 1_000_000).toFixed(1)}M`
        : v >= 1_000 ? `${prefix}${(v / 1_000).toFixed(0)}K`
        : `${prefix}${v.toLocaleString()}`;

      const metrics = [
        input.currentARR ? `ARR: ${fmt(input.currentARR)}` : null,
        input.mrr ? `MRR: ${fmt(input.mrr)}` : null,
        input.monthlyBurnRate ? `Monthly Burn: ${fmt(input.monthlyBurnRate)}` : null,
        input.cashOnHand ? `Cash on Hand: ${fmt(input.cashOnHand)}` : null,
        input.totalRaised ? `Total Raised: ${fmt(input.totalRaised)}` : null,
        input.grossMargin ? `Gross Margin: ${input.grossMargin.toFixed(1)}%` : null,
        input.revenueGrowthRate ? `Revenue Growth: ${input.revenueGrowthRate.toFixed(1)}%` : null,
        input.numberOfCustomers ? `Customers: ${input.numberOfCustomers.toLocaleString()}` : null,
        input.monthlyActiveUsers ? `MAU: ${input.monthlyActiveUsers.toLocaleString()}` : null,
        input.churnRate ? `Churn Rate: ${input.churnRate.toFixed(1)}%` : null,
        input.ltv ? `LTV: ${fmt(input.ltv)}` : null,
        input.cac ? `CAC: ${fmt(input.cac)}` : null,
        input.npsScore ? `NPS: ${input.npsScore}` : null,
        input.employeeCount ? `Team Size: ${input.employeeCount}` : null,
        input.latestValuation ? `Latest Valuation: ${fmt(input.latestValuation)}` : null,
        input.runway ? `Runway: ${input.runway} months` : null,
        input.readinessScore ? `Fundraising Readiness: ${input.readinessScore}/100` : null,
        input.pitchScore ? `Pitch Score: ${input.pitchScore}/100` : null,
      ].filter(Boolean).join('\n');

      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: `You are a senior investment analyst writing executive summaries for startup investor reports. Write in a professional, concise, and compelling tone. Focus on the investment thesis, traction, and opportunity. Do not use bullet points — write in flowing paragraphs.${langNote}`,
          },
          {
            role: 'user',
            content: `Write a 3-paragraph executive summary for this startup investor report:

Company: ${input.companyName}
Tagline: ${input.tagline || 'N/A'}
Sector: ${input.sector || 'N/A'}
Stage: ${input.stage || 'N/A'}
Country: ${input.country || 'N/A'}
Founded: ${input.foundedYear || 'N/A'}

Problem: ${input.problem || 'N/A'}
Solution: ${input.solution || 'N/A'}
Business Model: ${input.businessModel || 'N/A'}
Target Customer: ${input.targetCustomer || 'N/A'}
Competitive Advantage: ${input.competitiveAdvantage || 'N/A'}

Key Metrics:
${metrics || 'Not yet provided'}

Fundraising Target: ${fmt(input.targetRaise)}

Paragraph 1: Company overview — what they do, the problem they solve, and why now.
Paragraph 2: Traction and business metrics — key numbers, growth, and proof points.
Paragraph 3: Investment thesis — why this team and opportunity deserve capital, and what the raise will achieve.`,
          },
        ],
      });
      return { summary: response.choices[0].message.content as string };
    }),

  // ── AI Valuation Narrative ─────────────────────────────────────────────────
  valuationNarrative: protectedProcedure
    .input(z.object({
      companyName: z.string(),
      stage: z.string(),
      sector: z.string(),
      blendedValuation: z.number(),
      valuationLow: z.number(),
      valuationHigh: z.number(),
      confidenceScore: z.number(),
      riskLevel: z.string(),
      runway: z.number(),
      burnMultiple: z.number(),
      impliedARRMultiple: z.number(),
      currentARR: z.number(),
      revenueGrowthRate: z.number(),
      grossMargin: z.number(),
      methods: z.array(z.object({
        method: z.string(),
        value: z.number(),
        applicability: z.number(),
        confidence: z.number(),
      })),
      language: z.enum(['english', 'arabic']).default('english'),
    }))
    .mutation(async ({ input }) => {
      const fmt = (n: number) => n >= 1e9 ? `$${(n/1e9).toFixed(2)}B` : n >= 1e6 ? `$${(n/1e6).toFixed(2)}M` : n >= 1e3 ? `$${(n/1e3).toFixed(0)}K` : `$${n.toFixed(0)}`;
      const langNote = input.language === 'arabic' ? ' Respond in Arabic.' : ' Respond in English.';
      const methodsSummary = input.methods.map(m => `  - ${m.method}: ${fmt(m.value)} (${m.applicability}% weight, ${m.confidence}% confidence)`).join('\n');
      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: `You are a senior VC analyst providing a concise, actionable valuation narrative for a startup founder. Write in exactly 4 short paragraphs: (1) headline interpretation of the valuation result, (2) what the range and confidence score mean for their fundraising strategy, (3) the 2 most important strengths and 2 most important risks revealed by the multi-method analysis, (4) specific, concrete next steps the founder should take in the next 90 days to maximize their valuation. Be direct, specific, and avoid generic advice. Do not use bullet points — write in flowing paragraphs.${langNote}`,
          },
          {
            role: 'user',
            content: `Provide a valuation narrative for:\nCompany: ${input.companyName}\nStage: ${input.stage}\nSector: ${input.sector}\nBlended Valuation: ${fmt(input.blendedValuation)}\nRange: ${fmt(input.valuationLow)} — ${fmt(input.valuationHigh)}\nConfidence Score: ${input.confidenceScore}%\nRisk Level: ${input.riskLevel}\nRunway: ${input.runway === 999 ? 'Profitable' : input.runway + ' months'}\nBurn Multiple: ${input.burnMultiple}x\nImplied ARR Multiple: ${input.impliedARRMultiple}x\nCurrent ARR: ${fmt(input.currentARR)}\nRevenue Growth: ${input.revenueGrowthRate}%\nGross Margin: ${input.grossMargin}%\nMethod Results:\n${methodsSummary}`,
          },
        ],
      });
      return { narrative: response.choices[0].message.content as string };
    }),
});

