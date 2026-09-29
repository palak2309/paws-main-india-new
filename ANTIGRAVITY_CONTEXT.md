# AutoAudit — Antigravity Context & Architecture Working Memory

> **Status:** Audited & Verified  
> **Source of Truth:** Workspace Source Code (`c:\Users\karan\Desktop\paws-india`)  
> **Last Updated:** 2026-09-27  

---

## 1. Project Purpose
**AutoAudit** is an AI-powered Financial Leakage Detection and Spend Analytics platform. It ingests accounting and ERP data (bills, invoices, payments, vendor master data) via OAuth or direct sync, runs deterministic rule engines (duplicate invoice, duplicate payment, overpayment, overdue liabilities), and layers authenticated AI reasoning (via Lovable AI Gateway + OpenAI GPT-6 Astra) to identify financial leakage, control breakages, and recovery opportunities.

---

## 2. Tech Stack & Architecture

- **Framework:** TanStack Start (`@tanstack/react-start` v1.168.32) with React 19 (`react` v19.2.0)
- **Routing:** TanStack Router (`@tanstack/react-router` v1.170.18) with code-based route tree generation (`src/routeTree.gen.ts` — **DO NOT EDIT DIRECTLY**)
- **State & Server Cache:** TanStack Query (`@tanstack/react-query` v5.101.1) + Server Functions (`createServerFn`)
- **Build & Server Engine:** Vite v8.2 + Nitro v3.0 (targeting Cloudflare edge worker) wrapped via `@lovable.dev/vite-tanstack-config`
- **Styling & UI:** TailwindCSS v4 (`@tailwindcss/vite` + `tailwindcss` v4.2.1), Radix UI primitives, Lucide React (`lucide-react` v0.575.0), Recharts (`recharts` v2.15.4), Motion (`motion` v13.0.0), Sonner toast (`sonner` v2.0.7)
- **Validation:** Zod v3.24.2
- **Backend / Database:** Supabase (`@supabase/supabase-js` v2.117.1) with PostgreSQL, Row Level Security (RLS), and database triggers
- **AI Gateway:** Vercel AI SDK (`ai` v7.0.107, `@ai-sdk/openai` v4.0.72) connecting server-side to Lovable AI Gateway (`https://ai.gateway.lovable.dev/v1`, model: `openai/gpt-6-astra`)

---

## 3. Directory Structure

