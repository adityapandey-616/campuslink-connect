import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  Building2,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  User,
  UserPlus,
  LogIn,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import {
  formatAuthErrorMessage,
  loginWithSupabase,
  restoreSession,
  signupWithSupabase,
  type Role,
} from "@/lib/auth-store";
import { portalPathForRole } from "@/lib/campus";

const authSearchSchema = z.object({
  redirect: z.string().optional(),
  role: z.enum(["student", "recruiter", "admin"]).optional(),
  error: z.string().optional(),
  mode: z.enum(["signin", "signup"]).optional(),
});

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [{ title: "Sign In — Skill to Hire Portal Access" }],
  }),
  validateSearch: authSearchSchema,
  component: AuthPage,
});

function AuthPage() {
  const search = useSearch({ from: "/auth" });
  const navigate = useNavigate();

  const [mode, setMode] = useState<"signin" | "signup">(search.mode ?? "signin");
  const [selectedRole, setSelectedRole] = useState<Role>(
    search.mode === "signup" && search.role !== "student" ? "student" : (search.role ?? "student"),
  );
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(search.error ?? null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Auto-redirect if an active session is detected (e.g. after Google OAuth callback)
  useEffect(() => {
    let active = true;

    // Check URL hash for OAuth error redirects (e.g. #error=access_denied&error_description=...)
    if (typeof window !== "undefined" && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const desc = hashParams.get("error_description");
      const err = hashParams.get("error");
      if (desc || err) {
        const errorText = desc ? desc.replace(/\+/g, " ") : err || "OAuth sign-in failed.";
        setErrorMsg(errorText);
        toast.error(errorText);
      }
    }

    void restoreSession().then((session) => {
      if (!active || !session) return;
      const targetPath =
        !search.redirect || search.redirect === "/" || search.redirect === "/auth"
          ? portalPathForRole(session.role)
          : search.redirect;
      navigate({ to: targetPath });
    });

    return () => {
      active = false;
    };
  }, [navigate, search.redirect]);

  const handleRoleTabChange = (role: Role) => {
    setSelectedRole(role);
    setErrorMsg(null);
    setInfoMsg(null);
  };

  const handleModeSwitch = (newMode: "signin" | "signup") => {
    setMode(newMode);
    setErrorMsg(null);
    setInfoMsg(null);

    // Staff roles are provisioned by an authorized administrator.
    if (newMode === "signup" && selectedRole !== "student") {
      setSelectedRole("student");
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setInfoMsg(null);
    setIsGoogleLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        const friendly = formatAuthErrorMessage(error);
        setErrorMsg(friendly);
        toast.error(friendly);
        setIsGoogleLoading(false);
      }
    } catch (err: unknown) {
      const friendly = formatAuthErrorMessage(err);
      setErrorMsg(friendly);
      toast.error(friendly);
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    setIsLoading(true);

    if (mode === "signin") {
      const res = await loginWithSupabase(email, password, selectedRole);

      if (!res.success) {
        setIsLoading(false);
        const err = res.error ?? "Invalid email or password.";
        setErrorMsg(err);
        toast.error(err);
        return;
      }

      if (!res.session) {
        setIsLoading(false);
        const err = "Authentication succeeded without an active application session.";
        setErrorMsg(err);
        toast.error(err);
        return;
      }

      setIsLoading(false);
      toast.success(`Welcome back, ${res.session?.name || "User"}!`);

      // Determine redirect path
      const targetPath =
        !search.redirect || search.redirect === "/" || search.redirect === "/auth"
          ? portalPathForRole(res.session.role)
          : search.redirect;

      navigate({ to: targetPath });
    } else {
      // Sign up flow
      const res = await signupWithSupabase(email, password, selectedRole, fullName);

      if (!res.success) {
        setIsLoading(false);
        const err = res.error ?? "Could not create account.";
        setErrorMsg(err);
        toast.error(err);
        return;
      }

      setIsLoading(false);

      if (res.confirmationRequired) {
        setInfoMsg(
          res.error ||
            "Account created successfully! Please check your email inbox to verify your address before signing in.",
        );
        toast.success("Account created! Check your email to confirm.");
        setMode("signin");
        return;
      }

      if (!res.session) {
        setIsLoading(false);
        const err = "Account creation succeeded without an active application session.";
        setErrorMsg(err);
        toast.error(err);
        return;
      }

      toast.success(`Account created! Welcome, ${res.session?.name || fullName}!`);

      const targetPath =
        !search.redirect || search.redirect === "/" || search.redirect === "/auth"
          ? portalPathForRole(res.session.role)
          : search.redirect;

      navigate({ to: targetPath });
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Logo />
        </div>
        <h2 className="mt-4 text-center font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {mode === "signin" ? "Role-Protected Portal Access" : "Create Skill to Hire Account"}
        </h2>
        <p className="mt-1 text-center text-xs text-muted-foreground">
          {mode === "signin"
            ? "Sign in with the account registered for your selected campus portal."
            : "Register your profile and choose your campus portal role."}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
          {/* Mode Switcher Tabs */}
          <div className="mb-4 grid grid-cols-2 gap-1 rounded-lg border bg-muted/40 p-1 text-xs">
            <button
              type="button"
              onClick={() => handleModeSwitch("signin")}
              className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 font-medium transition-all ${
                mode === "signin"
                  ? "bg-card text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => handleModeSwitch("signup")}
              className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 font-medium transition-all ${
                mode === "signup"
                  ? "bg-card text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Create Account</span>
            </button>
          </div>

          {/* Role Selector Tabs */}
          <div className="mb-4 grid grid-cols-3 gap-1 rounded-lg border bg-muted/60 p-1 text-xs">
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
              disabled={mode === "signup"}
              className={`flex items-center justify-center gap-1.5 rounded-md py-2 font-medium transition-all ${
                mode === "signup"
                  ? "opacity-40 cursor-not-allowed text-muted-foreground"
                  : selectedRole === "recruiter"
                    ? "bg-card text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
              }`}
              title={
                mode === "signup"
                  ? "Recruiter accounts are provisioned by an administrator"
                  : undefined
              }
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>Recruiter</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (mode === "signup") {
                  toast.info(
                    "Placement Admin accounts cannot be self-registered. Admin access is assigned by institutional officers.",
                  );
                  return;
                }
                handleRoleTabChange("admin");
              }}
              disabled={mode === "signup"}
              className={`flex items-center justify-center gap-1.5 rounded-md py-2 font-medium transition-all ${
                mode === "signup"
                  ? "opacity-40 cursor-not-allowed text-muted-foreground"
                  : selectedRole === "admin"
                    ? "bg-card text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
              }`}
              title={mode === "signup" ? "Admin registration is restricted" : undefined}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Admin</span>
            </button>
          </div>

          {mode === "signup" && (
            <p className="mb-4 text-[11px] text-muted-foreground italic">
              Student accounts can be self-registered. Recruiter and Admin accounts require
              authorization from campus management.
            </p>
          )}

          {/* Active Role Badge Header */}
          <div className="mb-4 rounded-lg border bg-secondary/30 p-3 text-xs flex items-center justify-between">
            <div>
              <span className="font-semibold text-foreground">
                {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} portal
              </span>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Access is verified against your assigned Supabase role.
              </p>
            </div>
            <Badge variant="outline" className="text-[10px] capitalize">
              {selectedRole}
            </Badge>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Authentication Notice</span>
                <p className="mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Info Message */}
          {infoMsg && (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <span className="font-semibold">Check Your Email</span>
                <p className="mt-0.5">{infoMsg}</p>
              </div>
            </div>
          )}

          {/* Google Sign-in Button */}
          <div className="mb-4">
            <Button
              type="button"
              variant="outline"
              disabled={isLoading || isGoogleLoading}
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-2.5 text-xs font-semibold h-10 border bg-background hover:bg-muted/60 transition-colors shadow-xs"
            >
              {isGoogleLoading ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </Button>
          </div>

          {/* Divider */}
          <div className="relative my-4 flex items-center justify-center text-xs">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-muted" />
            </div>
            <div className="relative bg-card px-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              Or with credentials
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="block text-xs font-medium text-foreground">Full Name</label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Aarav Mehta"
                    required
                    className="pl-9 text-xs h-9"
                  />
                </div>
              </div>
            )}

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
              </div>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    mode === "signup" ? "Create a secure password (min 6 chars)" : "Enter password"
                  }
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
              disabled={isLoading || isGoogleLoading}
              className="w-full gap-2 shadow-xs text-xs font-semibold"
            >
              {isLoading ? (
                "Connecting to Supabase..."
              ) : mode === "signin" ? (
                <>
                  Sign in as {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}{" "}
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              ) : (
                <>
                  Create {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Account{" "}
                  <UserPlus className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-5 border-t pt-4 text-center text-[11px] text-muted-foreground">
            Demo credentials are not enabled. Use a Supabase account provisioned for this portal.
          </p>
        </div>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          <KeyRound className="inline h-3.5 w-3.5 mr-1 text-accent" />
          Protected by Supabase Auth with Row Level Security and session persistence.
        </div>
      </div>
    </div>
  );
}
