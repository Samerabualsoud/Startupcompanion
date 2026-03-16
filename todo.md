# AI Startup Toolkit — Project TODO

## Auth System
- [x] Replace Manus OAuth with custom email/password auth
- [x] Backend: register, login, logout, me procedures (authRouter.ts)
- [x] JWT session cookies (jose library)
- [x] bcryptjs password hashing
- [x] Update context.ts to use custom JWT verification
- [x] Sign In page (/login)
- [x] Register page (/register) with password strength indicator
- [x] Update useAuth hook to use custom auth
- [x] Update const.ts to remove Manus OAuth URLs

## Homepage
- [x] Marketing landing page (LandingPage.tsx) at /
- [x] Hero section with stats
- [x] Tools grid (13 tools)
- [x] How it works section
- [x] Database highlight section
- [x] Testimonials section
- [x] CTA section
- [x] Footer

## Investor & Resources Database
- [x] VC Firms database (35 firms, global coverage)
- [x] Angel Investors database (25 investors)
- [x] Grants & Programs database (22 grants)
- [x] Venture Lawyers database (20 firms)
- [x] Search and filter functionality
- [x] ResourceDatabase component with tabs
- [x] resourcesRouter.ts with tRPC procedures
- [x] Integrated into Home.tsx sidebar nav
- [x] Community badge on user-submitted entries

## KYC Onboarding Flow
- [x] Add userType field to users table (vc | angel | venture_lawyer | startup | other)
- [x] Add kycCompleted boolean to users table
- [x] Create kycVcProfiles table
- [x] Create kycAngelProfiles table
- [x] Create kycLawyerProfiles table
- [x] Create kycStartupProfiles table
- [x] Push DB schema changes
- [x] Build kycRouter.ts with type-specific submitKyc procedures
- [x] Auto-populate resource database from user-submitted profiles
- [x] Build KYC multi-step onboarding wizard (post-registration)
- [x] Redirect new users to /onboarding after registration

## Arabic (RTL) Language Support
- [x] Create i18n system with LanguageContext (en/ar)
- [x] Arabic translation file for all UI strings
- [x] RTL layout support (dir="rtl", font: Noto Kufi Arabic)
- [x] Language switcher in navbar and app header
- [x] Translate landing page (hero, tools, features, CTA, footer)
- [x] Translate auth pages (login, register)
- [x] Translate sidebar nav and tool headers
- [x] Translate KYC onboarding wizard
- [x] Translate resource database UI
- [x] Persist language preference in localStorage

## App Structure
- [x] /app route for the main toolkit (Home.tsx)
- [x] / route for landing page
- [x] /login and /register routes
- [x] /onboarding route for KYC wizard
- [x] Sidebar nav updated with Database section (13 tools)

## Tests
- [x] auth.custom.test.ts (14 tests passing)
- [x] auth.logout.test.ts (1 test passing)

## Future Improvements
- [ ] Email verification flow
- [ ] Forgot password / reset password
- [ ] Social login (Google, GitHub)
- [ ] User profile settings page
- [ ] Persist investor CRM data to database
- [ ] Save valuations to database
- [ ] Admin panel to verify KYC community members
- [ ] Startup-to-investor matching engine

## Bug Fixes
- [x] Fix sign in / sign up auth issues (missing cookie-parser middleware)

## New Features (Round 3)
- [x] Forgot password flow (/forgot-password, /reset-password, passwordResetRouter)
- [x] Startup-to-investor matching engine (matchingRouter + InvestorMatcher UI)
- [x] Admin dashboard for reviewing/verifying community KYC submissions (/admin, adminRouter)
- [x] Admin tool added to sidebar nav (access-gated to admin role)
- [x] 15 tests passing, zero TypeScript errors
