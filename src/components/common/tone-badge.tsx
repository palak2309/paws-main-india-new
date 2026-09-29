import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const toneBadge = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
  {
    variants: {
      tone: {
        brand: "border-primary/25 bg-primary/10 text-primary",
        violet: "border-violet/25 bg-violet/10 text-violet",
        accent: "border-accent/30 bg-accent/15 text-accent-foreground",
        success: "border-success/30 bg-success/15 text-success",
        warning: "border-warning/35 bg-warning/15 text-warning",
        danger: "border-destructive/30 bg-destructive/12 text-destructive",
        muted: "border-border bg-muted text-muted-foreground",
      },
      size: {
        sm: "px-2 py-0.5 text-[11px]",
        md: "px-2.5 py-0.5 text-xs",
      },
    },
    defaultVariants: { tone: "muted", size: "md" },
  },
);

export type Tone = NonNullable<VariantProps<typeof toneBadge>["tone"]>;

export function ToneBadge({
  tone,
  size,
  className,
  children,
  dot,
}: VariantProps<typeof toneBadge> & { className?: string; children: ReactNode; dot?: boolean }) {
  return (
    <span className={cn(toneBadge({ tone, size }), className)}>
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

const severityTone: Record<string, Tone> = {
  critical: "danger",
  high: "warning",
  medium: "accent",
  low: "muted",
};

const statusTone: Record<string, Tone> = {
  new: "brand",
  detected: "brand",
  investigating: "warning",
  recovering: "accent",
  recovered: "success",
  dismissed: "muted",
  posted: "success",
  pending: "warning",
  flagged: "danger",
  reversed: "muted",
  paid: "success",
  approved: "brand",
  disputed: "danger",
  overdue: "danger",
  settled: "success",
  in_flight: "accent",
  failed: "danger",
  active: "success",
  expiring: "warning",
  expired: "muted",
  breached: "danger",
  connected: "success",
  syncing: "accent",
  disconnected: "muted",
  error: "danger",
  invited: "accent",
  suspended: "danger",
  identified: "muted",
  claim_filed: "brand",
  vendor_contacted: "accent",
  credit_issued: "warning",
};

const label = (v: string) => v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export function SeverityBadge({ severity }: { severity: string }) {
  return (
    <ToneBadge tone={severityTone[severity] ?? "muted"} dot>
      {label(severity)}
    </ToneBadge>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return <ToneBadge tone={statusTone[status] ?? "muted"}>{label(status)}</ToneBadge>;
}
