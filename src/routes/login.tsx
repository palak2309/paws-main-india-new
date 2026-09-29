import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { AlertCircle, CheckCircle2, MailWarning, ShieldAlert } from "lucide-react";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { getAccountStatus, type AccountState } from "@/lib/account.functions";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — AutoAudit" },
      { name: "description", content: "Sign in to AutoAudit to review detected financial leakage and recovery progress." },
      { property: "og:title", content: "Sign in — AutoAudit" },
      { property: "og:description", content: "Sign in to AutoAudit to review detected financial leakage and recovery progress." },
    ],
  }),
  component: LoginPage,
});

const BANNERS: Record<Exclude<AccountState, "unknown">, { tone: string; icon: typeof AlertCircle; title: string; next: string }> = {
  unconfirmed: {
    tone: "bg-warning/10 text-warning",
    icon: MailWarning,
    title: "Your email is not confirmed yet.",
    next: "Open the confirmation link we emailed you, or send a new one from the verification screen.",
  },
  confirmed: {
    tone: "bg-primary/10 text-primary",
    icon: CheckCircle2,
    title: "This account is confirmed and ready to sign in.",
    next: "Enter your password to continue. Use “Forgot?” if you no longer have it.",
  },
  blocked: {
    tone: "bg-destructive/10 text-destructive",
    icon: ShieldAlert,
    title: "This account is blocked.",
    next: "An administrator has suspended access. Ask them to restore your account.",
  },
};

function LoginPage() {
  const navigate = useNavigate();
  const checkStatus = useServerFn(getAccountStatus);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<AccountState>("unknown");
  const [error, setError] = useState<string | null>(null);

  const refreshStatus = async (value: string) => {
    if (!value.includes("@")) {
      setStatus("unknown");
      return "unknown" as AccountState;
    }
    try {
      const r = await checkStatus({ data: { email: value } });
      setStatus(r.state);
      return r.state;
    } catch {
      return "unknown" as AccountState;
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      const state = await refreshStatus(email);
      setLoading(false);
      const message =
        state === "unconfirmed"
          ? "Your email is not confirmed yet — confirm it before signing in."
          : state === "blocked"
            ? "This account is blocked. Ask an administrator to restore access."
            : signInError.message;
      setError(message);
      toast.error(message);
      return;
    }
    setLoading(false);
    void navigate({ to: "/" });
  };


  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) {
      toast.error("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/" });
  };

  return (
    <AuthLayout
      title="Sign in to AutoAudit"
      subtitle="Use your corporate credentials to access the audit workspace."
      footer={<>No account? <Link to="/register" className="font-medium text-primary hover:underline">Create one</Link></>}
    >
      <form onSubmit={submit} className="space-y-4">
        {status !== "unknown" ? (
          (() => {
            const b = BANNERS[status];
            const Icon = b.icon;
            return (
              <div role="status" className={`flex items-start gap-2 rounded-lg p-3 text-xs ${b.tone}`}>
                <Icon className="mt-0.5 size-4 shrink-0" />
                <div className="space-y-1">
                  <p className="font-medium">{b.title}</p>
                  <p className="opacity-90">{b.next}</p>
                  {status === "unconfirmed" ? (
                    <Link to="/verify-email" search={{ email }} className="font-medium underline">
                      Resend verification email
                    </Link>
                  ) : null}
                </div>
              </div>
            );
          })()
        ) : error ? (
          <div role="status" className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}
        <div className="space-y-1.5">
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setStatus("unknown");
              setError(null);
            }}
            onBlur={(e) => void refreshStatus(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" search={email ? { email } : {}} className="text-xs font-medium text-primary hover:underline">Forgot?</Link>
          </div>
          <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="remember" defaultChecked />
          <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground">Keep me signed in for 30 days</Label>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
        <Button type="button" variant="outline" className="w-full" onClick={google}>
          Continue with Google
        </Button>
      </form>
    </AuthLayout>
  );
}
