import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Briefcase, Calendar, CheckCircle2, ChevronDown, ChevronUp, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Empty, Loading, PageHeader } from "@/components/AppShell";
import { myApplicationsQuery } from "@/lib/student-data";
import { statusStyles } from "@/lib/campus";
import { updateMockOfferStatus, addMockNotification } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/student/applications")({
  component: Applications,
});

const STEPS = ["applied", "shortlisted", "interview", "offered", "joined"] as const;
const STATUS_TABS = ["all", "applied", "shortlisted", "interview", "offered", "joined", "rejected"] as const;

function Applications() {
  const apps = useQuery(myApplicationsQuery);
  const qc = useQueryClient();
  const [tab, setTab] = useState<(typeof STATUS_TABS)[number]>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const respond = useMutation({
    mutationFn: async ({ offerId, status, jobTitle, company }: { offerId: string; status: string; jobTitle: string; company: string }) => {
      updateMockOfferStatus(offerId, status);
      addMockNotification({
        title: status === "accepted" ? `Offer Accepted — ${company}` : `Offer Declined — ${company}`,
        body: status === "accepted"
          ? `You have accepted the offer for ${jobTitle} at ${company}. Congratulations! 🎉`
          : `You have declined the offer for ${jobTitle} at ${company}.`,
        category: "offer",
      });
    },
    onSuccess: (_d, vars) => {
      toast.success(vars.status === "accepted" ? "🎉 Offer accepted! Congratulations!" : "Offer declined.");
      qc.invalidateQueries({ queryKey: ["my-applications"] });
      qc.invalidateQueries({ queryKey: ["me-student"] });
      qc.invalidateQueries({ queryKey: ["mock-notifications"] });
    },
    onError: () => {
      toast.error("Something went wrong. Please try again.");
    },
  });

  if (apps.isLoading) return <Loading />;

  const list = apps.data ?? [];
  const filtered = tab === "all" ? list : list.filter((a) => a.status === tab);
  const counts = STATUS_TABS.reduce<Record<string, number>>((acc, s) => {
    acc[s] = s === "all" ? list.length : list.filter((a) => a.status === s).length;
    return acc;
  }, {});

  return (
    <>
      <PageHeader
        title="Applications & Offers"
        subtitle="Track every application from submission to joining."
      />

      {/* Summary stats */}
      {list.length > 0 && (
        <div className="mb-5 grid gap-3 grid-cols-2 sm:grid-cols-4">
          {(["applied", "shortlisted", "interview", "offered"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setTab(s)}
              className={`rounded-lg border p-3 text-left transition-colors hover:border-accent/50 ${tab === s ? "border-accent/50 bg-accent/5" : "bg-card"}`}
            >
              <div className={`font-display text-2xl font-bold ${statusStyles[s]?.includes("accent") ? "text-accent" : statusStyles[s]?.includes("success") ? "text-success" : ""}`}>
                {counts[s]}
              </div>
              <div className="text-xs text-muted-foreground capitalize mt-0.5">{s}</div>
            </button>
          ))}
        </div>
      )}

      {/* Status tabs */}
      <div className="mb-5 flex gap-1 overflow-x-auto rounded-lg border bg-card p-1 w-fit max-w-full">
        {STATUS_TABS.filter((t) => t === "all" || counts[t]! > 0).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
              tab === t ? "bg-accent text-accent-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "all" ? `All (${list.length})` : `${t} (${counts[t]})`}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {list.length === 0 && (
        <Empty>
          <Briefcase className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <div className="font-medium">No applications yet.</div>
          <div className="mt-1 text-muted-foreground">
            Head to <a href="/student/opportunities" className="text-accent underline">Opportunities</a> to find your best matches and apply.
          </div>
        </Empty>
      )}

      {filtered.length === 0 && list.length > 0 && (
        <Empty>No applications with status "{tab}" yet.</Empty>
      )}

      {/* Application cards */}
      <div className="space-y-3">
        {filtered.map((a) => {
          const stepIdx = STEPS.indexOf(a.status as typeof STEPS[number]);
          const offer = Array.isArray(a.offers) && a.offers.length > 0 ? a.offers[0] : null;
          const isExpanded = expandedId === a.id;
          const hasDetails = a.interviews.length > 0 || offer;

          return (
            <div
              key={a.id}
              className={`rounded-lg border bg-card transition-colors ${a.status === "offered" ? "border-success/40" : ""}`}
            >
              {/* Card header */}
              <div className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold">{a.job?.title}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">
                      {a.job?.company?.name} · {a.job?.location} · ₹{a.job?.ctc_lpa} LPA
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Applied {new Date(a.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })} · Match {a.match_score}%
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded px-2.5 py-0.5 text-xs font-semibold capitalize ${statusStyles[a.status] ?? "bg-secondary"}`}>
                      {a.status}
                    </span>
                    {hasDetails && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : a.id)}
                        className="rounded-md border p-1 hover:bg-secondary"
                        aria-label={isExpanded ? "Collapse" : "Expand"}
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Journey progress bar */}
                {a.status !== "rejected" && (
                  <div className="mt-4">
                    <div className="flex gap-1">
                      {STEPS.map((s, i) => (
                        <div key={s} className="flex-1">
                          <div
                            className={`h-1.5 rounded-full transition-all ${
                              i <= stepIdx ? "bg-accent" : "bg-muted"
                            }`}
                          />
                          <div className="mt-1 text-[10px] capitalize text-muted-foreground">{s}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {a.status === "rejected" && (
                  <div className="mt-3 rounded-md bg-destructive/5 px-3 py-2 text-xs text-destructive">
                    This application was not taken forward. Keep applying — every attempt is a learning experience.
                  </div>
                )}
              </div>

              {/* Expandable details */}
              {isExpanded && (
                <div className="border-t px-4 pb-4 pt-3 space-y-3">
                  {/* Interviews */}
                  {a.interviews.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        Interviews
                      </div>
                      <div className="space-y-2">
                        {a.interviews.map((i) => (
                          <div
                            key={i.id}
                            className={`flex flex-wrap items-start justify-between gap-3 rounded-md border p-3 text-sm ${
                              new Date(i.scheduled_at) > new Date()
                                ? "border-warning/30 bg-warning/5"
                                : "bg-secondary/50"
                            }`}
                          >
                            <div>
                              <div className="font-medium">{i.round}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {i.mode} · {i.location}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-1.5 text-sm font-medium">
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                {new Date(i.scheduled_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                <Clock className="h-3 w-3" />
                                {new Date(i.scheduled_at).toLocaleTimeString(undefined, { timeStyle: "short" })}
                              </div>
                              <span className={`inline-block mt-1 rounded px-1.5 py-0.5 text-[10px] capitalize ${
                                i.status === "scheduled" ? "bg-warning/20 text-warning-foreground" : "bg-secondary text-muted-foreground"
                              }`}>
                                {i.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Offer section */}
                  {offer && (
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        Offer Letter
                      </div>
                      <div className="rounded-md border border-success/30 bg-success/5 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-success" />
                              <span className="font-semibold text-success">
                                ₹{offer.ctc_lpa} LPA
                              </span>
                            </div>
                            <div className="mt-1 text-sm text-muted-foreground">
                              Joining: {offer.joining_date ?? "TBD"} · Status:{" "}
                              <span className="capitalize font-medium">{offer.status}</span>
                            </div>
                          </div>
                          {offer.status === "released" && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() =>
                                  respond.mutate({
                                    offerId: offer.id,
                                    status: "accepted",
                                    jobTitle: a.job?.title ?? "",
                                    company: a.job?.company?.name ?? "",
                                  })
                                }
                                disabled={respond.isPending}
                              >
                                Accept Offer
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  respond.mutate({
                                    offerId: offer.id,
                                    status: "declined",
                                    jobTitle: a.job?.title ?? "",
                                    company: a.job?.company?.name ?? "",
                                  })
                                }
                                disabled={respond.isPending}
                              >
                                Decline
                              </Button>
                            </div>
                          )}
                          {offer.status === "accepted" && (
                            <span className="rounded-full bg-success px-3 py-1 text-xs text-white font-medium">
                              🎉 Accepted
                            </span>
                          )}
                          {offer.status === "declined" && (
                            <span className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
                              Declined
                            </span>
                          )}
                        </div>

                        {offer.status === "released" && (
                          <p className="mt-3 text-xs text-muted-foreground">
                            Please accept or decline the offer. Accepting will update your placement status to "Placed".
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Quick expand hint for cards with interviews/offers */}
              {!isExpanded && hasDetails && (
                <div
                  className="flex cursor-pointer items-center gap-1 border-t px-4 py-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setExpandedId(a.id)}
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                  {a.interviews.length > 0 && `${a.interviews.length} interview${a.interviews.length > 1 ? "s" : ""}`}
                  {a.interviews.length > 0 && offer && " · "}
                  {offer && "Offer letter available"}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
