import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "motion/react";
import {
  ArrowRight,
  BadgeDollarSign,
  Brain,
  Download,
  Gauge,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { SeverityBadge, ToneBadge } from "@/components/common/tone-badge";
import { NoImportedData } from "@/components/common/no-data";
import {
  AnomalyBarChart,
  ChartCard,
  LeakBreakdownChart,
  RiskRadarChart,
  SavingsTrendChart,
} from "@/components/dashboard/charts";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useErpOverview } from "@/hooks/use-erp";
import { getDurableMetrics } from "@/lib/leak.functions";
import { downloadCsv } from "@/lib/csv";
import { compactCurrencyIn, currencyIn, dateShort, number, percent } from "@/lib/format";

export const Route = createFileRoute("/_shell/")({
  head: () => ({
    meta: [
      { title: "Dashboard — AutoAudit Financial Leakage Detection" },
      {
        name: "description",
        content:
          "Monitor billed value, outstanding balance, money at risk and detected leakage across the records imported from your accounting systems.",
      },
      { property: "og:title", content: "AutoAudit Dashboard" },
      {
        property: "og:description",
        content: "AI-powered financial leakage detection built on your own imported financial records.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { data, isLoading, isFetching, refetch } = useErpOverview();
  const fetchMetrics = useServerFn(getDurableMetrics);
  const { data: durableMetrics, isLoading: isMetricsLoading, refetch: refetchMetrics } = useQuery({
    queryKey: ["durable-metrics"],
    queryFn: () => fetchMetrics(),
    staleTime: 30_000,
  });

  const code = durableMetrics?.currency || data?.currencyCode;
  const totals = data?.totals;
  const leaks = data?.leaks ?? [];
  const insights = data?.insights ?? [];
  const severity = (data?.severityMix ?? []).map((s) => ({ label: s.severity, count: s.count }));
  const topSpend = (data?.topVendors ?? []).reduce((s, v) => s + v.spend, 0) || 1;
  const radar = (data?.topVendors ?? []).slice(0, 6).map((v) => ({
    area: v.vendor.length > 14 ? `${v.vendor.slice(0, 13)}…` : v.vendor,
    score: Math.round((v.spend / topSpend) * 100),
  }));
  const riskShare = totals && totals.spend > 0 ? totals.atRisk / totals.spend : 0;
  const healthScore = Math.max(0, Math.min(100, Math.round(100 - riskShare * 100)));
  const runs = data?.syncRuns ?? [];

  const handleRefresh = async () => {
    await Promise.all([refetch(), refetchMetrics()]);
  };

  if (!isLoading && !data?.connected) {
    return (
      <>
        <PageHeader
          title="Financial control center"
          description="Connect your accounting system to see your own numbers here."
          crumbs={[{ label: "Dashboard" }]}
        />
        <NoImportedData />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Financial control center"
        description="Live view of active durable leak cases, recovery claims and invoices imported from your connected systems."
        crumbs={[{ label: "Dashboard" }]}
        actions={
          <>
            <Button
              variant="outline"
              className="gap-2"
              disabled={leaks.length === 0}
              onClick={() => downloadCsv("findings.csv", leaks.map((l) => ({
                type: l.type,
                title: l.title,
                vendor: l.vendor,
                amount: l.amount,
                currency: l.currency,
                severity: l.severity,
                date: l.date,
              })))}
            >
              <Download className="size-4" /> Export
            </Button>
            <Button className="gap-2" disabled={isFetching} onClick={() => void handleRefresh()}>
              <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} /> Re-run analysis
            </Button>
          </>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          index={0}
          loading={isLoading || isMetricsLoading}
          label="Total Identified Exposure"
          value={compactCurrencyIn(durableMetrics?.totalExposure ?? totals?.atRisk ?? 0, code)}
          icon={BadgeDollarSign}
          tone="violet"
          hint={`${number(durableMetrics?.activeLeaksCount ?? leaks.length)} active leak cases in register`}
        />
        <StatCard
          index={1}
          loading={isLoading || isMetricsLoading}
          label="Active Recoveries"
          value={number(durableMetrics?.activeRecoveriesCount ?? 0)}
          icon={ShieldAlert}
          tone="warning"
          hint={`${compactCurrencyIn(durableMetrics?.activeRecoveriesTarget ?? 0, code)} in active claims`}
        />
        <StatCard
          index={2}
          loading={isLoading || isMetricsLoading}
          label="Recovered Cash"
          value={compactCurrencyIn(durableMetrics?.recoveredCash ?? 0, code)}
          icon={Wallet}
          tone="success"
          hint="Actual cash recaptured from claims"
        />
        <StatCard
          index={3}
          loading={isLoading}
          label="Financial health score"
          value={`${healthScore}/100`}
          icon={Gauge}
          tone="brand"
          hint={`${percent(riskShare)} of billed value is flagged`}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <ChartCard
          className="lg:col-span-2"
          title="Invoiced vs. detected exposure"
          description="Last 12 months of imported activity"
          action={<ToneBadge tone="brand">{compactCurrencyIn(totals?.spend ?? 0, code)} invoiced</ToneBadge>}
        >
          <SavingsTrendChart data={data?.detectedByMonth ?? []} />
        </ChartCard>
        <ChartCard title="Leakage by category" description="Share of total exposure">
          <LeakBreakdownChart data={data?.leakMix ?? []} />
        </ChartCard>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="surface-card p-5 lg:col-span-2"
        >
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <div className="min-w-0">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="size-4 text-violet" /> AI recommendations
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">Ranked by recoverable impact</p>
            </div>
            <Button asChild variant="ghost" size="sm" className="gap-1">
              <Link to="/ai-insights">
                All insights <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
          <ul className="mt-4 space-y-3">
            {insights.slice(0, 3).map((insight, i) => (
              <motion.li
                key={insight.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i }}
                className="rounded-xl border border-border bg-muted/30 p-4 transition-colors hover:bg-muted/60"
              >
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                  <p className="text-sm font-medium">{insight.title}</p>
                  <ToneBadge tone="violet">{percent(insight.confidence)} confidence</ToneBadge>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{insight.summary}</p>
                <div className="mt-3">
                  <ToneBadge tone="success">{currencyIn(insight.impact, code)} impact</ToneBadge>
                </div>
              </motion.li>
            ))}
            {!isLoading && insights.length === 0 && (
              <li className="rounded-xl border border-border p-4 text-sm text-muted-foreground">
                No issues found in the imported records.
              </li>
            )}
          </ul>
        </motion.div>

        <ChartCard title="Findings by severity" description="Open findings from the latest analysis">
          <AnomalyBarChart data={severity} />
        </ChartCard>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Spend concentration" description="Share of billed value by top party">
          <RiskRadarChart data={radar} />
        </ChartCard>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="surface-card p-5 lg:col-span-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Brain className="size-4 text-primary" /> Recent imports
          </h3>
          <ol className="mt-4 space-y-4">
            {runs.slice(0, 6).map((run) => (
              <li key={run.id} className="relative pl-5 text-sm">
                <span className="absolute top-1.5 left-0 size-2 rounded-full bg-primary/60" />
                <p>
                  <span className="font-medium capitalize">{run.provider.replace(/_/g, " ")}</span>{" "}
                  <span className="text-muted-foreground">import</span>{" "}
                  <span className="font-medium">{run.status}</span>
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{dateShort(run.startedAt)}</p>
              </li>
            ))}
            {runs.length === 0 && <li className="text-sm text-muted-foreground">No imports have run yet.</li>}
          </ol>
        </motion.div>
      </section>

      <section className="surface-card p-5">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <TrendingDown className="size-4 text-destructive" /> Leak detection summary
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Largest exposures awaiting review</p>
          </div>
          <Button asChild variant="ghost" size="sm" className="gap-1">
            <Link to="/leaks">
              Open register <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {leaks.slice(0, 6).map((leak) => (
            <motion.article
              key={leak.id}
              whileHover={{ y: -3 }}
              className="rounded-xl border border-border p-4 transition-shadow hover:shadow-lifted"
            >
              <div className="flex items-center justify-between gap-2">
                <ToneBadge tone="brand" size="sm">
                  {leak.type}
                </ToneBadge>
                <SeverityBadge severity={leak.severity} />
              </div>
              <p className="mt-2.5 line-clamp-2 text-sm font-medium">{leak.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{leak.vendor}</p>
              <p className="mt-3 text-lg font-semibold tabular-nums">{currencyIn(leak.amount, leak.currency || code)}</p>
              <Progress value={Math.min(100, (leak.amount / (leaks[0]?.amount || 1)) * 100)} className="mt-3 h-1.5" />
            </motion.article>
          ))}
          {!isLoading && leaks.length === 0 && (
            <p className="text-sm text-muted-foreground">Nothing flagged in the imported records.</p>
          )}
        </div>
      </section>
    </>
  );
}
