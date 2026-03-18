import { z } from 'zod';
import { router, protectedProcedure } from './_core/trpc';
import { invokeLLM } from './_core/llm';

export const termSheetRouter = router({
  generate: protectedProcedure
    .input(z.object({
      instrument: z.enum(['safe', 'convertible-note', 'priced-round']),
      companyName: z.string(),
      companyState: z.string(),
      investorName: z.string(),
      closingDate: z.string(),
      language: z.string().optional().default('en'),
      // SAFE fields
      safeFields: z.object({
        investmentAmount: z.string(),
        valuationCap: z.string(),
        discountRate: z.string(),
        mfnClause: z.boolean(),
        proRataRights: z.boolean(),
      }).optional(),
      // Convertible Note fields
      noteFields: z.object({
        principalAmount: z.string(),
        interestRate: z.string(),
        maturityMonths: z.string(),
        valuationCap: z.string(),
        discountRate: z.string(),
        conversionTrigger: z.string(),
      }).optional(),
      // Priced Round fields
      pricedFields: z.object({
        preMoneyValuation: z.string(),
        investmentAmount: z.string(),
        sharePrice: z.string(),
        boardSeats: z.string(),
        liquidationPreference: z.string(),
        antiDilution: z.string(),
        participatingPreferred: z.boolean(),
        dividendRate: z.string(),
        redemptionRights: z.boolean(),
      }).optional(),
    }))
    .mutation(async ({ input }) => {
      const langInstruction = input.language === 'ar'
        ? 'Generate the term sheet in Arabic.'
        : 'Generate the term sheet in English.';

      let dealDetails = '';
      if (input.instrument === 'safe' && input.safeFields) {
        const f = input.safeFields;
        dealDetails = `
SAFE (Simple Agreement for Future Equity)
- Investment Amount: $${f.investmentAmount}
- Valuation Cap: ${f.valuationCap ? '$' + f.valuationCap : 'None (uncapped)'}
- Discount Rate: ${f.discountRate}%
- MFN Clause: ${f.mfnClause ? 'Yes' : 'No'}
- Pro-Rata Rights: ${f.proRataRights ? 'Yes' : 'No'}`;
      } else if (input.instrument === 'convertible-note' && input.noteFields) {
        const f = input.noteFields;
        dealDetails = `
Convertible Note
- Principal Amount: $${f.principalAmount}
- Interest Rate: ${f.interestRate}% per annum
- Maturity: ${f.maturityMonths} months
- Valuation Cap: ${f.valuationCap ? '$' + f.valuationCap : 'None'}
- Discount Rate: ${f.discountRate}%
- Qualified Financing Threshold: $${f.conversionTrigger}`;
      } else if (input.instrument === 'priced-round' && input.pricedFields) {
        const f = input.pricedFields;
        dealDetails = `
Priced Equity Round (Series Preferred)
- Pre-Money Valuation: $${f.preMoneyValuation}
- Investment Amount: $${f.investmentAmount}
- Share Price: $${f.sharePrice}
- Board Seats: ${f.boardSeats}
- Liquidation Preference: ${f.liquidationPreference}
- Anti-Dilution: ${f.antiDilution}
- Participating Preferred: ${f.participatingPreferred ? 'Yes' : 'No'}
- Dividend Rate: ${f.dividendRate}%
- Redemption Rights: ${f.redemptionRights ? 'Yes' : 'No'}`;
      }

      const prompt = `${langInstruction}

You are a startup attorney. Generate a professional, complete term sheet for the following deal:

COMPANY: ${input.companyName}
JURISDICTION: ${input.companyState}
INVESTOR: ${input.investorName}
CLOSING DATE: ${input.closingDate}
INSTRUMENT: ${input.instrument.toUpperCase()}

DEAL TERMS:
${dealDetails}

Generate a well-structured term sheet document with the following sections:
1. Header (company, investor, date, instrument type)
2. Summary of Terms
3. Detailed Terms (all the specific terms above)
4. Standard Provisions (representations, conditions to closing, confidentiality)
5. Governing Law
6. Signature Block

Format it as a proper legal document. Include standard market terms and conditions appropriate for a ${input.instrument} in a startup context. Make it professional and comprehensive.`;

      const response = await invokeLLM({
        messages: [
          { role: 'system', content: 'You are an expert startup attorney specializing in venture capital transactions. Generate professional, legally-sound term sheets.' },
          { role: 'user', content: prompt },
        ],
      });

      return { content: response.choices[0].message.content as string };
    }),
});
