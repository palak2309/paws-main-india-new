# Replace sample data with your real imported data

Your Leaks and Integrations pages already run on the data pulled from your accounting account. Everything else still shows the built-in demo numbers. This plan moves the rest of the app onto your real records.

## Pages that switch to real data

- **Dashboard (home)** — spend, outstanding, at-risk totals, monthly spend chart, top vendors, latest findings and recent sync activity, all from your imported records.
- **Invoices** — every imported bill and customer invoice, with number, party, dates, amount, paid amount, currency and status; searchable and sortable.
- **Payments** — imported vendor and customer payments with reference, linked invoice, date, amount and method.
- **Vendors** — imported contacts with name, email, phone, status, plus total spend and invoice count per vendor.
- **Transactions** — a single combined timeline of invoices and payments with a type filter.
- **AI Insights** — insight cards generated from the real findings (biggest exposure, duplicate concentration, overdue liabilities, top-spend vendors) instead of scripted text.
- **Analytics / Reports** — charts and report figures computed from real spend, vendor mix and findings.

## Pages that stay as they are (and why)

- **Contracts** — your accounting connection doesn't send contracts today, so there is nothing real to show. It will display an "import a contract source" empty state rather than fake rows.
- **Notifications, Recovery cases, Security sessions** — these are app-side features with no imported source yet. They keep their current content; I'll flag them clearly as placeholders so nothing looks like real finance data.

## Shared behaviour

- Every switched page shows a loading state, and, when nothing has been imported yet, a friendly empty state with a link to Integrations.
- Amounts and dates use the currency and format that came from your account.
- A page refreshes automatically after a sync finishes.

## Technical notes

- Extend `src/lib/erp/data.server.ts` with the aggregates the new pages need (vendor spend rollups, combined transaction list, insight inputs) and expose them through new read functions in `src/lib/erp.functions.ts` alongside `getErpFinancials` / `getErpOverview`.
- Each page uses `useServerFn` + `useQuery` with a shared query key so a sync invalidates all of them.
- Charts in `src/components/dashboard/charts.tsx` take data via props instead of importing from `src/data/mock`.
- `src/data/mock.ts` keeps only the entries still used (alerts, sessions, recovery cases, workspace/user defaults); the finance arrays are removed.
- Typecheck with `bunx tsgo --noEmit` at the end.
