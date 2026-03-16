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
      })
    )
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a senior market research analyst at a top-tier venture capital firm. 
You produce comprehensive, data-driven market research reports for startups. 
Always respond with valid JSON only — no markdown, no code fences, no extra text.`,
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
      })
    )
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a venture capital due diligence expert. 
Generate comprehensive, stage-appropriate due diligence checklists for startups.
Always respond with valid JSON only.`,
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
      })
    )
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are an expert startup fundraising advisor who has helped founders raise over $500M. 
You write highly personalized, compelling investor outreach emails that get responses.
Always respond with valid JSON only.`,
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
      })
    )
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a top-tier venture lawyer and startup advisor who has reviewed thousands of term sheets.
You explain complex legal terms in plain English and identify founder-unfriendly clauses.
Always respond with valid JSON only.`,
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
      })
    )
    .mutation(async ({ input }) => {
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
        }).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const contextStr = input.startupContext
        ? `\nStartup context: ${JSON.stringify(input.startupContext)}`
        : "";

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are an expert fundraising advisor for startups with 20+ years of experience in venture capital.
You have helped hundreds of founders raise from pre-seed to Series C.
You give specific, actionable, honest advice — not generic platitudes.
You know the MENA, US, European, and Asian VC ecosystems deeply.
Keep responses concise (3-5 paragraphs max) but highly actionable.${contextStr}`,
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
      })
    )
    .mutation(async ({ input }) => {
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
Keep your response to 3-5 paragraphs. Be direct and specific.`,
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
});
