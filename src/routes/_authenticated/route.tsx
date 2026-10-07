import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { getSession, isAuthorizedForPath } from "@/lib/auth-store";

const authRedirectSearchSchema = z.object({
  redirect: z.string().optional(),
  error: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  validateSearch: authRedirectSearchSchema,
  beforeLoad: ({ location }) => {
    const session = getSession();

    // Check general authentication
    if (!session) {
      throw redirect({
        to: "/auth",
        search: { redirect: location.pathname } as any,
      });
    }

    // Enforce role-based route protection
    const authCheck = isAuthorizedForPath(session, location.pathname);
    if (!authCheck.authorized) {
      throw redirect({
        to: (authCheck.redirectTo ?? "/auth") as any,
        search: {
          redirect: location.pathname,
          error: authCheck.reason,
        } as any,
      });
    }

    return { session };
  },
  component: () => <Outlet />,
});
