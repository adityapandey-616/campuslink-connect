import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Empty, Loading, PageHeader } from "@/components/AppShell";
import { BRANCHES } from "@/lib/campus";
import { companyJobsQuery, myCompanyQuery } from "@/lib/recruiter-data";

export const Route = createFileRoute("/_authenticated/recruiter/discover")({
  component: Discover,
});

function Discover() {
  const company = useQuery(myCompanyQuery);
  const jobs = useQuery(companyJobsQuery(company.data?.id));
  const [jobId, setJobId] = useState("");
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("all");

  const list = jobs.data ?? [];
  const job = list.find((item) => item.id === jobId) ?? list[0];
  const ranked = useMemo(() => {
    if (!job) return [];
    return job.applications
      .filter((application) => {
        const student = application.student;
        const matchesSearch = `${student.full_name} ${student.branch ?? ""} ${student.email}`
          .toLowerCase()
          .includes(search.trim().toLowerCase());
        const matchesBranch = branch === "all" || student.branch === branch;
        return matchesSearch && matchesBranch;
      })
      .map((application) => ({ application, student: application.student }));
  }, [branch, job, search]);

  if (company.isLoading || jobs.isLoading) return <Loading />;
  if (!company.data) return <Empty>Your recruiter account is not linked to a company.</Empty>;
  if (!list.length) return <Empty>Create a job before discovering candidates.</Empty>;

  return (
    <>
      <PageHeader
        title="Candidate discovery"
        subtitle="Review applicants to the selected opportunity. Academic and skill matching are unavailable because the current query does not join student and job requirement records."
        action={
          job ? (
            <select
              value={job.id}
              onChange={(event) => setJobId(event.target.value)}
              className="h-9 rounded-md border bg-card px-3 text-sm"
            >
              {list.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          ) : null
        }
      />
      <div className="mb-5 rounded-lg border bg-card p-3">
        <div className="grid gap-3 md:grid-cols-[1fr_160px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Search candidates"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search candidate or email"
              className="pl-9"
            />
          </div>
          <select
            value={branch}
            onChange={(event) => setBranch(event.target.value)}
            className="h-9 rounded-md border bg-card px-3 text-sm"
          >
            <option value="all">All branches</option>
            {BRANCHES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>
      {ranked.length === 0 ? (
        <Empty>
          <Filter className="mx-auto mb-3 h-8 w-8" />
          No candidates match the current filters.
        </Empty>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {ranked.map(({ application, student }) => (
            <article
              key={student.id}
              className="flex min-w-0 flex-col rounded-lg border bg-card p-4 transition-colors hover:border-accent/50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-accent/10 text-sm font-semibold text-accent">
                      {student.full_name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{student.full_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {student.branch ?? "Branch not available"} · {student.email}
                      </div>
                    </div>
                  </div>
                </div>
                <span className="rounded bg-secondary px-2 py-1 text-xs font-semibold text-muted-foreground">
                  {application.status}
                </span>
              </div>
              <div className="mt-4 rounded-md bg-secondary/50 p-3 text-sm">
                <p className="text-muted-foreground">
                  CGPA, backlog, and skills are not available in the live profiles data, so no match
                  score is computed.
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
