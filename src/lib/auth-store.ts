export type { Role } from "./campus";
import { portalPathForRole, type Role } from "./campus";
import { supabase } from "@/integrations/supabase/client";

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: Role;
  roll_no?: string | undefined;
  company_name?: string | undefined;
  token: string;
  loggedInAt: string;
}

const SESSION_KEY = "campuslink_user_session";
const ACTIVE_ROLE_KEY = "campuslink_active_role";
const DEMO_PREVIEW_ROLE_KEY = "campuslink_demo_preview_role";
let inMemorySession: UserSession | null | undefined = undefined;

export type DemoPreviewRole = "student" | "recruiter";

function isPlacementStaffRole(role: Role): boolean {
  return role === "admin" || role === "placement_admin";
}

export function getDemoPreviewRole(): DemoPreviewRole | null {
  const session = getSession();
  if (!session || !isPlacementStaffRole(session.role) || typeof window === "undefined") {
    return null;
  }

  try {
    const role = window.localStorage.getItem(DEMO_PREVIEW_ROLE_KEY);
    return role === "student" || role === "recruiter" ? role : null;
  } catch (error) {
    console.warn("[Auth] Could not read the demo preview mode:", error);
    return null;
  }
}

export function setDemoPreviewRole(role: DemoPreviewRole | null): boolean {
  const session = getSession();
  if (!session || !isPlacementStaffRole(session.role) || typeof window === "undefined") {
    return false;
  }

  try {
    if (role) {
      window.localStorage.setItem(DEMO_PREVIEW_ROLE_KEY, role);
    } else {
      window.localStorage.removeItem(DEMO_PREVIEW_ROLE_KEY);
    }
    return true;
  } catch (error) {
    console.warn("[Auth] Could not update the demo preview mode:", error);
    return false;
  }
}

export function isValidRole(role: unknown): role is Role {
  return (
    role === "student" || role === "recruiter" || role === "admin" || role === "placement_admin"
  );
}

function isWellFormedSession(value: unknown): value is UserSession {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<UserSession>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.email === "string" &&
    typeof candidate.name === "string" &&
    isValidRole(candidate.role) &&
    typeof candidate.token === "string" &&
    candidate.token.length > 0 &&
    !candidate.token.startsWith("demo-token-") &&
    typeof candidate.loggedInAt === "string"
  );
}

function setLocalSession(session: UserSession | null): void {
  inMemorySession = session;
  if (typeof window === "undefined") return;

  try {
    if (session) {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      window.localStorage.setItem(ACTIVE_ROLE_KEY, session.role);
    } else {
      window.localStorage.removeItem(SESSION_KEY);
      window.localStorage.removeItem(ACTIVE_ROLE_KEY);
    }
  } catch (error) {
    console.warn("[Auth] Could not update the local session cache:", error);
  }
}

export function clearSession(): void {
  setLocalSession(null);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(DEMO_PREVIEW_ROLE_KEY);
    } catch (error) {
      console.warn("[Auth] Could not clear the demo preview mode:", error);
    }
  }
}

async function clearSupabaseSession(): Promise<void> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) console.warn("[Auth] Could not clear the Supabase session:", error.message);
  } catch (error) {
    console.warn("[Auth] Could not clear the Supabase session:", error);
  } finally {
    clearSession();
  }
}

export function getSession(): UserSession | null {
  if (inMemorySession !== undefined) return inMemorySession;
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) {
      inMemorySession = null;
      return null;
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!isWellFormedSession(parsed)) {
      clearSession();
      return null;
    }
    inMemorySession = parsed;
    return parsed;
  } catch {
    clearSession();
    return null;
  }
}

export function isAuthenticated(): boolean {
  return getSession() !== null;
}

export function getCurrentRole(): Role | null {
  const session = getSession();
  return session ? session.role : null;
}

/**
 * Transforms technical or raw Supabase errors into clear diagnostic messages.
 */
