import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — CAMPUSLINK" },
      { name: "description", content: "Choose a new password for your CAMPUSLINK account." },
      { property: "og:title", content: "Set a new password — CAMPUSLINK" },
      { property: "og:description", content: "Reset your CAMPUSLINK password." },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const pw = String(f.get("password"));
    if (pw.length < 8) { toast.error("Password must be at least 8 characters."); return; }
    if (pw !== f.get("confirm")) { toast.error("Passwords do not match."); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated");
    navigate({ to: "/dashboard" });
  }
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
        <Logo />
        <h1 className="text-2xl font-semibold">Set a new password</h1>
        <div className="space-y-1.5"><Label>New password</Label><Input name="password" type="password" required /></div>
        <div className="space-y-1.5"><Label>Confirm password</Label><Input name="confirm" type="password" required /></div>
        <Button className="w-full" disabled={busy}>Update password</Button>
      </form>
    </div>
  );
}
