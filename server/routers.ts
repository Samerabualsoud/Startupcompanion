import { systemRouter } from "./_core/systemRouter";
import { router } from "./_core/trpc";
import { authRouter } from './authRouter';
import { subscriptionRouter } from './subscriptionRouter';
import { profileRouter } from './profileRouter';
import { feasibilityRouter } from './feasibilityRouter';
import { inferenceRouter } from './inferenceRouter';
import { resourcesRouter } from './resourcesRouter';
import { kycRouter } from './kycRouter';
import { passwordResetRouter } from './passwordResetRouter';
import { adminRouter } from './adminRouter';
import { matchingRouter } from './matchingRouter';
import { crmRouter } from './crmRouter';
import { aiRouter } from './aiRouter';
import { valuationHistoryRouter } from './valuationHistoryRouter';
import { cogsRouter } from './cogsRouter';
import { dataRoomRouter } from './dataRoomRouter';
import { salesRouter } from './salesRouter';
import { esopRouter } from './esopRouter';

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  subscription: subscriptionRouter,
  profile: profileRouter,
  feasibility: feasibilityRouter,
  inference: inferenceRouter,
  resources: resourcesRouter,
  kyc: kycRouter,
  passwordReset: passwordResetRouter,
  admin: adminRouter,
  matching: matchingRouter,
  crm: crmRouter,
  ai: aiRouter,
  valuationHistory: valuationHistoryRouter,
  cogs: cogsRouter,
  dataRoom: dataRoomRouter,
  sales: salesRouter,
  esop: esopRouter,
});

export type AppRouter = typeof appRouter;
