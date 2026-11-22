import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Empty, Loading, PageHeader } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { adminOverviewQuery, type AdminInterview } from "@/lib/admin-live-data";

const EMPTY_INTERVIEWS: AdminInterview[] = [];

export const Route = createFileRoute("/_authenticated/admin/interviews")({
  head: () => ({ meta: [{ title: "Interviews — Skill to Hire Admin" }] }),
  component: AdminInterviewsPage,
});

function AdminInterviewsPage() {
  const query = useQuery(adminOverviewQuery);
  const [search, setSearch] = useState("");
  const interviews = query.data?.interviews ?? EMPTY_INTERVIEWS;
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return interviews.filter((interview) =>
      `${interview.student_name} ${interview.company_name} ${interview.opportunity_title}`
        .toLowerCase()
        .includes(needle),
    );
  }, [interviews, search]);

  if (query.isLoading) return <Loading />;
  if (query.error) {
    return (
      <Empty>
        Live interviews could not be loaded:{" "}
        {query.error instanceof Error ? query.error.message : "Unknown Supabase error"}
      </Empty>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Interviews"
        subtitle="Live interview schedules and statuses. Admin scheduling and status changes are disabled because admin interview write RLS was not verified."
      />
      <Input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search student, company, or opportunity"
        aria-label="Search interviews"
        className="max-w-lg"
      />
      {filtered.length === 0 ? (
        <Empty>{interviews.length ? "No interviews match." : "No interview records found."}</Empty>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((interview) => (
            <article key={interview.id} className="rounded-lg border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{interview.student_name}</h2>
                  <p className="text-sm text-muted-foreground">{interview.opportunity_title}</p>
                  <p className="text-xs text-muted-foreground">{interview.company_name}</p>
                </div>
                <Badge variant="outline">{interview.status}</Badge>
              </div>
              <div className="mt-4 text-sm">
                {new Date(interview.scheduled_at).toLocaleString()}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Interview round, mode, and location are not represented in the current generated
                interview types.
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
