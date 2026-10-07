import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Award,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck2,
  FileText,
  Filter,
  GraduationCap,
  Search,
  UserCheck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Empty, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getAdminDocuments,
  updateAdminDocumentStatus,
  getAdminOffers,
  updateAdminOfferStatus,
  type AdminDocumentItem,
  type AdminOfferItem,
} from "@/lib/admin-data";

export const Route = createFileRoute("/_authenticated/admin/documents")({
  head: () => ({ meta: [{ title: "Offers & Documents Verification — CAMPUSLINK Admin" }] }),
  component: AdminOffersAndDocumentsPage,
});

export function AdminOffersAndDocumentsPage() {
  const [activeTab, setActiveTab] = useState<"documents" | "offers">("documents");
  const [documents, setDocuments] = useState<AdminDocumentItem[]>(() => getAdminDocuments());
  const [offers, setOffers] = useState<AdminOfferItem[]>(() => getAdminOffers());

  const [docSearch, setDocSearch] = useState("");
  const [docStatusFilter, setDocStatusFilter] = useState("all");
  const [offerSearch, setOfferSearch] = useState("");
  const [offerStatusFilter, setOfferStatusFilter] = useState("all");

  const [rejectingDoc, setRejectingDoc] = useState<AdminDocumentItem | null>(null);
  const [previewDoc, setPreviewDoc] = useState<AdminDocumentItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const pendingDocsCount = useMemo(() => {
    return documents.filter((d) => d.status === "pending").length;
  }, [documents]);

  const filteredDocs = useMemo(() => {
    return documents.filter((d) => {
      const q = docSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        d.student_name.toLowerCase().includes(q) ||
        d.student_roll.toLowerCase().includes(q) ||
        d.doc_type.toLowerCase().includes(q);

      const matchesStatus = docStatusFilter === "all" || d.status === docStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [documents, docSearch, docStatusFilter]);

  const filteredOffers = useMemo(() => {
    return offers.filter((o) => {
      const q = offerSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        o.student_name.toLowerCase().includes(q) ||
        o.company_name.toLowerCase().includes(q) ||
        o.job_title.toLowerCase().includes(q) ||
        o.student_roll.toLowerCase().includes(q);

      const matchesStatus = offerStatusFilter === "all" || o.offer_status === offerStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [offers, offerSearch, offerStatusFilter]);

  const handleVerifyDocument = (docId: string) => {
    const updated = updateAdminDocumentStatus(docId, "verified");
    setDocuments(updated);
    toast.success("Document verified and approved!");
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingDoc) return;
    const reason = rejectReason.trim() || "Missing authorized institutional seal or blurred scan.";
    const updated = updateAdminDocumentStatus(rejectingDoc.id, "rejected", reason);
    setDocuments(updated);
    setRejectingDoc(null);
    setRejectReason("");
    toast.warning("Document rejected. Feedback sent to student.");
  };

  const handleUpdateOffer = (
    offerId: string,
    offer_status: AdminOfferItem["offer_status"],
    joining_status?: AdminOfferItem["joining_status"]
  ) => {
    const updated = updateAdminOfferStatus(offerId, offer_status, joining_status);
    setOffers(updated);
    toast.success(`Offer status updated to ${offer_status}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Offers & Document Verification"
        subtitle="Manage student academic credential verifications, offer release tracking, and joining status confirmation."
      />

      {/* Tabs Selector */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab("documents")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
            activeTab === "documents"
              ? "border-accent text-accent"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileCheck2 className="h-4 w-4" />
          <span>Credential Documents</span>
          {pendingDocsCount > 0 && (
            <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-bold">
              {pendingDocsCount}
            </Badge>
          )}
        </button>
        <button
          onClick={() => setActiveTab("offers")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
            activeTab === "offers"
              ? "border-accent text-accent"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Award className="h-4 w-4" />
          <span>Offers & Joining Confirmation</span>
          <Badge variant="outline" className="text-[10px] py-0 px-1.5">
            {offers.length}
          </Badge>
        </button>
      </div>

      {/* Tab 1: Documents Verification */}
      {activeTab === "documents" && (
        <div className="space-y-4">
          {/* Search & Filter */}
          <div className="rounded-xl border bg-card p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={docSearch}
                onChange={(e) => setDocSearch(e.target.value)}
                placeholder="Search candidate or document type..."
                className="pl-9 h-9 text-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={docStatusFilter}
                onChange={(e) => setDocStatusFilter(e.target.value)}
                className="h-9 rounded-md border bg-card px-2.5 text-xs text-foreground"
              >
                <option value="all">All Verification Statuses</option>
                <option value="pending">Pending Review</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {filteredDocs.length === 0 ? (
            <Empty>No documents found matching the filter.</Empty>
          ) : (
            <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-secondary/60 text-muted-foreground uppercase text-[11px] tracking-wider border-b">
                  <tr>
                    <th className="p-3.5">Student</th>
                    <th className="p-3.5">Document Type</th>
                    <th className="p-3.5">Submitted On</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-muted/40 transition-colors">
                      <td className="p-3.5 font-medium text-foreground">
                        <div className="font-semibold text-sm">{doc.student_name}</div>
                        <div className="text-[11px] text-muted-foreground font-mono">
                          {doc.student_roll} · {doc.student_branch}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-medium text-foreground">{doc.doc_type}</div>
                        {doc.rejection_reason && (
                          <div className="text-[11px] text-destructive mt-0.5">
                            Reason: {doc.rejection_reason}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 text-muted-foreground">
                        {new Date(doc.submitted_at).toLocaleDateString([], { dateStyle: "medium" })}
                      </td>
                      <td className="p-3.5">
                        <Badge
                          variant={
                            doc.status === "verified"
                              ? "default"
                              : doc.status === "pending"
                              ? "secondary"
                              : "destructive"
                          }
                          className="capitalize text-[11px] py-0 px-2"
                        >
                          {doc.status}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-right space-x-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs px-2"
                          onClick={() => setPreviewDoc(doc)}
                        >
                          Preview
                        </Button>
                        {doc.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              className="h-7 text-xs px-2.5 bg-success text-primary-foreground hover:bg-success/90"
                              onClick={() => handleVerifyDocument(doc.id)}
                            >
                              Verify
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs px-2 text-destructive border-destructive/30"
                              onClick={() => {
                                setRejectingDoc(doc);
                                setRejectReason("");
                              }}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Offers & Joining Management */}
      {activeTab === "offers" && (
        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={offerSearch}
                onChange={(e) => setOfferSearch(e.target.value)}
                placeholder="Search candidate, company, role..."
                className="pl-9 h-9 text-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={offerStatusFilter}
                onChange={(e) => setOfferStatusFilter(e.target.value)}
                className="h-9 rounded-md border bg-card px-2.5 text-xs text-foreground"
              >
                <option value="all">All Offer Statuses</option>
                <option value="released">Released</option>
                <option value="accepted">Accepted</option>
                <option value="declined">Declined</option>
                <option value="revoked">Revoked</option>
              </select>
            </div>
          </div>

          {filteredOffers.length === 0 ? (
            <Empty>No offers found.</Empty>
          ) : (
            <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-secondary/60 text-muted-foreground uppercase text-[11px] tracking-wider border-b">
                  <tr>
                    <th className="p-3.5">Candidate</th>
                    <th className="p-3.5">Company & Role</th>
                    <th className="p-3.5">CTC (LPA)</th>
                    <th className="p-3.5">Offer Date</th>
                    <th className="p-3.5">Offer Status</th>
                    <th className="p-3.5">Joining Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredOffers.map((o) => (
                    <tr key={o.id} className="hover:bg-muted/40 transition-colors">
                      <td className="p-3.5 font-medium text-foreground">
                        <div className="font-semibold text-sm">{o.student_name}</div>
                        <div className="text-[11px] text-muted-foreground font-mono">
                          {o.student_roll} · {o.student_branch}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-foreground">{o.company_name}</div>
                        <div className="text-[11px] text-muted-foreground">{o.job_title}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-success text-sm">₹{o.ctc_lpa} LPA</span>
                      </td>
                      <td className="p-3.5 text-muted-foreground">{o.offer_date}</td>
                      <td className="p-3.5">
                        <Badge
                          variant={
                            o.offer_status === "accepted"
                              ? "default"
                              : o.offer_status === "released"
                              ? "secondary"
                              : "destructive"
                          }
                          className="capitalize text-[10px]"
                        >
                          {o.offer_status}
                        </Badge>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`capitalize font-medium ${
                            o.joining_status === "joined"
                              ? "text-success"
                              : o.joining_status === "deferred"
                              ? "text-warning"
                              : "text-muted-foreground"
                          }`}
                        >
                          {o.joining_status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1">
                        <select
                          value={o.joining_status}
                          onChange={(e) => handleUpdateOffer(o.id, o.offer_status, e.target.value as any)}
                          className="h-7 rounded-md border bg-card px-2 text-xs capitalize"
                        >
                          <option value="pending">Pending</option>
                          <option value="joined">Joined</option>
                          <option value="deferred">Deferred</option>
                          <option value="reneged">Reneged</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Reject Reason Dialog */}
      {rejectingDoc && (
        <Dialog open={!!rejectingDoc} onOpenChange={() => setRejectingDoc(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Reject Document Submission</DialogTitle>
              <DialogDescription className="text-xs">
                Provide feedback to {rejectingDoc.student_name} explaining why their {rejectingDoc.doc_type} was rejected.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleConfirmReject} className="space-y-3 text-xs pt-1">
              <div>
                <label className="font-medium text-foreground">Rejection Reason</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Scan is illegible, please upload high-res PDF with official seal..."
                  rows={3}
                  className="w-full rounded-md border bg-card p-2 text-xs text-foreground mt-1"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setRejectingDoc(null)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" variant="destructive">
                  Confirm Rejection
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Document Simulated Preview Dialog */}
      {previewDoc && (
        <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-base flex items-center justify-between pr-4">
                <span>{previewDoc.doc_type}</span>
                <Badge variant="outline" className="text-xs capitalize">{previewDoc.status}</Badge>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Candidate: {previewDoc.student_name} ({previewDoc.student_roll} · {previewDoc.student_branch})
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="rounded-xl border border-dashed bg-secondary/30 p-8 text-center space-y-2">
                <FileText className="mx-auto h-12 w-12 text-accent/60" />
                <div className="font-semibold text-foreground text-sm">{previewDoc.doc_type}.pdf</div>
                <p className="text-muted-foreground text-xs">
                  Submitted on {new Date(previewDoc.submitted_at).toLocaleString()}
                </p>
                <div className="pt-2">
                  <Badge variant="secondary" className="text-[11px]">Simulated Secure Document Viewer</Badge>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button size="sm" variant="outline" onClick={() => setPreviewDoc(null)}>
                  Close
                </Button>
                {previewDoc.status === "pending" && (
                  <Button
                    size="sm"
                    className="bg-success text-primary-foreground hover:bg-success/90"
                    onClick={() => {
                      handleVerifyDocument(previewDoc.id);
                      setPreviewDoc(null);
                    }}
                  >
                    Verify & Sign Off
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
