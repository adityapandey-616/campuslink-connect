import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { Empty, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/attention")({
  component: Attention,
});

function Attention() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Students requiring attention"
        subtitle="Risk and readiness monitoring requires academic and placement data not present in live profiles."
        action={
          <Link to="/admin/students">
            <Button size="sm" variant="outline">
              All student profiles
            </Button>
          </Link>
        }
      />
      <Empty>
        <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        This report is unavailable because live profiles do not contain CGPA, backlog, or placement
        status, and student skill/project/document relations were not verified.
      </Empty>
    </div>
  );
}