export function formatAuthErrorMessage(err: unknown): string {
  if (!err) return "An unexpected authentication error occurred.";
  const msg = typeof err === "string" ? err : err instanceof Error ? err.message : String(err);

  if (
    msg.includes("Failed to fetch") ||
    msg.includes("NetworkError") ||
    msg.includes("Load failed") ||
    msg.includes("fetch failed")
  ) {
    return "Cannot reach the Supabase authentication server. Please check your network connection or verify that VITE_SUPABASE_URL is properly configured.";
  }
  if (msg.includes("Invalid login credentials")) {
    return "Invalid email or password. Please verify your Supabase account credentials.";
  }
  if (msg.includes("Email rate limit exceeded") || msg.includes("rate limit")) {
    return "Supabase email rate limit exceeded. Please wait a few minutes before trying again.";
  }
  if (msg.includes("Email address") && msg.includes("is invalid")) {
    return "Please enter a valid, deliverable email address (e.g. yourname@gmail.com).";
  }
  if (msg.includes("User already registered")) {
    return "An account with this email address already exists. Please sign in instead.";
  }
  if (msg.includes("Email not confirmed")) {
    return "Your email address has not been confirmed yet. Please check your inbox for the verification link.";
  }
  if (msg.includes("Password should be at least")) {
    return "Password must be at least 6 characters long.";
  }
  if (
    msg.includes("provider is not enabled") ||
    msg.includes("Unsupported provider") ||
    msg.includes("OAuth provider")
  ) {
    return "Google provider is not enabled in your Supabase project. Please enable Google under Authentication > Providers in the Supabase Dashboard.";
  }
  return msg;
}

/**
 * Resolves the assigned role and display name from the live profiles row.
 */
export async function fetchProfileRole(
  userId: string,
  preferredRole?: Role,
): Promise<{ role: Role; name: string } | null> {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", userId)
    .maybeSingle();
  if (profileError) {
    throw new Error(`Failed to load your profile: ${profileError.message}`);
  }

  const assignedRole = profile?.role;
  if (!isValidRole(assignedRole)) {
    return null;
  }

  const role = preferredRole === assignedRole ? preferredRole : assignedRole;
  return { role, name: profile?.full_name ?? "" };
}

/**
 * Restores session after page refresh or browser restart.
 * Syncs the local cache with the active Supabase token and loads the profile role.
 */
export async function restoreSession(): Promise<UserSession | null> {
  if (typeof window === "undefined") return null;

  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      throw new Error(`Failed to restore the Supabase session: ${error.message}`);
    }
    if (!data.session) {
      clearSession();
      return null;
    }

    const sbUser = data.session.user;
    const profile = await fetchProfileRole(sbUser.id);
    if (!profile) {
      console.warn("[Auth] Signed-in user has no assigned placement portal role.");
      await clearSupabaseSession();
      return null;
    }

    const name: string =
      profile?.name ||
      (sbUser.user_metadata?.["full_name"] as string | undefined) ||
      (sbUser.user_metadata?.["name"] as string | undefined) ||
      sbUser.email?.split("@")[0] ||
      "User";

    const session: UserSession = {
      id: sbUser.id,
      email: sbUser.email ?? "",
      name,
      role: profile.role,
      token: data.session.access_token,
      loggedInAt: new Date().toISOString(),
    };

    setLocalSession(session);
    return session;
  } catch (err) {
    console.error("[Auth] Session restoration error:", err);
    clearSession();
    return null;
  }
}

export interface LoginResult {
  success: boolean;
  session?: UserSession | undefined;
  error?: string | undefined;
}

/**
 * Authenticates against Supabase and requires a role assigned in profiles.
 */
export async function loginWithSupabase(
  emailInput: string,
  passwordInput: string,
  preferredRole?: Role,
): Promise<LoginResult> {
  const email = emailInput.trim();
  const password = passwordInput.trim();

  if (!email) {
    return { success: false, error: "Please enter your email address." };
  }
  if (!password) {
    return { success: false, error: "Please enter your account password." };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: formatAuthErrorMessage(error) };
    }

    if (!data.user || !data.session) {
      return { success: false, error: "Authentication did not produce an active session." };
    }

    const profile = await fetchProfileRole(data.user.id, preferredRole);
    if (!profile) {
      await clearSupabaseSession();
      return {
        success: false,
        error: "Your account has no assigned placement role. Contact the placement administrator.",
      };
    }

    const name: string =
      profile?.name ||
      (data.user.user_metadata?.["full_name"] as string | undefined) ||
      (data.user.user_metadata?.["name"] as string | undefined) ||
      data.user.email?.split("@")[0] ||
      "User";

    const session: UserSession = {
      id: data.user.id,
      email: data.user.email ?? email,
      name,
      role: profile.role,
      token: data.session.access_token,
      loggedInAt: new Date().toISOString(),
    };

    setLocalSession(session);
    return { success: true, session };
  } catch (err: unknown) {
    await clearSupabaseSession();
    return { success: false, error: formatAuthErrorMessage(err) };
  }
}

/**
 * Registers a new student account with Supabase email/password.
 */
