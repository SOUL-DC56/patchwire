# PatchWire Cyber

A premium dark-themed cybersecurity virtual practical program platform selling internship tracks to students in India. Includes PCCA assessment, Razorpay payments, career hub, and a full course catalog.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/patchwire run dev` — run the frontend (port 20606)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Optional env: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` — for live Razorpay payments

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Wouter routing, Framer Motion, Recharts
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Fonts: Space Grotesk + JetBrains Mono

## Where things live

- DB schema: `lib/db/src/schema/` (tracks, users, career, reviews)
- API contract: `lib/api-spec/openapi.yaml`
- Generated hooks: `lib/api-client-react/src/generated/`
- API routes: `artifacts/api-server/src/routes/`
- Frontend: `artifacts/patchwire/src/`

## Architecture decisions

- Auth uses a simple base64 JWT-like token (`pw_<base64_payload>`) stored in localStorage — not a proper JWT, but sufficient for MVP; upgrade to real JWT if deploying to production.
- PCCA assessment questions are hardcoded in `assessment.ts` route for performance; no DB table needed.
- Razorpay signature verification is skipped when `RAZORPAY_KEY_SECRET` is not set (dev mode), so the payment flow can be demoed without a live key.
- Track stats endpoint computes aggregate enrollment counts from the `tracks` table, no separate analytics table needed.
- Access codes are one-time use; tracked via `used_at` timestamp in `access_codes` table.

## Product

- Landing page with hero, track highlights, stats bar, testimonials, how-it-works, and pricing disclaimer
- Track catalog: Basic (₹29-59) and Advanced (₹49-399) internship tracks + Bundles
- PCCA: 50-question MCQ assessment with radar chart results and track recommendation
- Enrollment: Razorpay payment + Access Code redemption
- Auth: Register/Login with JWT stored in localStorage
- Career Hub: Jobs (DB-backed), Free Resources, Cyber News, Interview Prep, Roadmap
- User Dashboard: enrolled tracks, enrollment letters placeholder
- Support: contact form with category selection
- Reviews: student testimonials with star ratings

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after any OpenAPI spec change before writing new routes or frontend hooks.
- The `integer` import must be explicitly included in Drizzle schema files — it's not auto-imported.
- Tracks route `/tracks/stats` must be registered BEFORE `/:id` in the Express router or it will be caught by the param route.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
