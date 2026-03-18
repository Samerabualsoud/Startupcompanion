import { z } from 'zod';
import { router, protectedProcedure } from './_core/trpc';
import { invokeLLM } from './_core/llm';

export const ideaValidatorRouter = router({
  validate: protectedProcedure
    .input(z.object({
      ideaTitle: z.string().min(3),
      problemStatement: z.string().min(10),
      targetMarket: z.string().min(5),
      solution: z.string().min(10),
      revenueModel: z.string().min(5),
      geography: z.string().optional().default('Global'),
      stage: z.string().optional().default('idea'),
      language: z.string().optional().default('en'),
    }))
    .mutation(async ({ input }) => {
      const langInstruction = input.language === 'ar'
        ? 'Respond entirely in Arabic.'
        : 'Respond in English.';

      const prompt = `${langInstruction}

You are a top-tier venture capital analyst and startup advisor. Analyze the following startup idea and provide a comprehensive validation report.

STARTUP IDEA: ${input.ideaTitle}
PROBLEM: ${input.problemStatement}
TARGET MARKET: ${input.targetMarket}
SOLUTION: ${input.solution}
REVENUE MODEL: ${input.revenueModel}
GEOGRAPHY: ${input.geography}
CURRENT STAGE: ${input.stage}

Provide a structured JSON response with the following fields:
{
  "overallScore": <number 1-100>,
  "verdict": "<Strong Idea | Promising | Needs Work | Risky | Not Viable>",
  "marketSize": {
    "score": <1-10>,
    "assessment": "<text>",
    "estimatedTAM": "<text e.g. $2B>"
  },
  "problemClarity": {
    "score": <1-10>,
    "assessment": "<text>",
    "isPainfulEnough": <true|false>
  },
  "competitiveLandscape": {
    "score": <1-10>,
    "assessment": "<text>",
    "mainCompetitors": ["<comp1>", "<comp2>", "<comp3>"],
    "differentiationStrength": "<Strong | Moderate | Weak>"
  },
  "moat": {
    "score": <1-10>,
    "assessment": "<text>",
    "moatTypes": ["<e.g. Network Effects, IP, Data, Brand>"]
  },
  "revenueModel": {
    "score": <1-10>,
    "assessment": "<text>",
    "viability": "<High | Medium | Low>"
  },
  "executionRisk": {
    "score": <1-10>,
    "assessment": "<text>",
    "keyRisks": ["<risk1>", "<risk2>", "<risk3>"]
  },
  "timingAndTrends": {
    "score": <1-10>,
    "assessment": "<text>",
    "tailwinds": ["<trend1>", "<trend2>"],
    "headwinds": ["<challenge1>", "<challenge2>"]
  },
  "recommendations": {
    "topStrengths": ["<strength1>", "<strength2>", "<strength3>"],
    "criticalWeaknesses": ["<weakness1>", "<weakness2>"],
    "nextSteps": ["<action1>", "<action2>", "<action3>"],
    "pivotSuggestions": ["<pivot1>", "<pivot2>"]
  },
  "investorPerspective": "<2-3 sentences on how a VC would view this>",
  "summary": "<3-4 sentence overall assessment>"
}`;

      const response = await invokeLLM({
        messages: [
          { role: 'system', content: 'You are a senior venture capital analyst. Always respond with valid JSON only, no markdown code blocks.' },
          { role: 'user', content: prompt },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'idea_validation',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                overallScore: { type: 'number' },
                verdict: { type: 'string' },
                marketSize: {
                  type: 'object',
                  properties: {
                    score: { type: 'number' },
                    assessment: { type: 'string' },
                    estimatedTAM: { type: 'string' },
                  },
                  required: ['score', 'assessment', 'estimatedTAM'],
                  additionalProperties: false,
                },
                problemClarity: {
                  type: 'object',
                  properties: {
                    score: { type: 'number' },
                    assessment: { type: 'string' },
                    isPainfulEnough: { type: 'boolean' },
                  },
                  required: ['score', 'assessment', 'isPainfulEnough'],
                  additionalProperties: false,
                },
                competitiveLandscape: {
                  type: 'object',
                  properties: {
                    score: { type: 'number' },
                    assessment: { type: 'string' },
                    mainCompetitors: { type: 'array', items: { type: 'string' } },
                    differentiationStrength: { type: 'string' },
                  },
                  required: ['score', 'assessment', 'mainCompetitors', 'differentiationStrength'],
                  additionalProperties: false,
                },
                moat: {
                  type: 'object',
                  properties: {
                    score: { type: 'number' },
                    assessment: { type: 'string' },
                    moatTypes: { type: 'array', items: { type: 'string' } },
                  },
                  required: ['score', 'assessment', 'moatTypes'],
                  additionalProperties: false,
                },
                revenueModel: {
                  type: 'object',
                  properties: {
                    score: { type: 'number' },
                    assessment: { type: 'string' },
                    viability: { type: 'string' },
                  },
                  required: ['score', 'assessment', 'viability'],
                  additionalProperties: false,
                },
                executionRisk: {
                  type: 'object',
                  properties: {
                    score: { type: 'number' },
                    assessment: { type: 'string' },
                    keyRisks: { type: 'array', items: { type: 'string' } },
                  },
                  required: ['score', 'assessment', 'keyRisks'],
                  additionalProperties: false,
                },
                timingAndTrends: {
                  type: 'object',
                  properties: {
                    score: { type: 'number' },
                    assessment: { type: 'string' },
                    tailwinds: { type: 'array', items: { type: 'string' } },
                    headwinds: { type: 'array', items: { type: 'string' } },
                  },
                  required: ['score', 'assessment', 'tailwinds', 'headwinds'],
                  additionalProperties: false,
                },
                recommendations: {
                  type: 'object',
                  properties: {
                    topStrengths: { type: 'array', items: { type: 'string' } },
                    criticalWeaknesses: { type: 'array', items: { type: 'string' } },
                    nextSteps: { type: 'array', items: { type: 'string' } },
                    pivotSuggestions: { type: 'array', items: { type: 'string' } },
                  },
                  required: ['topStrengths', 'criticalWeaknesses', 'nextSteps', 'pivotSuggestions'],
                  additionalProperties: false,
                },
                investorPerspective: { type: 'string' },
                summary: { type: 'string' },
              },
              required: ['overallScore', 'verdict', 'marketSize', 'problemClarity', 'competitiveLandscape', 'moat', 'revenueModel', 'executionRisk', 'timingAndTrends', 'recommendations', 'investorPerspective', 'summary'],
              additionalProperties: false,
            },
          },
        } as any,
      });

      const content = response.choices[0].message.content as string;
      const result = JSON.parse(content);
      return result;
    }),
});
