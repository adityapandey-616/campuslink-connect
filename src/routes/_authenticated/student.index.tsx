import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Briefcase, CalendarCheck, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { Empty, Loading, PageHeader, Stat } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { statusStyles } from "@/lib/campus";
import {
  liveStudentOpportunitiesQuery,
  myApplicationsQuery,
  myNotificationsQuery,
  myProfileQuery,
} from "@/lib/student-data";
import { supabase } from "@/integrations/supabase/client";
import { getDemoPreviewRole } from "@/lib/auth-store";

export const Route = createFileRoute("/_authenticated/student/")({
  component: StudentDashboard,
});

function StudentDashboard() {
  if (getDemoPreviewRole() === "student") return <StudentPreviewDashboard />;
  return <LiveStudentDashboard />;
}

function StudentPreviewDashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Student dashboard"
        subtitle="Sample student portal overview. No live student records are loaded."
      />
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Applications" value="3" hint="Sample records" />
        <Stat label="Available opportunities" value="8" hint="Sample records" />
        <Stat label="Upcoming interviews" value="1" hint="Sample record" />
        <Stat label="Unread notifications" value="2" hint="Sample records" />
      </section>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-5">
          <h2 className="mb-4 font-semibold">Sample applications</h2>
          <div className="space-y-3">
            {[
              { title: "Frontend Engineer", company: "Example Company", status: "Shortlisted" },
              { title: "Graduate Software Developer", company: "Sample Labs", status: "Applied" },
            ].map((application) => (
              <div
                key={application.title}
                className="flex items-center justify-between gap-3 rounded-md border p-3"
              >
                <div>
                  <div className="font-medium">{application.title}</div>
                  <div className="text-xs text-muted-foreground">{application.company}</div>
                </div>
                <span className="rounded bg-secondary px-2 py-1 text-xs">{application.status}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-xl border bg-card p-5">
          <h2 className="mb-4 font-semibold">Sample opportunity</h2>
          <div className="font-medium">Graduate Software Developer</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Example Company · Bengaluru · Full-time
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            This illustrative listing contains no live company or candidate data.
          </p>
        </section>
      </div>
    </div>
  );
}

function LiveStudentDashboard() {
  const profile = useQuery(myProfileQuery);
  const opportunities = useQuery(liveStudentOpportunitiesQuery);
  const applications = useQuery(myApplicationsQuery);
  const notifications = useQuery(myNotificationsQuery);
  const queryClient = useQueryClient();

  const markRead = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!profile.data) throw new Error("Student profile is unavailable.");
      const { data, error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId)
        .eq("profile_id", profile.data.id)
        .select("id")
        .maybeSingle();
      if (error) throw new Error(`Could not mark notification as read: ${error.message}`);
      if (!data)
        throw new Error("This notification could not be updated under current permissions.");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["student-notifications"] }),
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not update notification."),
  });

  if (
    profile.isLoading ||
    opportunities.isLoading ||
    applications.isLoading ||
    notifications.isLoading
  ) {
    return <Loading />;
  }
  const error = profile.error ?? opportunities.error ?? applications.error ?? notifications.error;
  if (error) {
    return (
      <Empty>
        Live student data could not be loaded:{" "}
        {error instanceof Error ? error.message : "Unknown Supabase error"}
      </Empty>
    );
  }
  if (!profile.data) return <Empty>A student profile is not available for this account.</Empty>;

  const appRows = applications.data ?? [];
  const today = new Date().toISOString().slice(0, 10);
  const availableOpportunities =
    opportunities.data?.filter(
      (opportunity) => !opportunity.deadline || opportunity.deadline >= today,
    ).length ?? 0;
  const notificationsList = notifications.data ?? [];
  const upcomingInterviews = appRows
    .flatMap((application) =>
      application.interviews.map((interview) => ({
        ...interview,
        title: application.job?.title ?? "Opportunity unavailable",
        company: application.job?.company?.name ?? "Company unavailable",
      })),
    )
    .filter(
      (interview) =>
        interview.status === "scheduled" &&
        new Date(interview.scheduled_at).getTime() >= Date.now(),
    )
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hi, ${(profile.data.full_name ?? "Student").split(" ")[0] || "Student"}`}
        subtitle={`${profile.data.branch ?? "Branch not set"} · Graduation year ${profile.data.graduation_year ?? "not set"}`}
        action={
          <Link to="/student/opportunities">
            <Button>
              <Briefcase className="mr-2 h-4 w-4" />
              View opportunities
            </Button>
          </Link>
        }
      />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Applications" value={appRows.length} hint="Live application records" />
        <Stat
          label="Available opportunities"
          value={availableOpportunities}
          hint="Not past their deadline"
        />
        <Stat
          label="Upcoming interviews"
          value={upcomingInterviews.length}
          hint="Scheduled records"
        />
        <Stat
          label="Unread notifications"
          value={notificationsList.filter((notification) => !notification.is_read).length}
          hint="Live profile notifications"
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold">
              <Briefcase className="h-4 w-4 text-accent" />
              Applications
            </h2>
            <Link to="/student/applications" className="text-xs text-accent hover:underline">
              View all
            </Link>
          </div>
          {appRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No applications found.</p>
          ) : (
            <div className="space-y-2">
              {appRows.slice(0, 5).map((application) => (
                <div
                  key={application.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3"
                >
                  <div>
                    <div className="font-medium">
                      {application.job?.title ?? "Opportunity unavailable"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {application.job?.company?.name ?? "Company unavailable"}
                    </div>
                  </div>
                  <span
                    className={`rounded px-2 py-1 text-xs capitalize ${statusStyles[application.status ?? ""] ?? "bg-secondary"}`}
                  >
                    {application.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border bg-card p-5">
          <h2 className="mb-4 flex items-center gap-2 font-semibold">
            <CalendarCheck className="h-4 w-4 text-accent" />
            Upcoming interviews
          </h2>
          {upcomingInterviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming interviews found.</p>
          ) : (
            <div className="space-y-2">
              {upcomingInterviews.map((interview) => (
                <div key={interview.id} className="rounded-md border p-3">
                  <div className="font-medium">{interview.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {interview.company} · {new Date(interview.scheduled_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="rounded-xl border bg-card p-5">
        <h2 className="mb-4 flex items-center gap-2 font-semibold">
          <Bell className="h-4 w-4 text-accent" />
          Notifications
        </h2>
        {notificationsList.length === 0 ? (
          <p className="text-sm text-muted-foreground">No notifications found.</p>
        ) : (
          <div className="divide-y">
            {notificationsList.slice(0, 8).map((notification) => (
              <div
                key={notification.id}
                className="flex flex-wrap items-start justify-between gap-3 py-3"
              >
                <div>
                  <div className="font-medium">{notification.title}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {new Date(notification.created_at).toLocaleString()}
                  </div>
                </div>
                {!notification.is_read && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={markRead.isPending}
                    onClick={() => markRead.mutate(notification.id)}
                  >
                    Mark read
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-medium">
              <GraduationCap className="h-4 w-4 text-accent" />
              Placement drives
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              View live drive schedules, registration deadlines, and published requirements.
            </p>
          </div>
          <Link to="/student/drives">
            <Button variant="outline">
              <CalendarCheck className="mr-2 h-4 w-4" />
              View drives
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
