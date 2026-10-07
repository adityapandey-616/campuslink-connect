import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, CircleDollarSign, Search, Send, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Empty, Loading, PageHeader } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { companyJobsQuery, myCompanyQuery } from "@/lib/recruiter-data";
import { RECRUITER_STATUS_STYLES, formatDate } from "@/lib/recruiter-frontend";
import { updateMockOfferStatus } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/recruiter/offers")({
  component: RecruiterOffers,
});

const STATUS_OPTIONS = ["all", "released", "accepted", "declined", "pending"] as const;

type OfferFilter = (typeof STATUS_OPTIONS)[number];

function RecruiterOffers() {
  const company = useQuery(myCompanyQuery);
  const jobs = useQuery(companyJobsQuery(company.data?.id));
  const qc = useQueryClient();
  const [status, setStatus] = useState<OfferFilter>("all");
  const [search, setSearch] = useState("");

  const offers = useMemo(() => {
    const all = jobs.data?.flatMap((job) => job.applications.flatMap((application) => application.offers.map((offer) => ({ ...offer, application, job })))) ?? [];
    return all.filter((offer) => {
      const haystack = `${offer.application.student.full_name} ${offer.job.title}`.toLowerCase();
      return (status === "all" || offer.status === status) && haystack.includes(search.trim().toLowerCase());
    });
  }, [jobs.data, search, status]);

  async function updateStatus(offerId: string, nextStatus: string) {
    updateMockOfferStatus(offerId, nextStatus);
    toast.success(`Offer marked as ${nextStatus}.`);
    qc.invalidateQueries({ queryKey: ["company-jobs"] });
    qc.invalidateQueries({ queryKey: ["my-applications"] });
  }

  if (company.isLoading || jobs.isLoading) return <Loading />;
  if (!company.data) return <Empty>No company profile is linked to this recruiter account.</Empty>;

  return (
    <>
      <PageHeader title="Offer management" subtitle="Track offer details, outcomes, and next steps." />
      <div className="mb-5 flex flex-col gap-3 rounded-lg border bg-card p-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Search offers" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search candidate or role" className="pl-9" /></div>
        <select value={status} onChange={(event) => setStatus(event.target.value as OfferFilter)} className="h-9 rounded-md border bg-card px-3 text-sm">
          {STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option === "all" ? "All offer statuses" : option}</option>)}
        </select>
      </div>

      {offers.length === 0 ? <Empty><CircleDollarSign className="mx-auto mb-3 h-8 w-8" />No offers are available for the current view.</Empty> : (
        <div className="grid gap-3 lg:grid-cols-2">
          {offers.map((offer) => (
            <article key={offer.id} className="rounded-lg border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">{offer.application.student.full_name}</div>
                  <div className="text-sm text-muted-foreground">{offer.job.title} · {offer.application.student.branch}</div>
                </div>
                <span className={`rounded px-2 py-1 text-xs font-semibold capitalize ${RECRUITER_STATUS_STYLES[offer.status] ?? "bg-secondary"}`}>{offer.status}</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div><div className="text-muted-foreground">Package</div><div className="font-semibold">₹{offer.ctc_lpa} LPA</div></div>
                <div><div className="text-muted-foreground">Joining</div><div>{formatDate(offer.joining_date)}</div></div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {offer.status === "released" && <Button size="sm" onClick={() => updateStatus(offer.id, "accepted")}><CheckCircle2 className="mr-2 h-4 w-4" />Accept</Button>}
                {offer.status === "released" && <Button size="sm" variant="outline" onClick={() => updateStatus(offer.id, "declined")}><XCircle className="mr-2 h-4 w-4" />Decline</Button>}
                {offer.status === "pending" && <Button size="sm" onClick={() => updateStatus(offer.id, "released")}><Send className="mr-2 h-4 w-4" />Send offer</Button>}
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
