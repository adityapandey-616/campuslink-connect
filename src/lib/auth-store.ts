export type { Role } from "./campus";
import type { Role } from "./campus";

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

export interface DemoAccount {
  role: Role;
  label: string;
  email: string;
  name: string;
  passwordHint: string;
  passwordHash: string; // Plain mock password kept only in the frontend demo store
  roll_no?: string;
  company_name?: string;
  description: string;
}

export const DEMO_ACCOUNTS: Record<Role, DemoAccount> = {
  student: {
    role: "student",
    label: "Undergraduate Student",
    email: "student@campuslink.edu",
    name: "Aarav Mehta",
    passwordHint: "student123",
    passwordHash: "student123",
    roll_no: "21CS001",
    description: "4th Year B.Tech CSE · Placement Candidate",
  },
  recruiter: {
    role: "recruiter",
    label: "Corporate Recruiter",
    email: "recruiter@novatek.com",
    name: "Priya Sundaram",
    passwordHint: "recruiter123",
    passwordHash: "recruiter123",
    company_name: "Novatek Systems",
    description: "Lead Technical Recruiter · Novatek Systems",
  },
  admin: {
    role: "admin",
    label: "Placement Cell Admin",
    email: "admin@campuslink.edu",
    name: "Dr. Arvind Chawla",
    passwordHint: "admin123",
    passwordHash: "admin123",
    description: "Head, Training & Placement Cell · TPO Officer",
  },
};

const SESSION_KEY = "campuslink_user_session";
const ACTIVE_ROLE_KEY = "campuslink_active_role";
let inMemorySession: UserSession | null | undefined = undefined;

function isValidRole(role: unknown): role is Role {
  return role === "student" || role === "recruiter" || role === "admin";
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
    typeof candidate.loggedInAt === "string" &&
    Object.prototype.hasOwnProperty.call(DEMO_ACCOUNTS, candidate.role)
  );
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
      window.localStorage.removeItem(SESSION_KEY);
      window.localStorage.removeItem(ACTIVE_ROLE_KEY);
      inMemorySession = null;
      return null;
    }
    const account = DEMO_ACCOUNTS[parsed.role];
    if (account.email.toLowerCase() !== parsed.email.toLowerCase()) {
      window.localStorage.removeItem(SESSION_KEY);
      window.localStorage.removeItem(ACTIVE_ROLE_KEY);
      inMemorySession = null;
      return null;
    }
    inMemorySession = parsed;
    return parsed;
  } catch {
    window.localStorage.removeItem(SESSION_KEY);
    window.localStorage.removeItem(ACTIVE_ROLE_KEY);
    inMemorySession = null;
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

export interface LoginResult {
  success: boolean;
  session?: UserSession | undefined;
  error?: string | undefined;
}

export function loginWithCredentials(
  emailInput: string,
  passwordInput: string,
  preferredRole?: Role
): LoginResult {
  const email = emailInput.trim().toLowerCase();
  const password = passwordInput.trim();

  if (!email) {
    return { success: false, error: "Please enter your email address." };
  }
  if (!password) {
    return { success: false, error: "Please enter your account password." };
  }

  // Find the account for the requested role first. A different role cannot be
  // silently selected by entering another account's email or shorthand.
  let matchedAccount: DemoAccount | undefined;

  if (preferredRole && DEMO_ACCOUNTS[preferredRole]) {
    const acc = DEMO_ACCOUNTS[preferredRole];
    const emailMatchesRole =
      email === acc.email.toLowerCase() ||
      email === acc.role ||
      email === acc.name.toLowerCase().replace(/\s+/g, ".") ||
      email.startsWith(`${acc.role}@`);

    if (emailMatchesRole) {
      matchedAccount = acc;
    }
  }

  if (!matchedAccount) {
    const exactMatch = Object.values(DEMO_ACCOUNTS).find(
      (acc) =>
        acc.email.toLowerCase() === email ||
        email === acc.role ||
        email.startsWith(`${acc.role}@`)
    );

    if (exactMatch) {
      return {
        success: false,
        error: `This account belongs to ${exactMatch.label}. Select ${exactMatch.role} and retry.`,
      };
    }

    return {
      success: false,
      error: "No account found matching this email. Use one of the demo credentials.",
    };
  }

  // Validate password only against the matching account.
  if (password !== matchedAccount.passwordHash) {
    return {
      success: false,
      error: `Incorrect password. Hint for ${matchedAccount.label}: "${matchedAccount.passwordHint}"`,
    };
  }

  // Create valid session
  const session: UserSession = {
    id: `usr-${matchedAccount.role}-${Date.now()}`,
    email: matchedAccount.email,
    name: matchedAccount.name,
    role: matchedAccount.role,
    roll_no: matchedAccount.roll_no,
    company_name: matchedAccount.company_name,
    token: `demo-token-${matchedAccount.role}-${Math.random().toString(36).substring(2)}`,
    loggedInAt: new Date().toISOString(),
  };

  inMemorySession = session;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      window.localStorage.setItem(ACTIVE_ROLE_KEY, session.role);
    } catch {}
  }

  return { success: true, session };
}

export function logout(): void {
  inMemorySession = null;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(SESSION_KEY);
      window.localStorage.removeItem(ACTIVE_ROLE_KEY);
    } catch {}
  }
}

/**
 * Access control checks for route authorization.
 */
export function isAuthorizedForPath(session: UserSession | null, pathname: string): {
  authorized: boolean;
  redirectTo?: string | undefined;
  reason?: string | undefined;
} {
  if (!session) {
    return {
      authorized: false,
      redirectTo: "/auth",
      reason: "Please log in to access this portal.",
    };
  }

  // Clean pathname
  const path = pathname.toLowerCase();

  // Admin routes: ONLY accessible by "admin" role
  if (path.startsWith("/admin")) {
    if (session.role !== "admin") {
      return {
        authorized: false,
        redirectTo: session.role === "recruiter" ? "/recruiter" : "/student",
        reason: "Access denied. Placement Admin privileges required.",
      };
    }
  }

  // Recruiter routes: accessible by "recruiter" (or admin inspecting)
  if (path.startsWith("/recruiter")) {
    if (session.role === "student") {
      return {
        authorized: false,
        redirectTo: "/student",
        reason: "Access denied. Recruiter credentials required.",
      };
    }
  }

  // Student routes: accessible by "student" (or admin inspecting)
  if (path.startsWith("/student")) {
    if (session.role === "recruiter") {
      return {
        authorized: false,
        redirectTo: "/recruiter",
        reason: "Access denied. Student portal is restricted to enrolled candidates.",
      };
    }
  }

  return { authorized: true };
}
