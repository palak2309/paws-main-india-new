import { motion } from "motion/react";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export interface StatCardProps {
  label: string;
  value: string;
  delta?: number;
  deltaLabel?: string;
  icon: LucideIcon;
  tone?: "brand" | "violet" | "accent" | "success" | "warning" | "danger";
  hint?: string;
  loading?: boolean;
  index?: number;
}

const toneRing: Record<string, string> = {
  brand: "bg-primary/10 text-primary",
  violet: "bg-violet/10 text-violet",
  accent: "bg-accent/15 text-accent-foreground",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-destructive/12 text-destructive",
};

export function StatCard({
  label,
  value,
  delta,
  deltaLabel,
  icon: Icon,
  tone = "brand",
  hint,
  loading,
  index = 0,
}: StatCardProps) {
  if (loading) {
    return (
      <div className="surface-card p-5">
        <Skeleton className="h-9 w-9 rounded-xl" />
        <Skeleton className="mt-4 h-3 w-24" />
        <Skeleton className="mt-3 h-7 w-32" />
        <Skeleton className="mt-3 h-3 w-20" />
      </div>
    );
  }

  const positive = (delta ?? 0) >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      className="surface-card group relative overflow-hidden p-5 transition-shadow hover:shadow-lifted"
    >
      <div className="pointer-events-none absolute -top-16 -right-16 size-40 rounded-full bg-primary/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="flex items-start justify-between gap-3">
        <div className={cn("grid size-9 shrink-0 place-items-center rounded-xl", toneRing[tone])}>
          <Icon className="size-4.5" />
        </div>
        {delta !== undefined && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
              positive ? "bg-success/15 text-success" : "bg-destructive/12 text-destructive",
            )}
          >
            {positive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {Math.abs(delta)}%
          </span>
        )}
      </div>
      <p className="mt-4 text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      {(hint || deltaLabel) && (
        <p className="mt-2 text-xs text-muted-foreground">{hint ?? deltaLabel}</p>
      )}
    </motion.div>
  );
}
