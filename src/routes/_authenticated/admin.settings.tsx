import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { Empty, PageHeader } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  head: () => ({ meta: [{ title: "Admin Settings — Skill to Hire" }] }),
  component: AdminSettingsPage,
});

function AdminSettingsPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Admin Settings"
        subtitle="Organization-wide settings require a verified persistent settings relation and its access policies."
      />
      <Empty>
        <Settings className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        No admin settings relation is represented in the current generated app types. Local sample
        settings are not shown or saved as if they were shared configuration.
      </Empty>
    </div>
  );
}
