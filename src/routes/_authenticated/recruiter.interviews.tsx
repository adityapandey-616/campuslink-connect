import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CalendarDays, Clock3, Filter, Search, Video } from "lucide-react";
import { Empty, Loading, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { companyJobsQuery, myCompanyQuery } from "@/lib/recruiter-data";
import { toast } from "sonner";
import { addMockInterview, updateMockApplicationStatus } from "@/lib/mock-data";
import { RECRUITER_STATUS_STYLES } from "@/lib/recruiter-frontend";

export const Route = createFileRoute("/_authenticated/recruiter/interviews")({
  component: RecruiterInterviews,
});

function RecruiterInterviews() {
  const company = useQuery(myCompanyQuery);
  const jobs = useQuery(companyJobsQuery(company.data?.id));
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const interviews = useMemo(() => {
    const all = jobs.data?.flatMap((job) => job.applications.flatMap((application) => application.interviews.map((interview) => ({ ...interview, application, job })))) ?? [];
    return all.filter((interview) => {
      const haystack = `${interview.application.student.full_name} ${interview.job.title} ${interview.round}`.toLowerCase();
      return (statusFilter === "all" || interview.status === statusFilter) && haystack.includes(search.trim().toLowerCase());
    }).sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  }, [jobs.data, search, statusFilter]);

  const reschedule = useMutation({
    mutationFn: async ({ interviewId, nextDate }: { interviewId: string; nextDate: string }) => {
      const all = jobs.data?.flatMap((job) => job.applications) ?? [];
      const target = all.find((application) => application.interviews.some((interview) => interview.id === interviewId));
      const interview = target?.interviews.find((item) => item.id === interviewId);
      if (!target || !interview) throw new Error("Interview not found");
      updateMockApplicationStatus(target.id, "interview");
      addMockInterview(target.id, { round: interview.round, scheduled_at: new Date(nextDate).toISOString(), mode: interview.mode, location: interview.location });
      return target.id;
    },
    onSuccess: () => {
      toast.success("Interview rescheduled.");
      qc.invalidateQueries({ queryKey: ["company-jobs"] });
    },
  });

  const cancelInterview = useMutation({
    mutationFn: async (interviewId: string) => {
      const all = jobs.data?.flatMap((job) => job.applications) ?? [];
      const target = all.find((application) => application.interviews.some((interview) => interview.id === interviewId));
      if (!target) throw new Error("Interview not found");
      updateMockApplicationStatus(target.id, "shortlisted");
      return target.id;
    },
    onSuccess: () => {
      toast.success("Interview cancelled. The application remains shortlisted.");
      qc.invalidateQueries({ queryKey: ["company-jobs"] });
    },
  });

  if (company.isLoading || jobs.isLoading) return <Loading />;
  if (!company.data) return <Empty>No company profile is linked to this recruiter account.</Empty>;

  return (
    <>
      <PageHeader title="Interview management" subtitle="Review upcoming and completed interviews for each role." />
      <div className="mb-5 flex flex-col gap-3 rounded-lg border bg-card p-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Search interviews" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search candidate, role, or round" className="pl-9" />
        </div>
        <div className="flex items-center gap-2 rounded-md border p-1">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-8 rounded border bg-card px-2 text-sm">
            <option value="all">All statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {interviews.length === 0 ? <Empty><CalendarDays className="mx-auto mb-3 h-8 w-8" />No interviews match the current filters.</Empty> : (
        <div className="grid gap-3 md:grid-cols-2">
          {interviews.map((interview) => {
            const isUpcoming = new Date(interview.scheduled_at) > new Date();
            return (
              <article key={interview.id} className="rounded-lg border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{interview.application.student.full_name}</div>
                    <div className="text-sm text-muted-foreground">{interview.job.title} · {interview.round}</div>
                  </div>
                  <span className={`rounded px-2 py-1 text-xs font-semibold capitalize ${RECRUITER_STATUS_STYLES[interview.status ?? "scheduled"] ?? "bg-secondary"}`}>{interview.status ?? "scheduled"}</span>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-muted-foreground" />{new Date(interview.scheduled_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</div>
                  <div className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-muted-foreground" />{interview.mode} · {interview.location || "Location TBD"}</div>
                  <div className="flex items-center gap-2"><Video className="h-4 w-4 text-muted-foreground" />{isUpcoming ? "Upcoming" : "Completed or past"}</div>
                </div>
                <div className="mt-4 flex gap-2">
                  <label className="relative flex-1">
                    <span className="sr-only">Reschedule interview</span>
                    <input type="datetime-local" onChange={(event) => {
                      if (event.target.value) reschedule.mutate({ interviewId: interview.id, nextDate: event.target.value });
                    }} className="h-9 w-full rounded-md border bg-card px-2 text-sm" />
                  </label>
                  <Button variant="outline" size="sm" onClick={() => cancelInterview.mutate(interview.id)} disabled={cancelInterview.isPending}>Cancel</Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
