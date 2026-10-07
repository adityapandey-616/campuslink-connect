import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

const search = z.object({
  mode: z.enum(["signin", "signup", "forgot"]).optional(),
  role: z.enum(["student", "recruiter"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: search,
  beforeLoad: () => {
    throw redirect({ to: "/student" });
  },
  component: () => null,
});
