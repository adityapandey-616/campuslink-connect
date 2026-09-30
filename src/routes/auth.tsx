import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { BRANCHES, getMyRoles, homeFor } from "@/lib/campus";

const search = z.object({
  mode: z.enum(["signin", "signup", "forgot"]).optional(),
  role: z.enum(["student", "recruiter"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "Sign in — CAMPUSLINK" },
      { name: "description", content: "Sign in or create your CAMPUSLINK student or recruiter account." },
      { property: "og:title", content: "Sign in — CAMPUSLINK" },
      { property: "og:description", content: "Access your CAMPUSLINK placement workspace." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode = "signin", role: initialRole = "student" } = Route.useSearch();
  const navigate = useNavigate();
  const [role, setRole] = useState<"student" | "recruiter">(initialRole);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [companies, setCompanies] = useState<string[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) navigate({ to: homeFor(await getMyRoles()) });
    });
  }, [navigate]);

  useEffect(() => {
    if (mode === "signup" && role === "recruiter") {
      // companies are readable only when signed in; offer a fixed list otherwise
      setCompanies(["Novatek Systems", "Quantiva Analytics", "Orbitrail Mobility", "Finloop Payments", "Cloudnest Labs", "Medisphere Health"]);
    }
  }, [mode, role]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email") ?? "").trim();
    const password = String(f.get("password") ?? "");
    setBusy(true);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        setSent("If an account exists for that email, a reset link is on its way.");
      } else if (mode === "signup") {
        if (password.length < 8) throw new Error("Password must be at least 8 characters.");
        if (password !== f.get("confirm")) throw new Error("Passwords do not match.");
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + "/auth",
            data: { full_name: f.get("name"), role, branch: f.get("branch"), company: f.get("company") },
          },
        });
        if (error) throw error;
        setSent("Check your inbox to verify your email, then sign in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: homeFor(await getMyRoles()) });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const title = mode === "signup" ? "Create your account" : mode === "forgot" ? "Reset your password" : "Welcome back";

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <Logo inverted />
        <div>
          <p className="font-display text-3xl font-semibold leading-tight">"We cut shortlisting time in half and every student knew where they stood."</p>
          <p className="mt-4 text-sm text-sidebar-foreground/60">Placement Cell, demo institute</p>
        </div>
        <p className="text-xs text-sidebar-foreground/50">Students · Recruiters · Placement Admins</p>
      </div>
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden"><Logo /></div>
          <h1 className="mt-6 text-2xl font-semibold">{title}</h1>
          {sent ? (
            <div className="mt-6 rounded-lg border bg-card p-4 text-sm">{sent}
              <div className="mt-3"><Link to="/auth" search={{}} className="font-medium text-accent" onClick={() => setSent(null)}>Back to sign in</Link></div>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              {mode === "signup" && (
                <>
                  <div className="grid grid-cols-2 gap-1 rounded-md bg-secondary p-1">
                    {(["student", "recruiter"] as const).map((r) => (
                      <button type="button" key={r} onClick={() => setRole(r)} className={`rounded px-3 py-1.5 text-sm capitalize ${role === r ? "bg-card font-medium shadow-sm" : "text-muted-foreground"}`}>{r}</button>
                    ))}
                  </div>
                  <Field label="Full name"><Input name="name" required maxLength={100} /></Field>
                  {role === "student" ? (
                    <Field label="Branch">
                      <select name="branch" className="h-9 w-full rounded-md border bg-card px-3 text-sm">{BRANCHES.map((b) => <option key={b}>{b}</option>)}</select>
                    </Field>
                  ) : (
                    <Field label="Company">
                      <select name="company" className="h-9 w-full rounded-md border bg-card px-3 text-sm">{companies.map((c) => <option key={c}>{c}</option>)}</select>
                    </Field>
                  )}
                </>
              )}
              <Field label="Email"><Input name="email" type="email" required autoComplete="email" /></Field>
              {mode !== "forgot" && <Field label="Password"><Input name="password" type="password" required autoComplete={mode === "signup" ? "new-password" : "current-password"} /></Field>}
              {mode === "signup" && <Field label="Confirm password"><Input name="confirm" type="password" required /></Field>}
              <Button className="w-full" disabled={busy}>{busy ? "Please wait…" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}</Button>
            </form>
          )}
          <div className="mt-6 space-y-2 text-sm text-muted-foreground">
            {mode === "signin" && (
              <>
                <div><Link to="/auth" search={{ mode: "forgot" }} className="text-accent">Forgot password?</Link></div>
                <div>New here? <Link to="/auth" search={{ mode: "signup" }} className="font-medium text-foreground">Create an account</Link></div>
              </>
            )}
            {mode !== "signin" && <div>Already have an account? <Link to="/auth" search={{}} className="font-medium text-foreground">Sign in</Link></div>}
            {mode === "signup" && <p className="text-xs">Placement Admin access is granted by your institute's existing admin.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}
