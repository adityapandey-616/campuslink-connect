import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Empty, Loading, PageHeader } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { adminOverviewQuery, type AdminApplication } from "@/lib/admin-live-data";

const EMPTY_APPLICATIONS: AdminApplication[] = [];

export const Route = createFileRoute("/_authenticated/admin/applications")({
  head: () => ({ meta: [{ title: "Applications — Skill to Hire Admin" }] }),
  component: AdminApplicationsPage,
});

function AdminApplicationsPage() {
  const query = useQuery(adminOverviewQuery);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const applications = query.data?.applications ?? EMPTY_APPLICATIONS;
  const statuses = [...new Set(applications.map((application) => application.status))].sort();
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return applications.filter((application) => {
      const text =
        `${application.student_name} ${application.student_branch ?? ""} ${application.company_name} ${application.opportunity_title}`.toLowerCase();
      return text.includes(needle) && (status === "all" || application.status === status);
    });
  }, [applications, search, status]);

  if (query.isLoading) return <Loading />;
  if (query.error) {
    return (
      <Empty>
        Live applications could not be loaded:{" "}
        {query.error instanceof Error ? query.error.message : "Unknown Supabase error"}
      </Empty>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Applications"
        subtitle="Live application records joined to records visible under current RLS policies. Admin status changes are disabled because application write RLS was not verified."
      />
      <div className="grid gap-3 rounded-lg border bg-card p-3 sm:grid-cols-[1fr_220px]">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search student, company, or opportunity"
            className="pl-9"
          />
        </div>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="all">All statuses</option>
          {statuses.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      {filtered.length === 0 ? (
        <Empty>
          {applications.length ? "No application records match." : "No applications found."}
        </Empty>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-secondary/60 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Student</th>
                <th className="p-3">Opportunity</th>
                <th className="p-3">Company</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((application) => (
                <tr key={application.id}>
                  <td className="p-3">
                    <div className="font-medium">{application.student_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {application.student_branch ?? "Branch not available"}
                    </div>
                  </td>
                  <td className="p-3">{application.opportunity_title}</td>
                  <td className="p-3">{application.company_name}</td>
                  <td className="p-3">
                    <Badge variant="outline">{application.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
