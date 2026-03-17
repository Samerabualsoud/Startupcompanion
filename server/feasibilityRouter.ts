/**
 * Feasibility Router — AI-powered startup idea evaluation
 * Uses LLM to score ideas across 8 dimensions and provide detailed feedback
 */
import { z } from 'zod';
import { publicProcedure, router } from './_core/trpc';
import { invokeLLM } from './_core/llm';

const FeasibilityInputSchema = z.object({
  ideaDescription: z.string().min(20).max(3000),
  targetMarket: z.string().optional(),
  problemSolved: z.string().optional(),
  revenueModel: z.string().optional(),
  competitorAwareness: z.string().optional(),
  founderBackground: z.string().optional(),
  country: z.string().optional(),
  stage: z.string().optional(),
  language: z.enum(['english', 'arabic']).default('english'),
});

export const feasibilityRouter = router({
  evaluate: publicProcedure
    .input(FeasibilityInputSchema)
    .mutation(async ({ input }) => {
      const contextBlock = [
        input.targetMarket ? `Target Market: ${input.targetMarket}` : '',
        input.problemSolved ? `Problem Being Solved: ${input.problemSolved}` : '',
        input.revenueModel ? `Revenue Model: ${input.revenueModel}` : '',
        input.competitorAwareness ? `Competitor Awareness: ${input.competitorAwareness}` : '',
        input.founderBackground ? `Founder Background: ${input.founderBackground}` : '',
        input.country ? `Country/Region: ${input.country}` : '',
        input.stage ? `Current Stage: ${input.stage}` : '',
      ].filter(Boolean).join('\n');

      const langNote = input.language === 'arabic'
        ? ' IMPORTANT: Write ALL text values in the JSON response in Arabic (العربية). Keep JSON keys in English. Use Arabic verdicts: فرصة قوية | مفهوم واعد | يحتاج تحسيناً | مخاطر عالية | غير قابل للتطبيق'
        : '';

      const systemPrompt = `You are a senior venture capital analyst and startup advisor with 20+ years of experience evaluating early-stage startups. Your job is to evaluate startup ideas objectively, honestly, and constructively — like a trusted advisor, not a cheerleader.${langNote}

You must return a JSON object with EXACTLY this structure (no extra fields, no markdown, just raw JSON):
{
  "overallScore": <number 0-100>,
  "verdict": "<one of: Strong Opportunity | Promising Concept | Needs Refinement | High Risk | Not Viable>",
  "summary": "<2-3 sentence plain-English executive summary of the idea and its potential>",
  "dimensions": [
    {
      "name": "Problem Clarity",
      "score": <0-10>,
      "weight": 15,
      "icon": "target",
      "color": "#C4614A",
      "assessment": "<2-3 sentence honest assessment>",
      "strengths": ["<strength 1>", "<strength 2>"],
      "gaps": ["<gap 1>", "<gap 2>"],
      "recommendation": "<specific actionable advice>"
    },
    {
      "name": "Market Opportunity",
      "score": <0-10>,
      "weight": 20,
      "icon": "trending-up",
      "color": "#2D4A6B",
      "assessment": "<2-3 sentence honest assessment>",
      "strengths": ["<strength 1>"],
      "gaps": ["<gap 1>"],
      "recommendation": "<specific actionable advice>"
    },
    {
      "name": "Solution Uniqueness",
      "score": <0-10>,
      "weight": 15,
      "icon": "sparkles",
      "color": "#8B4A38",
      "assessment": "<2-3 sentence honest assessment>",
      "strengths": ["<strength 1>"],
      "gaps": ["<gap 1>"],
      "recommendation": "<specific actionable advice>"
    },
    {
      "name": "Business Model",
      "score": <0-10>,
      "weight": 15,
      "icon": "dollar-sign",
      "color": "#059669",
      "assessment": "<2-3 sentence honest assessment>",
      "strengths": ["<strength 1>"],
      "gaps": ["<gap 1>"],
      "recommendation": "<specific actionable advice>"
    },
    {
      "name": "Competitive Landscape",
      "score": <0-10>,
      "weight": 10,
      "icon": "shield",
      "color": "#6366F1",
      "assessment": "<2-3 sentence honest assessment>",
      "strengths": ["<strength 1>"],
      "gaps": ["<gap 1>"],
      "recommendation": "<specific actionable advice>"
    },
    {
      "name": "Execution Feasibility",
      "score": <0-10>,
      "weight": 15,
      "icon": "zap",
      "color": "#F59E0B",
      "assessment": "<2-3 sentence honest assessment>",
      "strengths": ["<strength 1>"],
      "gaps": ["<gap 1>"],
      "recommendation": "<specific actionable advice>"
    },
    {
      "name": "Timing & Trends",
      "score": <0-10>,
      "weight": 5,
      "icon": "clock",
      "color": "#10B981",
      "assessment": "<2-3 sentence honest assessment>",
      "strengths": ["<strength 1>"],
      "gaps": ["<gap 1>"],
      "recommendation": "<specific actionable advice>"
    },
    {
      "name": "Scalability",
      "score": <0-10>,
      "weight": 5,
      "icon": "layers",
      "color": "#A0522D",
      "assessment": "<2-3 sentence honest assessment>",
      "strengths": ["<strength 1>"],
      "gaps": ["<gap 1>"],
      "recommendation": "<specific actionable advice>"
    }
  ],
  "keyRisks": [
    { "risk": "<risk title>", "severity": "<High|Medium|Low>", "mitigation": "<how to address it>" },
    { "risk": "<risk title>", "severity": "<High|Medium|Low>", "mitigation": "<how to address it>" },
    { "risk": "<risk title>", "severity": "<High|Medium|Low>", "mitigation": "<how to address it>" }
  ],
  "nextSteps": [
    { "step": "<action title>", "priority": "<Immediate|Short-term|Long-term>", "description": "<what to do and why>" },
    { "step": "<action title>", "priority": "<Immediate|Short-term|Long-term>", "description": "<what to do and why>" },
    { "step": "<action title>", "priority": "<Immediate|Short-term|Long-term>", "description": "<what to do and why>" },
    { "step": "<action title>", "priority": "<Immediate|Short-term|Long-term>", "description": "<what to do and why>" },
    { "step": "<action title>", "priority": "<Immediate|Short-term|Long-term>", "description": "<what to do and why>" }
  ],
  "analogousStartups": [
    { "name": "<startup name>", "outcome": "<success/failed/acquired>", "lesson": "<what we can learn>" },
    { "name": "<startup name>", "outcome": "<success/failed/acquired>", "lesson": "<what we can learn>" },
    { "name": "<startup name>", "outcome": "<success/failed/acquired>", "lesson": "<what we can learn>" }
  ],
  "investorPerspective": "<2-3 sentences on how a VC would view this idea — what excites them and what concerns them>",
  "oneLinerPitch": "<A crisp, compelling one-liner pitch for this idea that a founder could use>"
}

Be honest and specific. Scores should reflect real assessment — not every idea deserves 8/10. Use plain English throughout.`;

      const userMessage = `Please evaluate this startup idea:

${input.ideaDescription}

${contextBlock}`;

      const response = await invokeLLM({
        messages: [
          { role: 'system' as const, content: systemPrompt as string },
          { role: 'user' as const, content: userMessage as string },
        ],
        response_format: { type: 'json_object' },
      });

      const rawContent = response.choices[0]?.message?.content ?? '{}';
      const content = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent);
      let result: any;
      try {
        result = JSON.parse(content);
      } catch {
        throw new Error('Failed to parse AI evaluation response');
      }

      return result as {
        overallScore: number;
        verdict: string;
        summary: string;
        dimensions: Array<{
          name: string;
          score: number;
          weight: number;
          icon: string;
          color: string;
          assessment: string;
          strengths: string[];
          gaps: string[];
          recommendation: string;
        }>;
        keyRisks: Array<{ risk: string; severity: string; mitigation: string }>;
        nextSteps: Array<{ step: string; priority: string; description: string }>;
        analogousStartups: Array<{ name: string; outcome: string; lesson: string }>;
        investorPerspective: string;
        oneLinerPitch: string;
      };
    }),
});
