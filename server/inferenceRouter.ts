/**
 * Inference Router — AI fills in missing startup data
 * When users don't know a value (e.g. TAM, growth rate), AI infers a reasonable estimate
 * based on sector, stage, and available context.
 */
import { z } from 'zod';
import { publicProcedure, router } from './_core/trpc';
import { invokeLLM } from './_core/llm';

export const inferenceRouter = router({
  fillMissing: publicProcedure
    .input(z.object({
      knownData: z.record(z.string(), z.any()),
      missingFields: z.array(z.string()),
    }))
    .mutation(async ({ input }) => {
      const { knownData, missingFields } = input;

      const systemPrompt = `You are a startup data analyst. Given partial information about a startup, estimate reasonable values for missing fields.

Return ONLY a JSON object with the missing field names as keys and your estimated values. Include a "reasoning" key with a brief plain-English explanation of your estimates.

Use realistic, conservative estimates based on:
- Industry benchmarks for the sector
- Typical metrics for the funding stage
- Market conditions in the specified region

For financial figures, return numbers (not strings). For percentages, return numbers between 0-100.`;

      const userMessage = `Known startup data:
${JSON.stringify(knownData, null, 2)}

Please estimate these missing fields:
${missingFields.join(', ')}

Return a JSON object with estimated values and a "reasoning" explanation.`;

      const response = await invokeLLM({
        messages: [
          { role: 'system' as const, content: systemPrompt },
          { role: 'user' as const, content: userMessage },
        ],
        response_format: { type: 'json_object' },
      });

      const rawContent = response.choices[0]?.message?.content ?? '{}';
      const content = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent);

      try {
        return JSON.parse(content) as Record<string, any>;
      } catch {
        return { reasoning: 'Could not generate estimates. Please fill in the values manually.' };
      }
    }),
});
