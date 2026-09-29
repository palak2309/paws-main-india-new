import { createFileRoute } from "@tanstack/react-router";
import { PermissionGate } from "@/components/common/permission-gate";
import { PageHeader } from "@/components/common/page-header";
import { ToneBadge } from "@/components/common/tone-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/providers/theme-provider";
import { useErpOverview } from "@/hooks/use-erp";
import { useMockAuth } from "@/providers/mock-auth-provider";

export const Route = createFileRoute("/_shell/settings")({
  head: () => ({
    meta: [
      { title: "Settings — AutoAudit" },
      {
        name: "description",
        content: "Workspace preferences, detection thresholds, notification routing and appearance.",
      },
      { property: "og:title", content: "Settings — AutoAudit" },
      {
        property: "og:description",
        content: "Workspace preferences, detection thresholds, notification routing and appearance.",
      },
    ],
  }),
  component: () => (
    <PermissionGate permission="configure">
      <SettingsPage />
    </PermissionGate>
  ),
});

function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { data: erp } = useErpOverview();
  const { workspace } = useMockAuth();

  const orgName = workspace.name || "AutoAudit Workspace";
  const currency = erp?.currencyCode ? `${erp.currencyCode} — Primary Ledger Currency` : "USD — US Dollar";

  return (
    <>
      <PageHeader
        title="Settings"
        description="Workspace preferences, detection thresholds, notification routing and appearance."
        crumbs={[{ label: "Settings" }]}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-sm font-semibold">Connected Workspace</h2>
            <ToneBadge tone={erp?.connected ? "success" : "muted"} size="sm">
              {erp?.connected ? "ERP Connected" : "Standalone"}
            </ToneBadge>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ws-name">Organisation name</Label>
              <Input id="ws-name" value={orgName} readOnly className="bg-muted text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">
                Synchronized from your connected accounting system
              </span>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ws-currency">Reporting currency</Label>
              <Input id="ws-currency" value={currency} readOnly className="bg-muted text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">
                Inferred from imported ledger transactions
              </span>
            </div>
          </div>
        </section>

        <section className="surface-card p-6 space-y-4">
          <h2 className="text-sm font-semibold border-b border-border pb-3">Detection & alerts</h2>
          <div className="space-y-4">
            {[
              ["Duplicate payment guardrail", "Hold suspected duplicates before ACH release"],
              ["Fraud escalation", "Notify the fraud committee for critical findings"],
              ["Weekly CFO digest", "Email a savings summary every Monday"],
            ].map(([t, d]) => (
              <div key={t} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{t}</p>
                  <p className="text-xs text-muted-foreground">{d}</p>
                </div>
                <Switch defaultChecked />
              </div>
            ))}
          </div>
        </section>

        <section className="surface-card p-6 space-y-3">
          <h2 className="text-sm font-semibold">Appearance</h2>
          <p className="text-xs text-muted-foreground">Switch between light and dark presentation.</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={toggleTheme}>
            Switch to {theme === "dark" ? "light" : "dark"} mode
          </Button>
        </section>

        <section className="surface-card p-6 space-y-3">
          <h2 className="text-sm font-semibold border-b border-border pb-3">Legal & Statutory Information</h2>
          <div className="text-xs text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Operating Entity:</strong> AutoAudit Technologies Private Limited</p>
            <p><strong className="text-foreground">Corporate ID (CIN):</strong> U72900MH2024PTC419820</p>
            <p><strong className="text-foreground">Registered Office:</strong> BKC, Mumbai, MH 400051, India</p>
            <p><strong className="text-foreground">Data Protection Officer:</strong> Karan Bagal (grievance@autoaudit.app)</p>
            <div className="pt-2 flex flex-wrap gap-3 font-medium">
              <a href="/privacy-policy" className="text-primary underline">Privacy Policy (DPDP Act)</a>
              <a href="/terms-and-conditions" className="text-primary underline">Terms & Conditions</a>
              <a href="/cookie-policy" className="text-primary underline">Cookie Policy</a>
              <a href="/refund-policy" className="text-primary underline">Refund Policy</a>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