```
├── .lovable/                      # Lovable metadata, project.json & historical dev plans
├── public/                        # Static assets (favicons, robots.txt, etc.)
├── src/
│   ├── components/
│   │   ├── common/                # Shared UI: DataTable, PageHeader, StatCard, ToneBadge, PermissionGate, NoData
│   │   ├── dashboard/             # Charts (SavingsTrend, LeakBreakdown, RiskRadar, AnomalyBar)
│   │   ├── erp/                   # ConnectWizard, ImportDashboard, ProviderConfigDialog, SyncTimeline
│   │   ├── layout/                # AppShell, AppSidebar, Topbar, AuthLayout
│   │   └── ui/                    # shadcn / Radix UI component library
│   ├── constants/
│   │   └── navigation.ts          # Nav links, RBAC role metadata & descriptions
│   ├── data/
│   │   └── mock.ts                # Static demo data (Alerts, Sessions, Recovery Cases, Workspace stubs)
│   ├── hooks/
│   │   ├── use-erp.ts             # React Query hooks wrapping ERP server functions
│   │   └── use-mobile.tsx         # Media query hook for mobile navigation
│   ├── integrations/
│   │   ├── lovable/               # Lovable cloud auth SDK wrapper
│   │   └── supabase/              # client.ts (browser), client.server.ts (service-role admin),
│   │                              # auth-middleware.ts, auth-attacher.ts, types.ts (database schema)
│   ├── lib/
│   │   ├── account.functions.ts   # Server function: getAccountStatus (public pre-login check)
│   │   ├── admin.functions.ts     # RBAC server functions (getMyAccess, listMembers, setMemberRole, etc.)
│   │   ├── erp.functions.ts       # ERP API gateway functions (connect, sync, status, financials, ai)
│   │   ├── csv.ts                 # Client CSV export helper
│   │   ├── format.ts              # Currency, date, percentage formatting utilities
│   │   └── erp/
│   │       ├── activity.server.ts # Sync runs & connection metrics query engine
│   │       ├── ai-analysis.server.ts # AI leakage analysis engine via streamText + Zod schema
│   │       ├── ai-gateway-responses.ts # OpenAI / Lovable AI client factory
│   │       ├── ai-gateway-run-id.ts # Trace header injection (X-Lovable-AIG-Run-ID)
│   │       ├── crypto.server.ts   # AES-256-GCM token encryption/decryption
│   │       ├── data.server.ts     # Ingested ERP data reader & rule-based leak detection algorithms
│   │       ├── oauth.server.ts    # OAuth flows, token exchange, refresh routines
│   │       ├── providers.ts       # Supported ERP provider metadata catalog
│   │       ├── service.server.ts  # ERP orchestration (begin/complete OAuth, sync, disconnect)
│   │       └── sync.server.ts     # Real API sync fetchers (Xero, QuickBooks, Zoho Books)
│   ├── providers/
│   │   ├── mock-auth-provider.tsx # Auth context bridging Supabase Auth + getMyAccess + mock fallback
│   │   └── theme-provider.tsx    # Light/Dark mode state management
│   ├── routes/                    # TanStack file-based routes
│   │   ├── __root.tsx             # Root HTML shell, styles, ThemeProvider, MockAuthProvider
│   │   ├── _shell.tsx             # Protected layout gate: checks session & active status
│   │   ├── _shell/
│   │   │   ├── index.tsx          # Real Dashboard (ERP aggregates, leak charts, top vendors)
│   │   │   ├── ai-insights.tsx    # AI Leakage scan trigger + synthesized findings
│   │   │   ├── analytics.tsx      # Spend & exposure analytics charts
│   │   │   ├── contracts.tsx      # Placeholder empty state (contracts not synced by providers)
│   │   │   ├── integrations.tsx   # Live ERP connection & sync management center
│   │   │   ├── invoices.tsx       # Live imported bills and invoices data table
│   │   │   ├── leaks.tsx          # Live rule-detected leakage register with evidence drawer
│   │   │   ├── notifications.tsx  # Mock notifications UI
│   │   │   ├── payments.tsx       # Live imported payment disbursements data table
│   │   │   ├── profile.tsx        # Profile display (Save changes is non-functional)
│   │   │   ├── recovery.tsx       # Mock recovery cases UI (action buttons are stubs)
│   │   │   ├── reports.tsx        # Dynamic report builder with live CSV export
│   │   │   ├── roles.tsx          # Live RBAC permission matrix editor
│   │   │   ├── security.tsx       # Mock MFA methods & session list
│   │   │   ├── settings.tsx       # Static settings switches (appearance theme switcher is functional)
│   │   │   ├── transactions.tsx   # Unified ledger (invoices + bills + payments)
│   │   │   ├── users.tsx          # Live workspace member management (invite, role, suspend, remove)
│   │   │   └── vendors.tsx        # Live vendor rollups (spend, invoices, leak counts)
│   │   ├── api/
│   │   │   └── public/erp/
│   │   │       └── callback.ts    # Public OAuth redirect receiver GET handler
│   │   ├── forgot-password.tsx    # Supabase password reset request
│   │   ├── login.tsx              # Password sign-in + Google OAuth via Lovable Auth
│   │   ├── mfa.tsx                # Mock MFA verification screen (setTimeout redirect)
│   │   ├── register.tsx           # Supabase sign-up
│   │   └── verify-email.tsx       # Email OTP / magic link verification
│   ├── router.tsx                 # Router instance constructor
│   ├── routeTree.gen.ts           # Auto-generated routing manifest
│   ├── server.ts                  # Nitro/Cloudflare SSR entry point & error handler
│   ├── start.ts                   # TanStack Start configuration (attachSupabaseAuth, CSRF)
│   └── styles.css                 # Design system, CSS variables, Tailwind configuration
└── supabase/
    ├── config.toml                # Local Supabase CLI configuration
    └── migrations/                # 6 SQL migrations establishing schema, enums, tables, RLS, functions
```

