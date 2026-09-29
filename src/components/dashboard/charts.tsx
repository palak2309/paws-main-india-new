import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ReactNode } from "react";
import { motion } from "motion/react";

const chartColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--destructive)",
];

const axisProps = {
  stroke: "var(--muted-foreground)",
  fontSize: 12,
  tickLine: false,
  axisLine: false,
};

const tooltipStyle = {
  contentStyle: {
    background: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    color: "var(--popover-foreground)",
    fontSize: "12px",
    boxShadow: "var(--shadow-soft)",
  },
  labelStyle: { color: "var(--muted-foreground)", fontSize: "11px" },
};

const compact = (v: number) =>
  new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(v);

export function ChartCard({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`surface-card p-5 ${className ?? ""}`}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </motion.section>
  );
}

function EmptyChart({ height = 260 }: { height?: number }) {
  return (
    <div
      className="grid place-items-center rounded-xl border border-dashed border-border text-xs text-muted-foreground"
      style={{ height }}
    >
      Nothing to chart yet — run a sync to import records.
    </div>
  );
}

export interface SpendPoint {
  month: string;
  spend: number;
  detected: number;
}

export function SavingsTrendChart({ data }: { data: SpendPoint[] }) {
  if (data.length === 0) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ left: -18, right: 6, top: 4 }}>
        <defs>
          <linearGradient id="detectedFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-5)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="var(--chart-5)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="month" {...axisProps} />
        <YAxis {...axisProps} tickFormatter={compact} />
        <Tooltip {...tooltipStyle} formatter={(v: number) => [compact(v), ""]} />
        <Area
          type="monotone"
          dataKey="spend"
          stroke="var(--chart-5)"
          strokeWidth={2}
          fill="url(#spendFill)"
          name="Invoiced"
        />
        <Area
          type="monotone"
          dataKey="detected"
          stroke="var(--chart-1)"
          strokeWidth={2}
          fill="url(#detectedFill)"
          name="Detected exposure"
        />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function LeakBreakdownChart({ data }: { data: Array<{ name: string; value: number }> }) {
  if (data.length === 0) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={62}
          outerRadius={98}
          paddingAngle={3}
          stroke="var(--card)"
          strokeWidth={2}
        >
          {data.map((entry, i) => (
            <Cell key={entry.name} fill={chartColors[i % chartColors.length]} />
          ))}
        </Pie>
        <Tooltip {...tooltipStyle} formatter={(v: number, n) => [compact(v), n as string]} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function RiskRadarChart({ data }: { data: Array<{ area: string; score: number }> }) {
  if (data.length === 0) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart data={data} outerRadius={95}>
        <PolarGrid stroke="var(--border)" />
        <PolarAngleAxis dataKey="area" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
        <Radar
          dataKey="score"
          stroke="var(--chart-3)"
          fill="var(--chart-3)"
          fillOpacity={0.28}
          name="Exposure share"
        />
        <Tooltip {...tooltipStyle} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export function AnomalyBarChart({ data }: { data: Array<{ label: string; count: number }> }) {
  if (data.length === 0) return <EmptyChart height={240} />;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ left: -22, right: 6 }}>
        <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis {...axisProps} allowDecimals={false} />
        <Tooltip {...tooltipStyle} />
        <Bar dataKey="count" fill="var(--chart-1)" radius={[6, 6, 0, 0]} name="Findings" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function RecoveryLineChart({ data }: { data: SpendPoint[] }) {
  if (data.length === 0) return <EmptyChart height={240} />;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ left: -18, right: 6 }}>
        <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="month" {...axisProps} />
        <YAxis {...axisProps} tickFormatter={compact} />
        <Tooltip {...tooltipStyle} formatter={(v: number) => [compact(v), ""]} />
        <Line
          type="monotone"
          dataKey="spend"
          stroke="var(--chart-5)"
          strokeWidth={2.5}
          dot={false}
          name="Invoiced"
        />
        <Line
          type="monotone"
          dataKey="detected"
          stroke="var(--chart-3)"
          strokeWidth={2}
          strokeDasharray="5 4"
          dot={false}
          name="Detected exposure"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
