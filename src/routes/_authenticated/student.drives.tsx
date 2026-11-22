import { createFileRoute, Link } from "@tanstack/react-router";
import { BriefcaseBusiness, GraduationCap } from "lucide-react";
import { Empty, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/student/drives")({
  component: PlacementDrives,
});

function PlacementDrives() {
  return (
    <>
      <PageHeader
        title="Placement Drives"
        subtitle="Placement-drive records are not available in the connected database schema."
      />
      <Empty>
        <GraduationCap className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        <p>
          Browse live opportunities instead. Contact your placement office for campus drive
          schedules and registration details.
        </p>
        <Link to="/student/opportunities" className="mt-4 inline-block">
          <Button>
            <BriefcaseBusiness className="mr-2 h-4 w-4" />
            Browse opportunities
          </Button>
        </Link>
      </Empty>
    </>
  );
}
