import { createFileRoute, Link } from "@tanstack/react-router";
import { BriefcaseBusiness, CalendarDays } from "lucide-react";
import { Empty, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/drives")({
  head: () => ({ meta: [{ title: "Placement Drives — Skill to Hire Admin" }] }),
  component: AdminDrivesPage,
});

function AdminDrivesPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Placement Drives"
        subtitle="Drive management is not available because the connected database schema has no placement-drives table."
      />
      <Empty>
        <CalendarDays className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        <p>
          Manage live employer postings through opportunities. Do not enter drive dates or
          registrations here; those records are not supported by the deployed schema.
        </p>
        <Link to="/admin/companies" className="mt-4 inline-block">
          <Button>
            <BriefcaseBusiness className="mr-2 h-4 w-4" />
            Manage companies
          </Button>
        </Link>
      </Empty>
    </div>
  );
}
