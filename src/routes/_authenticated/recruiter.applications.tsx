import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Briefcase,
  CheckCircle2,
  Filter,
  Search,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Empty, Loading, PageHeader } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { companyJobsQuery, myCompanyQuery } from "@/lib/recruiter-data";
import { RECRUITER_STATUS_STYLES, formatStatus, getStatusLabel } from "@/lib/recruiter-frontend";

export const Route = createFileRoute("/_authenticated/recruiter/applications")({
  component: RecruiterApplications,
});

const STATUS_OPTIONS = [
  "all",
  "applied",
  "shortlisted",
  "interview",
  "offered",
  "joined",
  "rejected",
] as const;
type StatusFilter = (typeof STATUS_OPTIONS)[number];

function RecruiterApplications() {
  const company = useQuery(myCompanyQuery);
  const jobs = useQuery(companyJobsQuery(company.data?.id));
  const qc = useQueryClient();
  const [status, setStatus] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"candidate" | "status">("candidate");

  const applications = useMemo(() => {
    const list =
      jobs.data?.flatMap((job) =>
        job.applications.map((application) => ({ ...application, job })),
      ) ?? [];
    return [...list]
      .filter((application) => {
        const matchesStatus = status === "all" || application.status === status;
        const haystack =
          `${application.student.full_name} ${application.student.branch} ${application.job.title}`.toLowerCase();
        return matchesStatus && haystack.includes(search.trim().toLowerCase());
      })
      .sort((a, b) => {
        if (sort === "status") return a.status.localeCompare(b.status);
        return a.student.full_name.localeCompare(b.student.full_name);
      });
  }, [jobs.data, search, sort, status]);

  const updateStatus = useMutation({
    mutationFn: async ({
      id,
      nextStatus,
    }: {
      id: string;
      nextStatus: "applied" | "shortlisted" | "interview" | "offered" | "joined" | "rejected";
    }) => {
      const { data, error } = await supabase
        .from("applications")
        .update({ status: nextStatus })
        .eq("id", id)
        .select("id")
        .maybeSingle();
      if (error) {
        throw new Error(`Could not update the application: ${error.message}`);
      }
      if (!data) throw new Error("No application was updated under the current permissions.");
      return nextStatus;
    },
    onSuccess: (_result, variables) => {
      toast.success(`Application moved to ${formatStatus(variables.nextStatus)}.`);
      qc.invalidateQueries({ queryKey: ["company-jobs"] });
      qc.invalidateQueries({ queryKey: ["my-applications"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Unable to update the application."),
  });

  if (company.isLoading || jobs.isLoading) return <Loading />;
  if (company.error || jobs.error) {
    const error = company.error ?? jobs.error;
    return (
      <Empty>
        Live applications could not be loaded:{" "}
        {error instanceof Error ? error.message : "Unknown Supabase error"}
      </Empty>
    );
  }
  if (!company.data) return <Empty>Your recruiter account is not linked to a company.</Empty>;

  const counts = STATUS_OPTIONS.reduce<Record<string, number>>((acc, option) => {
    acc[option] =
      option === "all"
        ? applications.length
        : applications.filter((item) => item.status === option).length;
    return acc;
  }, {});

  return (
    <>
      <PageHeader
        title="Applications & candidates"
        subtitle="Track every application from submission to offer."
      />
      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {STATUS_OPTIONS.filter((item) => item !== "all").map((item) => (
          <button
            key={item}
            onClick={() => setStatus(item)}
            className={`rounded-lg border p-3 text-left ${status === item ? "border-accent bg-accent/5" : "bg-card"}`}
          >
            <div className="font-display text-2xl font-bold">{counts[item]}</div>
            <div className="text-xs text-muted-foreground">{getStatusLabel(item)}</div>
          </button>
        ))}
      </div>

      <div className="mb-5 flex flex-col gap-3 rounded-lg border bg-card p-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search applications"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search candidate or role"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-md border p-1">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as StatusFilter)}
              className="h-8 rounded border bg-card px-2 text-sm"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === "all" ? "All statuses" : formatStatus(option)}
                </option>
              ))}
            </select>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSort((current) => (current === "candidate" ? "status" : "candidate"))}
          >
            Sort: {sort === "candidate" ? "candidate" : "status"}
          </Button>
        </div>
      </div>

      {applications.length === 0 ? (
        <Empty>
          <Briefcase className="mx-auto mb-3 h-8 w-8" />
          No applications match the current filters.
        </Empty>
      ) : (
        <div className="space-y-3">
          {applications.map((application) => (
            <article key={application.id} className="rounded-lg border bg-card p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <UserRound className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{application.student.full_name}</span>
                    <span className="text-sm text-muted-foreground">
                      {application.student.branch ?? "Branch not available"} · CGPA{" "}
                      {application.student.cgpa ?? "Not stored"}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {application.job.title} · {application.job.location} · Applied{" "}
                    {new Date(application.applied_at).toLocaleDateString()} · Match unavailable
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded px-2 py-1 text-xs font-semibold capitalize ${RECRUITER_STATUS_STYLES[application.status] ?? "bg-secondary"}`}
                  >
                    {application.status}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      window.location.assign(`/recruiter/candidate/${application.student.id}`)
                    }
                  >
                    View profile
                  </Button>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {application.status === "applied" && (
                  <Button
                    size="sm"
                    onClick={() =>
                      updateStatus.mutate({ id: application.id, nextStatus: "shortlisted" })
                    }
                  >
                    Shortlist
                  </Button>
                )}
                {application.status === "shortlisted" && (
                  <span className="text-xs text-muted-foreground">
                    Schedule interviews from the candidate profile.
                  </span>
                )}
                {application.status === "interview" && (
                  <span className="text-xs text-muted-foreground">
                    Offer creation requires a confirmed salary unit and write policy.
                  </span>
                )}
                {application.status === "offered" &&
                  application.offers.some((offer) => offer.status === "accepted") && (
                    <Button
                      size="sm"
                      onClick={() =>
                        updateStatus.mutate({ id: application.id, nextStatus: "joined" })
                      }
                    >
                      Mark joined
                    </Button>
                  )}
                {application.status !== "rejected" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      updateStatus.mutate({ id: application.id, nextStatus: "rejected" })
                    }
                  >
                    Reject
                  </Button>
                )}
                {application.status === "rejected" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      updateStatus.mutate({ id: application.id, nextStatus: "applied" })
                    }
                  >
                    Reopen
                  </Button>
                )}
              </div>
              {application.offers.length > 0 &&
                (() => {
                  const offer = application.offers[0];
                  return offer ? (
                    <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      Salary {offer.salary} · {offer.status}
                    </div>
                  ) : null;
                })()}
            </article>
          ))}
        </div>
      )}
    </>
  );
}
