import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { DataTable, type Column } from "@/components/common/data-table";
import { StatusBadge, ToneBadge } from "@/components/common/tone-badge";
import { NoImportedData } from "@/components/common/no-data";
import { Button } from "@/components/ui/button";
import { useErpFinancials } from "@/hooks/use-erp";
import { downloadCsv } from "@/lib/csv";
import { currencyIn, dateShort } from "@/lib/format";

type Row = Record<string, any>;

export const Route = createFileRoute("/_shell/invoices")({
  head: () => ({
    meta: [
      { title: "Invoices — AutoAudit" },
      { name: "description", content: "Every invoice and bill imported from your connected accounting system, with amounts, balances and status." },
      { property: "og:title", content: "Invoices — AutoAudit" },
      { property: "og:description", content: "Every invoice and bill imported from your connected accounting system." },
    ],
  }),
  component: InvoicesPage,
});

function InvoicesPage() {
  const { data, isLoading } = useErpFinancials();
  const rows: Row[] = (data?.invoices ?? []) as Row[];

  const columns: Column<Row>[] = [
    {
      key: "invoice_number",
      header: "Document",
      render: (r) => (
        <div className="min-w-0">
          <p className="text-sm font-medium">{r["invoice_number"] ?? r["external_id"]}</p>
          <p className="text-xs text-muted-foreground">{r["type"] === "bill" ? "Vendor bill" : "Customer invoice"}</p>
        </div>
      ),
    },
    { key: "vendor_name", header: "Party", render: (r) => <span className="text-sm">{r["vendor_name"] ?? "—"}</span> },
    { key: "issue_date", header: "Issued", render: (r) => <span className="text-sm">{dateShort(r["issue_date"])}</span> },
    { key: "due_date", header: "Due", render: (r) => <span className="text-sm">{dateShort(r["due_date"])}</span> },
    {
      key: "balance",
      header: "Outstanding",
      align: "right",
      render: (r) => {
        const bal = Math.max(Number(r["amount"] ?? 0) - Number(r["amount_paid"] ?? 0), 0);
        return (
          <span className="text-sm tabular-nums">
            {bal > 0 ? currencyIn(bal, r["currency"]) : <ToneBadge tone="success" size="sm">Settled</ToneBadge>}
          </span>
        );
      },
    },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={String(r["status"] ?? "unknown").toLowerCase()} /> },
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
        title="Invoices"
        description={`${rows.length.toLocaleString()} invoices and bills imported from your connected systems.`}
        crumbs={[{ label: "Invoices" }]}
        actions={
          <Button variant="outline" className="gap-2" disabled={rows.length === 0} onClick={() => downloadCsv("invoices.csv", rows)}>
            <Download className="size-4" /> Export
          </Button>
        }
      />
      {!isLoading && rows.length === 0 ? (
        <NoImportedData title="No invoices imported yet" />
      ) : (
        <DataTable
          data={rows}
          columns={columns}
          loading={isLoading}
          rowKey={(r) => String(r["id"])}
          searchKeys={["invoice_number", "vendor_name", "status", "external_id"]}
          searchPlaceholder="Search invoices…"
        />
      )}
    </>
  );
}
