# Add AI leakage analysis

## Outcome
Add an authenticated “Run AI analysis” action to AI Insights that reviews the user’s imported invoices, payments, vendors, and existing rule-based findings, then shows prioritized, explainable leakage risks.

## User-facing changes
- Add a clear AI analysis control beside the existing re-analysis control.
- Show loading progress while the analysis runs.
- Display the AI summary, prioritized findings, estimated exposure, confidence, and recommended next controls.
- Surface the safe gateway error message when analysis cannot run, without blanking the page.

## Technical details
- Add a protected TanStack server function that loads only the signed-in user’s ERP data.
- Call Lovable AI server-side with the required `openai/gpt-6-astra` Responses streaming protocol and strict JSON output.
- Send compact, bounded financial context to avoid oversized requests; never expose the API key to the browser.
- Retry only rate-limit and transient server failures with bounded backoff; treat other gateway statuses as terminal.
- Render the result in the existing AutoAudit design system and verify build, runtime, and the signed-out empty state.
