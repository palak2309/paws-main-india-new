import {
  Activity,
  BarChart3,
  Bell,
  Brain,
  Building2,
  Calculator,
  ClipboardCheck,
  Eye,
  FileText,
  Gauge,
  LayoutDashboard,
  LifeBuoy,
  Plug,
  Receipt,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Users,
  Wallet,
  Crown,
  TrendingDown,
  type LucideIcon,
} from "lucide-react";
import type { RoleId } from "@/types";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  badge?: string;
  /** Permission required to see this entry. Undefined = any signed-in member. */
  permission?: "view" | "manage_users" | "manage_roles" | "configure" | "export" | "recover";
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", to: "/", icon: LayoutDashboard },
      { label: "AI Insights", to: "/ai-insights", icon: Brain, badge: "New" },
      { label: "Financial Leaks", to: "/leaks", icon: TrendingDown },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Transactions", to: "/transactions", icon: Activity },
      { label: "Invoices", to: "/invoices", icon: Receipt },
      { label: "Payments", to: "/payments", icon: Wallet },
      { label: "Contracts", to: "/contracts", icon: FileText },
      { label: "Vendors", to: "/vendors", icon: Building2 },
      { label: "Recovery Center", to: "/recovery", icon: LifeBuoy, permission: "recover" },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { label: "Reports", to: "/reports", icon: ClipboardCheck },
      { label: "Analytics", to: "/analytics", icon: BarChart3 },
      { label: "Notifications", to: "/notifications", icon: Bell },
    ],
  },
  {
    label: "Administration",
    items: [
      { label: "Users", to: "/users", icon: Users, permission: "manage_users" },
      { label: "Roles & Permissions", to: "/roles", icon: ShieldCheck, permission: "manage_roles" },
      { label: "Integrations", to: "/integrations", icon: Plug, permission: "configure" },
      { label: "Settings", to: "/settings", icon: Settings, permission: "configure" },
    ],
  },
];


export interface RoleDefinition {
  id: RoleId;
  label: string;
  description: string;
  icon: LucideIcon;
  tone: "brand" | "violet" | "accent" | "success" | "warning" | "muted";
  permissions: string[];
}

export const roles: RoleDefinition[] = [
  {
    id: "admin",
    label: "Admin",
    description: "Full platform control including users, roles, integrations and billing.",
    icon: ShieldCheck,
    tone: "brand",
    permissions: ["View", "Create", "Edit", "Delete", "Approve", "Recover", "Manage Users", "Manage Roles", "Export", "Configure"],
  },
  {
    id: "cfo",
    label: "CFO",
    description: "Executive oversight of savings, recovery performance and board reporting.",
    icon: Crown,
    tone: "violet",
    permissions: ["View", "Approve", "Recover", "Export"],
  },
  {
    id: "finance_manager",
    label: "Finance Manager",
    description: "Owns leak triage, recovery cases and finance team workflows.",
    icon: Gauge,
    tone: "accent",
    permissions: ["View", "Create", "Edit", "Approve", "Recover", "Export"],
  },
  {
    id: "accountant",
    label: "Accountant",
    description: "Reconciles transactions, invoices and payment exceptions day to day.",
    icon: Calculator,
    tone: "success",
    permissions: ["View", "Create", "Edit", "Export"],
  },
  {
    id: "procurement_manager",
    label: "Procurement Manager",
    description: "Manages vendors, contracts and rate-card compliance.",
    icon: ShoppingCart,
    tone: "warning",
    permissions: ["View", "Create", "Edit", "Approve", "Export"],
  },
  {
    id: "auditor",
    label: "Auditor",
    description: "Read-only forensic access with full evidence trail and export rights.",
    icon: ClipboardCheck,
    tone: "muted",
    permissions: ["View", "Export"],
  },
  {
    id: "viewer",
    label: "Viewer",
    description: "Dashboard-only visibility with no data modification rights.",
    icon: Eye,
    tone: "muted",
    permissions: ["View"],
  },
];

export const permissionColumns = [
  "View",
  "Create",
  "Edit",
  "Delete",
  "Approve",
  "Recover",
  "Manage Users",
  "Manage Roles",
  "Export",
  "Configure",
] as const;

export const roleMap = Object.fromEntries(roles.map((r) => [r.id, r])) as Record<RoleId, RoleDefinition>;
