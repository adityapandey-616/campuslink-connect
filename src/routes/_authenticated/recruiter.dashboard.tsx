import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock3,
  MessageSquareText,
  Search,
  TrendingUp,
  Users,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Empty, Loading, PageHeader, Stat } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { companyJobsQuery, myCompanyQuery } from "@/lib/recruiter-data";
import { formatDateTime, RECRUITER_STATUS_STYLES } from "@/lib/recruiter-frontend";
import { statusStyles } from "@/lib/campus";
import { getDemoPreviewRole } from "@/lib/auth-store";

export const Route = createFileRoute("/_authenticated/recruiter/dashboard")({
  component: RecruiterDashboard,
});

function RecruiterDashboard() {
  if (getDemoPreviewRole() === "recruiter") return <RecruiterPreviewDashboard />;
  return <LiveRecruiterDashboard />;
}

function RecruiterPreviewDashboard() {
  return (
    <>
      <PageHeader
        title="Recruiter dashboard"
        subtitle="Sample recruiter overview. No live company or candidate records are loaded."
      />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Active job postings" value="4" hint="Sample records" />
        <Stat label="Total applicants" value="26" hint="Sample records" />
        <Stat label="Shortlisted candidates" value="7" hint="Sample records" />
        <Stat label="Interviews scheduled" value="3" hint="Sample records" />
      </section>
      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-5">
          <h2 className="font-semibold">Sample hiring pipeline</h2>
          <div className="mt-4 space-y-3">
            {[
              { role: "Frontend Engineer", stage: "Shortlisted", count: "12 sample applicants" },
              {
                role: "Graduate Software Developer",
                stage: "Interview",
                count: "8 sample applicants",
              },
            ].map((item) => (
              <div
                key={item.role}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3"
              >
                <div>
                  <div className="font-medium">{item.role}</div>
                  <div className="text-sm text-muted-foreground">{item.count}</div>
                </div>
                <span className="rounded bg-secondary px-2 py-1 text-xs">{item.stage}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-5">
          <h2 className="font-semibold">Preview restrictions</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Candidate discovery, applicant details, job editing, interviews, and offers are
            unavailable in Demo Preview. These sample figures are not connected to Supabase.
          </p>
        </div>
      </section>
    </>
  );
}

function LiveRecruiterDashboard() {
  const company = useQuery(myCompanyQuery);
  const jobs = useQuery(companyJobsQuery(company.data?.id));

  if (company.isLoading || jobs.isLoading) return <Loading />;
  if (company.error) {
    return (
      <Empty>
        Recruiter company could not be loaded:{" "}
        {company.error instanceof Error ? company.error.message : "Unknown Supabase error"}
      </Empty>
    );
  }
  if (!company.data) return <Empty>Your recruiter account is not linked to a company.</Empty>;
  if (jobs.error) {
    return (
      <Empty>
        Live recruiter dashboard data could not be loaded:{" "}
        {jobs.error instanceof Error ? jobs.error.message : "Unknown Supabase error"}
      </Empty>
    );
  }

  const liveJobs = jobs.data ?? [];
  const applications = liveJobs.flatMap((job) =>
    job.applications.map((application) => ({ ...application, job })),
  );
  const interviews = applications.flatMap((application) =>
    application.interviews.map((interview) => ({
      ...interview,
      application,
      job: application.job,
    })),
  );
  const offers = applications.flatMap((application) =>
    application.offers.map((offer) => ({ ...offer, application, job: application.job })),
  );
  const data = {
    jobs: liveJobs,
    applications,
    interviews,
    offers,
    activeJobs: liveJobs.filter((job) => job.status === "open").length,
    totalApplicants: applications.length,
    shortlisted: applications.filter((application) => application.status === "shortlisted").length,
    interviewsScheduled: interviews.filter((interview) => interview.status === "scheduled").length,
    offersMade: offers.filter((offer) =>
      ["released", "accepted"].includes(offer.status.toLowerCase()),
    ).length,
  };
  const recentApplications = applications.slice(0, 5);
  const upcomingInterviews = interviews
    .filter(
      (interview) =>
        interview.status === "scheduled" && new Date(interview.scheduled_at) > new Date(),
    )
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    .slice(0, 4);
  const topJobs = [...data.jobs]
    .sort((a, b) => (b.applications?.length ?? 0) - (a.applications?.length ?? 0))
    .slice(0, 3);

  return (
    <>
      <PageHeader
        title="Recruiter dashboard"
        subtitle={`Welcome back — ${company.data.name} has ${data.jobs.length} live opportunities.`}
        action={
          <Link to="/recruiter/discover">
            <Button>
              <Search className="mr-2 h-4 w-4" />
              Find candidates
            </Button>
          </Link>
        }
      />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Active job postings" value={data.activeJobs} hint="Currently open" />
        <Stat label="Total applicants" value={data.totalApplicants} hint="Across all roles" />
        <Stat label="Shortlisted candidates" value={data.shortlisted} hint="Pipeline stage" />
        <Stat
          label="Interviews scheduled"
          value={data.interviewsScheduled}
          hint="This hiring cycle"
        />
      </section>
      <section className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <Stat label="Offers made" value={data.offersMade} hint="Offer letters released" />
        <Stat
          label="Open roles"
          value={data.jobs.filter((job) => job.status === "open").length}
          hint="Ready to hire"
        />
        <Stat
          label="Job closes soon"
          value={
            data.jobs.filter((job) => {
              if (!job.deadline) return false;
              const deadline = new Date(job.deadline).getTime();
              return deadline >= Date.now() && deadline <= Date.now() + 7 * 24 * 60 * 60 * 1000;
            }).length
          }
          hint="Within timeline"
        />
        <Stat
          label="Average readiness"
          value="Unavailable"
          hint="No match-score field in the current application types"
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="rounded-lg border bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Applications</h2>
              <p className="text-sm text-muted-foreground">Candidates across your roles</p>
            </div>
            <Link
              to="/recruiter/applications"
              className="inline-flex items-center text-sm text-accent"
            >
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-5 space-y-3">
            {recentApplications.length === 0 ? (
              <Empty>No applications have been submitted yet.</Empty>
            ) : (
              recentApplications.map((application) => (
                <div
                  key={application.id}
                  className="flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="font-medium">{application.student?.full_name ?? "Student"}</div>
                    <div className="text-sm text-muted-foreground">
                      {application.job?.title ?? "Role"} ·{" "}
                      {application.student?.branch ?? "Unknown branch"} · CGPA{" "}
                      {application.student?.cgpa ?? "—"}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded px-2 py-0.5 text-xs capitalize ${statusStyles[application.status] ?? "bg-secondary"}`}
                    >
                      {application.status}
                    </span>
                    <span className="text-sm text-muted-foreground">Match unavailable</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-5">
          <h2 className="font-semibold">Quick actions</h2>
          <div className="mt-4 grid gap-2">
            <Link
              to="/recruiter/new-job"
              className="flex items-center justify-between rounded-md border bg-secondary/50 p-3 text-sm hover:bg-secondary"
            >
              <span className="flex items-center gap-2">
                <BriefcaseBusiness className="h-4 w-4" />
                Create new job
              </span>
              <ChevronRight className="h-4 w-4" />
            </Link>
            <Link
              to="/recruiter/discover"
              className="flex items-center justify-between rounded-md border bg-secondary/50 p-3 text-sm hover:bg-secondary"
            >
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Discover candidates
              </span>
              <ChevronRight className="h-4 w-4" />
            </Link>
            <Link
              to="/recruiter/interviews"
              className="flex items-center justify-between rounded-md border bg-secondary/50 p-3 text-sm hover:bg-secondary"
            >
              <span className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4" />
                Schedule or review interviews
              </span>
              <ChevronRight className="h-4 w-4" />
            </Link>
            <Link
              to="/recruiter/company"
              className="flex items-center justify-between rounded-md border bg-secondary/50 p-3 text-sm hover:bg-secondary"
            >
              <span className="flex items-center gap-2">
                <MessageSquareText className="h-4 w-4" />
                Update company profile
              </span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Upcoming interviews</h2>
            <Link to="/recruiter/interviews" className="text-sm text-accent">
              Manage
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {upcomingInterviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">No interviews scheduled.</p>
            ) : (
              upcomingInterviews.map((interview) => (
                <div
                  key={interview.id}
                  className="flex items-start justify-between gap-3 rounded-md border p-3"
                >
                  <div>
                    <div className="font-medium">
                      {interview.application.student?.full_name ?? "Student"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {interview.job?.title ?? "Role"} · {interview.interview_type}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarClock className="h-3.5 w-3.5" />{" "}
                      {formatDateTime(interview.scheduled_at)}
                    </div>
                  </div>
                  <span
                    className={`rounded px-2 py-1 text-xs capitalize ${RECRUITER_STATUS_STYLES[interview.status ?? "scheduled"]}`}
                  >
                    {interview.status ?? "scheduled"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Application status</h2>
            <Activity className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="mt-4 space-y-3">
            {recentApplications.slice(0, 4).map((application) => (
              <div
                key={application.id}
                className="flex items-start gap-3 border-l-2 border-accent pl-3"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-accent" />
                <div>
                  <div className="text-sm font-medium">
                    {application.student.full_name} · {application.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-lg border bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Hiring summary</h2>
            <p className="text-sm text-muted-foreground">
              Roles with the strongest candidate momentum
            </p>
          </div>
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {topJobs.map((job) => (
            <div key={job.id} className="rounded-md border p-4">
              <div className="font-medium">{job.title}</div>
              <div className="mt-1 text-sm text-muted-foreground">
                {job.location} · {job.job_type}
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span>Applicants</span>
                <strong>{job.applications?.length ?? 0}</strong>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span>Active</span>
                <span className="text-success">{job.status === "open" ? "Open" : job.status}</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <Clock3 className="h-3.5 w-3.5" />
                {job.deadline
                  ? `Closes ${new Date(job.deadline).toLocaleDateString(undefined, { dateStyle: "medium" })}`
                  : "No deadline"}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
