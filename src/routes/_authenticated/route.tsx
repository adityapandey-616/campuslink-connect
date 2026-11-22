import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { isAuthorizedForPath, restoreSession } from "@/lib/auth-store";

const authRedirectSearchSchema = z.object({
  redirect: z.string().optional(),
  error: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated")({
  validateSearch: authRedirectSearchSchema,
  beforeLoad: async ({ location }) => {
    const session = await restoreSession();

    // Check general authentication
    if (!session) {
      throw redirect({
        to: "/auth",
        search: { redirect: location.pathname },
      });
    }

    // Enforce role-based route protection
    const authCheck = isAuthorizedForPath(session, location.pathname);
    if (!authCheck.authorized) {
      throw redirect({
        to: authCheck.redirectTo ?? "/auth",
        search: {
          redirect: location.pathname,
          error: authCheck.reason,
        },
      });
    }

    return { session };
  },
  component: () => <Outlet />,
});
