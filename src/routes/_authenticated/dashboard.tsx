import { createFileRoute, redirect } from "@tanstack/react-router";
import { getMyRoles, homeFor } from "@/lib/campus";

export const Route = createFileRoute("/_authenticated/dashboard")({
  beforeLoad: async () => {
    throw redirect({ to: homeFor(await getMyRoles()) });
  },
});
