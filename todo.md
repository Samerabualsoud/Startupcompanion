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
- [x] VC Firms database (15+ firms, global coverage)
- [x] Angel Investors database (10+ investors)
- [x] Grants & Programs database (12+ grants)
- [x] Venture Lawyers database (12+ firms)
- [x] Search and filter functionality
- [x] ResourceDatabase component with tabs
- [x] resourcesRouter.ts with tRPC procedures
- [x] Integrated into Home.tsx sidebar nav

## App Structure
- [x] /app route for the main toolkit (Home.tsx)
- [x] / route for landing page
- [x] /login and /register routes
- [x] Sidebar nav updated with Database section (13 tools)

## Tests
- [x] auth.custom.test.ts (15 tests passing)
- [x] auth.logout.test.ts (1 test passing)

## Future Improvements
- [ ] Email verification flow
- [ ] Forgot password / reset password
- [ ] Social login (Google, GitHub)
- [ ] User profile settings page
- [ ] Persist investor CRM data to database
- [ ] Save valuations to database