export async function signupWithSupabase(
  emailInput: string,
  passwordInput: string,
  role: Role,
  fullNameInput: string,
): Promise<LoginResult & { confirmationRequired?: boolean }> {
  // Recruiter and Admin roles must be provisioned by an authorized administrator.
  if (role !== "student") {
    return {
      success: false,
      error:
        "Recruiter and Admin accounts cannot be self-registered. Contact the placement administrator.",
    };
  }

  const email = emailInput.trim();
  const password = passwordInput.trim();
  const fullName = fullNameInput.trim();

  if (!email) {
    return { success: false, error: "Please enter your email address." };
  }
  if (!password || password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters." };
  }
  if (!fullName) {
    return { success: false, error: "Please enter your full name." };
  }

  try {
    const signUpOptions: { data: { full_name: string; role: Role }; emailRedirectTo?: string } = {
      data: {
        full_name: fullName,
        role,
      },
    };
    if (typeof window !== "undefined" && window.location?.origin) {
      signUpOptions.emailRedirectTo = window.location.origin;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: signUpOptions,
    });

    if (error) {
      return { success: false, error: formatAuthErrorMessage(error) };
    }

    if (!data.user) {
      return { success: false, error: "Registration failed. No user was created." };
    }

    // If an active session was created immediately (e.g. email confirmation disabled)
    if (data.session) {
      const profile = await fetchProfileRole(data.user.id, role);
      if (!profile || profile.role !== role) {
        await clearSupabaseSession();
        return {
          success: false,
          error:
            "Your account was created, but no placement role was assigned. Contact the placement administrator.",
        };
      }

      const session: UserSession = {
        id: data.user.id,
        email,
        name: profile.name || fullName,
        role: profile.role,
        token: data.session.access_token,
        loggedInAt: new Date().toISOString(),
      };
      setLocalSession(session);
      return { success: true, session };
    } else {
      // Email confirmation is required by Supabase Auth settings
      return {
        success: true,
        confirmationRequired: true,
        error:
          "Account created successfully! A confirmation link has been sent to your email. Please verify your address to sign in.",
      };
    }
  } catch (err: unknown) {
    await clearSupabaseSession();
    return { success: false, error: formatAuthErrorMessage(err) };
  }
}

/**
 * Compatible bridge for legacy callers of loginWithCredentials.
 */
export async function loginWithCredentials(
  emailInput: string,
  passwordInput: string,
  preferredRole?: Role,
): Promise<LoginResult> {
  return loginWithSupabase(emailInput, passwordInput, preferredRole);
}

/**
 * Signs out from Supabase and clears local session cache.
 */
export async function logoutUser(): Promise<void> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.warn("[Auth] Sign out error:", error.message);
    }
  } catch (err) {
    console.warn("[Auth] Sign out error:", err);
  }
  clearSession();
}

export function logout(): void {
  clearSession();
  supabase.auth
    .signOut()
    .then(({ error }) => {
      if (error) console.warn("[Auth] Sign out error:", error.message);
    })
    .catch((error: unknown) => {
      console.warn("[Auth] Sign out error:", error);
    });
}

/**
 * Access control checks for route authorization.
 */
export function isAuthorizedForPath(
  session: UserSession | null,
  pathname: string,
): {
  authorized: boolean;
  redirectTo?: "/auth" | "/admin" | "/recruiter" | "/student" | undefined;
  reason?: string | undefined;
} {
  if (!session) {
    return {
      authorized: false,
      redirectTo: "/auth",
      reason: "Please log in to access this portal.",
    };
  }

  const path = pathname.toLowerCase().replace(/\/+$/, "") || "/";

  const isPlacementStaff = isPlacementStaffRole(session.role);

  // Both operational admin roles use the placement administration routes.
  if (path.startsWith("/admin")) {
    if (!isPlacementStaff) {
      return {
        authorized: false,
        redirectTo: portalPathForRole(session.role),
        reason: "Access denied. Placement Admin privileges required.",
      };
    }
  }

  // Recruiter routes are available to recruiters and placement staff.
  if (path.startsWith("/recruiter")) {
    const isRecruiterPreview =
      isPlacementStaff && getDemoPreviewRole() === "recruiter" && path === "/recruiter/dashboard";
    if (session.role !== "recruiter" && !isRecruiterPreview) {
      return {
        authorized: false,
        redirectTo: portalPathForRole(session.role),
        reason: "Access denied. Recruiter credentials required.",
      };
    }
  }

  // Student routes are available to students and placement staff.
  if (path.startsWith("/student")) {
    const isStudentPreview =
      isPlacementStaff && getDemoPreviewRole() === "student" && path === "/student";
    if (session.role !== "student" && !isStudentPreview) {
      return {
        authorized: false,
        redirectTo: portalPathForRole(session.role),
        reason: "Access denied. Student portal is restricted to enrolled candidates.",
      };
    }
  }

  return { authorized: true };
}