---

## 4. Authentication & RBAC

1. **Authentication:**
   - Supabase Auth (`supabase.auth.signInWithPassword`, `signUp`, `resetPasswordForEmail`, `onAuthStateChange`).
   - Browser client attaches JWT bearer token via `attachSupabaseAuth` in `src/start.ts`.
   - Server functions enforce authentication via `requireSupabaseAuth` middleware (`src/integrations/supabase/auth-middleware.ts`), which validates claims with Supabase and injects `userId`, `claims`, and an authenticated `supabase` client into context.
2. **Role-Based Access Control (RBAC):**
   - **Enums:** `public.app_role` (`admin`, `cfo`, `finance_manager`, `accountant`, `procurement_manager`, `auditor`, `viewer`).
   - **Permissions:** `public.app_permission` (`view`, `create`, `edit`, `delete`, `approve`, `recover`, `manage_users`, `manage_roles`, `export`, `configure`).
   - **Tables:** `public.user_roles` (maps `user_id` to `role`), `public.role_permissions` (matrix mapping `role` to `permission`).
   - **Enforcement:**
     - Client UI uses `<PermissionGate permission="...">` to hide/show routes and actions.
     - Server functions check role via `roleOf(context)` and `requireAdmin(context)` in `src/lib/admin.functions.ts`.
     - Database uses private function `private.has_role(auth.uid(), 'admin')` to enforce RLS on `user_roles` and `profiles`.

---

## 5. Database Schema & Tables

All tables have RLS enabled:
- `profiles`: User profiles linked to `auth.users(id)` (`full_name`, `company`, `email`, `department`, `job_title`, `status`, `last_seen_at`).
- `user_roles`: User role assignments.
- `role_permissions`: Role to permission mapping matrix.
- `erp_connections`: Connected accounting systems per user (`provider`, `account_name`, `credentials_ciphertext`, `status`, `last_sync_at`, `last_error`, `metadata`). Column `credentials_ciphertext` has SELECT revoked from `authenticated`.
- `erp_provider_config`: Server-only table storing OAuth client ID and encrypted client secrets configured for Xero, QuickBooks, Zoho Books.
- `erp_oauth_states`: Short-lived CSRF state tracking for active OAuth connection handshakes.
- `erp_vendors`: Ingested vendors/contacts (`name`, `email`, `phone`, `status`, `raw` jsonb).
- `erp_invoices`: Ingested customer invoices and vendor bills (`invoice_number`, `vendor_name`, `issue_date`, `due_date`, `amount`, `tax_amount`, `amount_paid`, `currency`, `status`, `type`, `raw` jsonb).
- `erp_payments`: Ingested payments (`reference`, `invoice_external_id`, `vendor_name`, `paid_date`, `amount`, `currency`, `method`, `status`, `raw` jsonb).
- `erp_contracts`: Schema exists, but accounting APIs do not provide contracts, so table is currently unused.
- `erp_sync_runs`: Audit log of each sync execution (`status`, `started_at`, `finished_at`, record counts, `error`).

---

## 6. ERP Integrations: Real vs Unimplemented

| Provider | Category | Auth Type | Ingestion Engine | Real Status | Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Xero** | Accounting | OAuth 2.0 | `pullXero()` in `sync.server.ts` | **Fully Functional** | Live API calls to `/Contacts`, `/Invoices`, `/Payments` |
| **QuickBooks Online** | Accounting | OAuth 2.0 | `pullQuickBooks()` in `sync.server.ts` | **Fully Functional** | Live QBO queries on `Vendor`, `Bill`, `BillPayment` |
| **Zoho Books** | Accounting | OAuth 2.0 | `pullZohoBooks()` in `sync.server.ts` | **Fully Functional** | Multi-page traversal for `contacts`, `bills`, `invoices`, `vendorpayments`, `customerpayments` |
| **NetSuite** | ERP | Manual / Token | None (`sync.server.ts` default error) | **UI Placeholder Only** | `oauth: false`, throws "cannot be synced automatically yet" |
| **SAP S/4HANA** | ERP | BTP / Dest | None (`sync.server.ts` default error) | **UI Placeholder Only** | `oauth: false`, throws "cannot be synced automatically yet" |
| **Oracle Fusion** | ERP | REST API | None (`sync.server.ts` default error) | **UI Placeholder Only** | `oauth: false`, throws "cannot be synced automatically yet" |

