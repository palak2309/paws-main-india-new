import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { DataTable, type Column } from "@/components/common/data-table";
import { ToneBadge } from "@/components/common/tone-badge";
import { NoImportedData } from "@/components/common/no-data";
import { Button } from "@/components/ui/button";
import { useErpOverview } from "@/hooks/use-erp";
import { downloadCsv } from "@/lib/csv";
import { compactCurrencyIn, dateShort } from "@/lib/format";

interface LiveReport {
  id: string;
  name: string;
  type: string;
  scope: string;
  value: string;
  generated: string | null;
}

export const Route = createFileRoute("/_shell/reports")({
  head: () => ({
    meta: [
      { title: "Reports — AutoAudit" },
      { name: "description", content: "Board-ready leakage, recovery and compliance reports generated from live audit data." },
      { property: "og:title", content: "Reports — AutoAudit" },
      { property: "og:description", content: "Board-ready leakage, recovery and compliance reports generated from live audit data." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const { data, isLoading } = useErpOverview();
  const code = data?.currencyCode;
  const reports = useMemo<LiveReport[]>(() => {
    if (!data?.connected) return [];

    const latestSync = data.syncRuns[0]?.startedAt ?? null;
    const topVendor = data.topVendors[0];
    const period = data.spendByMonth.length > 0
      ? `${data.spendByMonth[0]?.month ?? ""}–${data.spendByMonth.at(-1)?.month ?? ""}`
      : "Imported period";

    return [
      {
        id: "live-spend-overview",
        name: "Spend overview",
        type: "Financial summary",
        scope: `${period} · ${data.totals.invoices.toLocaleString()} invoices`,
        value: compactCurrencyIn(data.totals.spend, code),
        generated: latestSync,
      },
      {
        id: "live-leakage-register",
        name: "Leakage register",
        type: "Findings analysis",
        scope: `${data.leaks.length.toLocaleString()} findings · ${data.leakMix.length} categories`,
        value: compactCurrencyIn(data.totals.atRisk, code),
        generated: latestSync,
      },
      {
        id: "live-vendor-concentration",
        name: "Vendor concentration",
        type: "Vendor analysis",
        scope: topVendor ? `Top party: ${topVendor.vendor}` : "No vendor spend yet",
        value: topVendor ? compactCurrencyIn(topVendor.spend, code) : "—",
        generated: latestSync,
      },
      {
        id: "live-outstanding-exposure",
        name: "Outstanding exposure",
        type: "Cash exposure",
        scope: `${data.totals.payments.toLocaleString()} payments matched against imported bills`,
        value: compactCurrencyIn(data.totals.outstanding, code),
        generated: latestSync,
      },
    ];
  }, [code, data]);

  const columns: Column<LiveReport>[] = [
    { key: "name", header: "Report", render: (r) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{r.name}</p>
          <p className="truncate text-xs text-muted-foreground">{r.scope}</p>
        </div>
      ) },
    { key: "type", header: "Type", render: (r) => <ToneBadge tone="brand">{r.type}</ToneBadge> },
    { key: "value", header: "Live value", align: "right", render: (r) => <span className="text-sm font-semibold tabular-nums">{r.value}</span> },
    { key: "generated", header: "Last imported", align: "right", render: (r) => <span className="text-sm text-muted-foreground">{dateShort(r.generated)}</span> },
  ];

  return (
    <>
      <PageHeader
        title="Reports"
        description="Live summaries computed from the invoices, payments, vendors and findings in your account."
        crumbs={[{ label: "Reports" }]}
        actions={
          <Button
            variant="outline"
            className="gap-2"
            disabled={reports.length === 0}
            onClick={() => downloadCsv("reports.csv", reports.map((report) => ({ ...report })))}
          >
            <Download className="size-4" /> Export
          </Button>
        }
      />
      {!isLoading && reports.length === 0 ? (
        <NoImportedData title="No report data available yet" />
      ) : (
        <DataTable
          data={reports}
          columns={columns}
          loading={isLoading}
          rowKey={(r) => r.id}
          searchKeys={["name", "type", "scope"]}
          searchPlaceholder="Search reports…"
        />
      )}
    </>
  );
}
