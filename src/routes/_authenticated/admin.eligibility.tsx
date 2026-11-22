import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { Empty, PageHeader } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/admin/eligibility")({
  head: () => ({ meta: [{ title: "Eligibility — Skill to Hire Admin" }] }),
  component: AdminEligibilityPage,
});

function AdminEligibilityPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Eligibility & Shortlisting"
        subtitle="Eligibility checks need verified academic records and opportunity requirements."
      />
      <Empty>
        <Sparkles className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        The live profiles schema has no CGPA/backlog fields, and live opportunities have no
        eligibility or skills fields. No eligibility scores or shortlists are generated from mock
        data.
      </Empty>
    </div>
  );
}
