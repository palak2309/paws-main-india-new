import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { DataTable, type Column } from "@/components/common/data-table";
import { ToneBadge } from "@/components/common/tone-badge";
import { NoImportedData } from "@/components/common/no-data";
import { Button } from "@/components/ui/button";
import { useErpFinancials } from "@/hooks/use-erp";
import { downloadCsv } from "@/lib/csv";
import { currencyIn, dateShort } from "@/lib/format";

type Row = Record<string, any>;

export const Route = createFileRoute("/_shell/payments")({
  head: () => ({
    meta: [
      { title: "Payments — AutoAudit" },
      { name: "description", content: "Every payment imported from your connected accounting system, matched to the invoice it settles." },
      { property: "og:title", content: "Payments — AutoAudit" },
      { property: "og:description", content: "Imported payments matched to the invoices they settle." },
    ],
  }),
  component: PaymentsPage,
});

function PaymentsPage() {
  const { data, isLoading } = useErpFinancials();
  const rows: Row[] = (data?.payments ?? []) as Row[];

  const columns: Column<Row>[] = [
    {
      key: "reference",
      header: "Payment",
      render: (r) => (
        <div className="min-w-0">
          <p className="text-sm font-medium">{r["reference"] ?? r["external_id"]}</p>
          <p className="truncate text-xs text-muted-foreground">
            {r["invoice_external_id"] ? `Applied to ${r["invoice_external_id"]}` : "Unapplied"}
          </p>
        </div>
      ),
    },
    { key: "vendor_name", header: "Party", render: (r) => <span className="text-sm">{r["vendor_name"] ?? "—"}</span> },
    {
      key: "method",
      header: "Method",
      render: (r) => <ToneBadge tone="muted">{r["method"] ?? "Unspecified"}</ToneBadge>,
    },
    { key: "paid_date", header: "Date", render: (r) => <span className="text-sm">{dateShort(r["paid_date"])}</span> },
    {
      key: "currency",
      header: "Currency",
      render: (r) => <span className="text-sm text-muted-foreground">{r["currency"] ?? "—"}</span>,
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (r) => (
        <span className="text-sm font-semibold tabular-nums">{currencyIn(Number(r["amount"] ?? 0), r["currency"])}</span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Payments"
        description={`${rows.length.toLocaleString()} payments imported from your connected systems.`}
        crumbs={[{ label: "Payments" }]}
        actions={
          <Button variant="outline" className="gap-2" disabled={rows.length === 0} onClick={() => downloadCsv("payments.csv", rows)}>
            <Download className="size-4" /> Export
          </Button>
        }
      />
      {!isLoading && rows.length === 0 ? (
        <NoImportedData title="No payments imported yet" />
      ) : (
        <DataTable
          data={rows}
          columns={columns}
          loading={isLoading}
          rowKey={(r) => String(r["id"])}
          searchKeys={["reference", "vendor_name", "invoice_external_id", "external_id"]}
          searchPlaceholder="Search payments…"
        />
      )}
    </>
  );
}