---

## 7. AI Architecture

- **Server Function:** `runAiLeakageAnalysis` in `src/lib/erp.functions.ts`.
- **Implementation:** `analyzeLeakageFor` in `src/lib/erp/ai-analysis.server.ts`.
- **Gateway & Model:** Lovable AI Gateway (`https://ai.gateway.lovable.dev/v1`), Model: `openai/gpt-6-astra`.
- **Protocol:** `streamText` from Vercel AI SDK with OpenAI Responses streaming endpoint (`provider.responses(model)`).
- **Structured Output:** Strictly enforced via Zod schema (`leakageAnalysisSchema`) using `Output.object({ schema })`.
- **Context Bounds:** Compact financial payload sent to avoid token limits:
  - Max 80 invoices (compacted fields)
  - Max 80 payments (compacted fields)
  - Max 40 vendors (aggregates)
  - Max 60 rule-based findings
- **Resilience & Retry:** 3-attempt backoff retry exclusively for status `429` (rate limit) and `5xx` (gateway error). Statuses `401`, `402`, `403`, `404` treated as immediate terminal errors with sanitized user messages.
- **Security:** Gateway key (`LOVABLE_API_KEY`) is read strictly on the server and is never sent to the client.

---

## 8. Leak Detection Rule Engine (`data.server.ts`)

Computed dynamically in-memory on the server when `loadOverview()` runs:
1. **Duplicate Invoices (`Duplicate invoice`):** Matches invoices sharing `${vendor_name}|${amount.toFixed(2)}|${issue_date}`. Severity: `critical`. Exposure: `amount * (count - 1)`.
2. **Duplicate Payments (`Duplicate payment`):** Matches payments sharing `${vendor_name}|${amount.toFixed(2)}|${paid_date}`. Severity: `critical`. Exposure: `amount * (count - 1)`.
3. **Overpayments (`Overpayment`):** Aggregates payments grouped by `invoice_external_id`. Triggers if `total_paid - invoice_amount > 0.50`. Severity: `high`. Exposure: `total_paid - invoice_amount`.
4. **Overdue Liabilities (`Overdue liability`):** Evaluates invoices where `due_date < today` and unpaid balance `> 0.50`. Severity: `medium`. Exposure: remaining balance.

*Note:* Rules for Vendor Overcharge, Tax Errors, Contract Violations, Subscription Sprawl, and Fraud Indicators mentioned in earlier specs are **NOT** implemented in the deterministic rule engine; they are currently surfaced only if synthesized by the AI analysis model.

---

## 9. Real vs Mock Functionality Summary

- **100% Real Features:**
  - Supabase authentication (sign up, sign in, email verification, password reset)
  - Dynamic user roles and permission matrix editing (`/roles`, `role_permissions` table)
  - User management (`/users`: invite member, change role, suspend user, delete user)
  - ERP OAuth connect and token exchange for Xero, QuickBooks, Zoho Books (`/integrations`, `erp_connections`)
  - Live data ingestion for vendors, invoices, payments (`erp_vendors`, `erp_invoices`, `erp_payments`)
  - Real Dashboard metrics, monthly spend trends, and top vendors (`/`)
  - Real Financial Leaks detection register and evidence inspector (`/leaks`)
  - Real Invoices (`/invoices`), Payments (`/payments`), Transactions (`/transactions`), and Vendors (`/vendors`) data tables
  - Real dynamic CSV report generation and downloads (`/reports`)
  - Real AI Leakage Scan execution via Lovable AI Gateway (`/ai-insights`)
