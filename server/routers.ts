import { systemRouter } from "./_core/systemRouter";
import { router } from "./_core/trpc";
import { authRouter } from './authRouter';
import { subscriptionRouter } from './subscriptionRouter';
import { profileRouter } from './profileRouter';
import { feasibilityRouter } from './feasibilityRouter';
import { inferenceRouter } from './inferenceRouter';
import { resourcesRouter } from './resourcesRouter';
import { kycRouter } from './kycRouter';

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  subscription: subscriptionRouter,
  profile: profileRouter,
  feasibility: feasibilityRouter,
  inference: inferenceRouter,
  resources: resourcesRouter,
  kyc: kycRouter,
});

export type AppRouter = typeof appRouter;
