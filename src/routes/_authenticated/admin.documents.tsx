import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Empty, Loading, PageHeader } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { adminOverviewQuery, type AdminOffer } from "@/lib/admin-live-data";

const EMPTY_OFFERS: AdminOffer[] = [];

export const Route = createFileRoute("/_authenticated/admin/documents")({
  head: () => ({ meta: [{ title: "Offers & Documents — Skill to Hire Admin" }] }),
  component: AdminOffersAndDocumentsPage,
});

function AdminOffersAndDocumentsPage() {
  const query = useQuery(adminOverviewQuery);
  const [search, setSearch] = useState("");
  const offers = query.data?.offers ?? EMPTY_OFFERS;
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return offers.filter((offer) =>
      `${offer.student_name} ${offer.company_name} ${offer.opportunity_title}`
        .toLowerCase()
        .includes(needle),
    );
  }, [offers, search]);

  if (query.isLoading) return <Loading />;
  if (query.error) {
    return (
      <Empty>
        Live offers could not be loaded:{" "}
        {query.error instanceof Error ? query.error.message : "Unknown Supabase error"}
      </Empty>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Offers & Documents"
        subtitle="Offers are listed from live records. Admin offer changes are read-only until write RLS is verified."
      />
      <section className="space-y-4">
        <h2 className="font-semibold">Offers ({offers.length})</h2>
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search student, company, or opportunity"
          aria-label="Search offers"
          className="max-w-lg"
        />
        {filtered.length === 0 ? (
          <Empty>{offers.length ? "No offers match." : "No live offer records found."}</Empty>
        ) : (
          <div className="overflow-x-auto rounded-lg border bg-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-secondary/60 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-3">Student</th>
                  <th className="p-3">Company / opportunity</th>
                  <th className="p-3">Salary</th>
                  <th className="p-3">Joining date</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((offer) => (
                  <tr key={offer.id}>
                    <td className="p-3">{offer.student_name}</td>
                    <td className="p-3">
                      <div>{offer.company_name}</div>
                      <div className="text-xs text-muted-foreground">{offer.opportunity_title}</div>
                    </td>
                    <td className="p-3">{offer.salary} (unit not verified)</td>
                    <td className="p-3">
                      {offer.joining_date
                        ? new Date(offer.joining_date).toLocaleDateString()
                        : "Not set"}
                    </td>
                    <td className="p-3">
                      <Badge variant="outline">{offer.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section className="rounded-xl border border-dashed bg-muted/20 p-4">
        <h2 className="font-semibold">Document verification unavailable</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The live student/document relationship and a secure storage bucket/policy have not been
          verified. No sample documents or local mock records are shown.
        </p>
      </section>
    </div>
  );
}
