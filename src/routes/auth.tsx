import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  GraduationCap,
  Building2,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/Logo";
import {
  DEMO_ACCOUNTS,
  loginWithCredentials,
  type Role,
} from "@/lib/auth-store";

const authSearchSchema = z.object({
  redirect: z.string().optional(),
  role: z.enum(["student", "recruiter", "admin"]).optional(),
  error: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [{ title: "Sign In â€” Skill to Hire Portal Access" }],
  }),
  validateSearch: authSearchSchema,
  component: AuthPage,
});

function AuthPage() {
  const search = useSearch({ from: "/auth" });
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState<Role>(search.role ?? "student");
  const [email, setEmail] = useState(() => DEMO_ACCOUNTS[search.role ?? "student"].email);
  const [password, setPassword] = useState(() => DEMO_ACCOUNTS[search.role ?? "student"].passwordHint);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(search.error ?? null);
  const [isLoading, setIsLoading] = useState(false);

  const activeDemo = DEMO_ACCOUNTS[selectedRole];

  const handleRoleTabChange = (role: Role) => {
    setSelectedRole(role);
    setEmail(DEMO_ACCOUNTS[role].email);
    setPassword(DEMO_ACCOUNTS[role].passwordHint);
    setErrorMsg(null);
  };

  const handleQuickFill = (role: Role) => {
    setSelectedRole(role);
    setEmail(DEMO_ACCOUNTS[role].email);
    setPassword(DEMO_ACCOUNTS[role].passwordHint);
    setErrorMsg(null);
    toast.info(`Filled credentials for ${DEMO_ACCOUNTS[role].label}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    setTimeout(() => {
      const res = loginWithCredentials(email, password, selectedRole);

      if (!res.success) {
        setIsLoading(false);
        setErrorMsg(res.error ?? "Invalid email or password.");
        toast.error("Authentication failed. Please verify credentials.");
        return;
      }

      setIsLoading(false);
      toast.success(`Welcome back, ${res.session!.name}!`);

      // Determine redirect path
      let targetPath = search.redirect;
      if (!targetPath || targetPath === "/" || targetPath === "/auth") {
        targetPath = res.session!.role === "admin"
          ? "/admin"
          : res.session!.role === "recruiter"
          ? "/recruiter"
          : "/student";
      }

      navigate({ to: targetPath });
    }, 250);
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Logo />
        </div>
        <h2 className="mt-4 text-center font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Role-Protected Portal Access
        </h2>
        <p className="mt-1 text-center text-xs text-muted-foreground">
          Enter credentials or click any demo role below for 1-click authenticated access.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
          {/* Role Selector Tabs */}
          <div className="mb-6 grid grid-cols-3 gap-1 rounded-lg border bg-muted/60 p-1 text-xs">
            <button
              type="button"
              onClick={() => handleRoleTabChange("student")}
              className={`flex items-center justify-center gap-1.5 rounded-md py-2 font-medium transition-all ${
                selectedRole === "student"
                  ? "bg-card text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <GraduationCap className="h-3.5 w-3.5" />
              <span>Student</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleTabChange("recruiter")}
              className={`flex items-center justify-center gap-1.5 rounded-md py-2 font-medium transition-all ${
                selectedRole === "recruiter"
                  ? "bg-card text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>Recruiter</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleTabChange("admin")}
              className={`flex items-center justify-center gap-1.5 rounded-md py-2 font-medium transition-all ${
                selectedRole === "admin"
                  ? "bg-card text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Admin</span>
            </button>
          </div>

          {/* Active Role Badge Header */}
          <div className="mb-4 rounded-lg border bg-secondary/30 p-3 text-xs flex items-center justify-between">
            <div>
              <span className="font-semibold text-foreground">{activeDemo.label}</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">{activeDemo.description}</p>
            </div>
            <Badge variant="outline" className="text-[10px] capitalize">
              {activeDemo.role}
            </Badge>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Access Error</span>
                <p className="mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-foreground">Email Address</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.edu"
                  required
                  className="pl-9 text-xs h-9"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-foreground">Password</label>
                <span className="text-[10px] text-muted-foreground font-mono">
                  Demo: {activeDemo.passwordHint}
                </span>
              </div>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  className="pl-9 pr-9 text-xs h-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full gap-2 shadow-xs text-xs font-semibold"
            >
              {isLoading ? (
                "Authenticating..."
              ) : (
                <>
                  Sign in as {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </form>

          {/* One-click Demo Credentials Picker */}
          <div className="mt-6 pt-5 border-t">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-accent" /> One-Click Demo Access
            </div>
            <div className="space-y-1.5">
              {(Object.keys(DEMO_ACCOUNTS) as Role[]).map((r) => {
                const acc = DEMO_ACCOUNTS[r];
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleQuickFill(r)}
                    className="flex w-full items-center justify-between rounded-lg border bg-background/50 p-2 text-left text-xs hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-foreground">{acc.name}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        {acc.email} Â· pwd: {acc.passwordHint}
                      </div>
                    </div>
                    <Badge variant="secondary" className="capitalize text-[10px]">
                      {r}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          <KeyRound className="inline h-3.5 w-3.5 mr-1 text-accent" />
          Protected by Skill to Hire Role Guard with session persistence and client-side isolation.
        </div>
      </div>
    </div>
  );
}