- **Mock / Stubbed Features:**
  - MFA verification page (`/mfa` — uses `setTimeout` to navigate to `/`)
  - Recovery Center (`/recovery` — renders static `recoveryCases` from `mock.ts`, "Open case" does nothing)
  - Notifications list (`/notifications` — renders static `alerts` from `mock.ts`)
  - Security settings (`/security` — renders static `sessions` from `mock.ts`, "Revoke" / "Manage MFA" are no-ops)
  - User profile form (`/profile` — "Save changes" has no click handler)
  - Settings page (`/settings` — switches and inputs are unbound; only theme switcher functions)
  - Contracts page (`/contracts` — shows empty state because providers don't sync contracts)
  - Enterprise ERP connectors (NetSuite, SAP S/4HANA, Oracle Fusion — config wizard only, sync throws error)

---

## 10. Security Constraints & Audit Findings

1. **[RESOLVED] `saveProviderConfig` Admin Authorization:**
   - File: `src/lib/erp.functions.ts` lines 63–80.
   - Enforced server-side `await requireAdmin(context as unknown as Ctx)` before saving credentials to `erp_provider_config`. Non-admin users now receive `Forbidden: admin role required`.
2. **User Enumeration in `getAccountStatus`:**
   - File: `src/lib/account.functions.ts` lines 14–44.
   - Public unauthenticated server function calls `supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 })` to check whether an email exists, is confirmed, or is suspended. Allows attackers to enumerate registered emails and leaks user existence.
3. **Missing Local Environment Variables:**
   - `.env` lacks `SUPABASE_SERVICE_ROLE_KEY`, `ERP_TOKEN_ENCRYPTION_KEY`, and `LOVABLE_API_KEY`. Server functions calling admin client or encryption will fail locally unless these keys are supplied.
4. **Service Role Exposure:**
   - `client.server.ts` is guarded with a warning; must only be imported in `.server.ts` files or dynamic imports inside server function handlers. Never import top-level in client bundles.

---

## 11. Edge Runtime Constraints

- The production app builds to Cloudflare Workers via Nitro (`.output/server/wrangler.json`).
- Server modules use `node:crypto` (`createCipheriv`, `createDecipheriv`, `randomBytes`, `createHash`) in `crypto.server.ts`, `service.server.ts`, `cron-auth.ts`, and Node `Buffer`.
- *Requirement:* Cloudflare deployment configuration must include `compatibility_flags: ["nodejs_compat"]` (or `nodejs_compat_v2`) for crypto and Buffer polyfills to work without crashing.

---

## 12. Build & Verification Commands

- **Install:** `npm install` (or `bun install`)
- **Build:** `npm run build` (runs `vite build`, builds client bundle + Nitro Cloudflare worker)
- **Typecheck:** `npx tsc --noEmit` (passes with 0 errors)
- **Lint:** `npm run lint` (runs `eslint .`). Note: On Windows, git CRLF line endings trigger Prettier `Delete ␍` errors. Code-level rules have 24 `@typescript-eslint/no-explicit-any` errors and 1 `prefer-const` in `previewAuthStorage.ts`.

---

## 13. Critical Rules for Future Agents

1. **NEVER manually edit `src/routeTree.gen.ts`:** This file is managed solely by TanStack Router plugin.
2. **Maintain Lovable History Integrity:** Do NOT rebase, squash, or force-push commits already pushed to the remote repository.
3. **Keep AI Credential Server-Side:** AI API keys and gateway interactions must remain strictly in TanStack server functions (`*.server.ts` or server function handlers).
4. **Preserve RLS and Separation of Concerns:** Direct database queries from the client must go through client `supabase` using RLS; administrative overrides must use `supabaseAdmin` behind server functions with explicit role validation (`requireAdmin`).
5. **Transient vs Persisted Leaks:** Currently leaks are computed transiently in `data.server.ts`. When creating a persistence layer for triage or recovery tracking, introduce an explicit database migration and avoid breaking `loadOverview()`.
