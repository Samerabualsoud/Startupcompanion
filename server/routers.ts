import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { subscriptionRouter } from './subscriptionRouter';
import { profileRouter } from './profileRouter';
import { feasibilityRouter } from './feasibilityRouter';
import { inferenceRouter } from './inferenceRouter';

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  subscription: subscriptionRouter,
  profile: profileRouter,
  feasibility: feasibilityRouter,
  inference: inferenceRouter,
});

export type AppRouter = typeof appRouter;
