import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  User,
  X,
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
  getAdminCompanies,
  updateAdminCompanyStatus,
  addAdminCompany,
  getAdminDrives,
  type AdminCompany,
} from "@/lib/admin-data";
import { getMockJobs, getMockApplications } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/admin/companies")({
  head: () => ({ meta: [{ title: "Company Management — CAMPUSLINK Admin" }] }),
  component: AdminCompaniesPage,
});

export function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<AdminCompany[]>(() => getAdminCompanies());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [industryFilter, setIndustryFilter] = useState<string>("all");
  const [selectedCompany, setSelectedCompany] = useState<AdminCompany | null>(null);
  const [isNewCompanyOpen, setIsNewCompanyOpen] = useState(false);

  // Cross-reference data
  const jobs = useMemo(() => getMockJobs(), []);
  const drives = useMemo(() => getAdminDrives(), []);
  const applications = useMemo(() => getMockApplications(), []);

  // Compute stats for each company
  const companyCards = useMemo(() => {
    return companies.map((c) => {
      const companyJobs = jobs.filter((j) => j.company_id === c.id);
      const companyDrives = drives.filter((d) => d.company_id === c.id);
      const companyApps = applications.filter((a) => a.job?.company_id === c.id);
      const companyOffers = companyApps.filter((a) => a.status === "offered" || a.status === "joined");

      return {
        ...c,
        jobCount: companyJobs.length,
        driveCount: companyDrives.length,
        appCount: companyApps.length,
        offerCount: companyOffers.length,
        jobs: companyJobs,
        drives: companyDrives,
      };
    });
  }, [companies, jobs, drives, applications]);

  const industries = useMemo(() => {
    return Array.from(new Set(companies.map((c) => c.industry))).sort();
  }, [companies]);

  const filtered = useMemo(() => {
    return companyCards.filter((c) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.recruiter_name.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q);

      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      const matchesIndustry = industryFilter === "all" || c.industry === industryFilter;

      return matchesSearch && matchesStatus && matchesIndustry;
    });
  }, [companyCards, search, statusFilter, industryFilter]);

  const handleStatusUpdate = (companyId: string, newStatus: AdminCompany["status"]) => {
    const updated = updateAdminCompanyStatus(companyId, newStatus);
    setCompanies(updated);
    if (selectedCompany?.id === companyId) {
      setSelectedCompany({ ...selectedCompany, status: newStatus });
    }
    toast.success(`Company status updated to "${newStatus.replace("_", " ")}"`);
  };

  const handleCreateCompany = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") || "").trim();
    const industry = String(fd.get("industry") || "").trim();
    const location = String(fd.get("location") || "").trim();
    const website = String(fd.get("website") || "").trim();
    const description = String(fd.get("description") || "").trim();
    const recruiter_name = String(fd.get("recruiter_name") || "").trim();
    const recruiter_email = String(fd.get("recruiter_email") || "").trim();
    const recruiter_phone = String(fd.get("recruiter_phone") || "").trim();
    const tier = (String(fd.get("tier") || "Tier 2 (Core)")) as AdminCompany["tier"];

    if (!name || !recruiter_name) {
      toast.error("Please provide company name and recruiter contact.");
      return;
    }

    const created = addAdminCompany({
      name,
      industry: industry || "Information Technology",
      location: location || "Bengaluru",
      website: website || "https://example.com",
      description: description || "Corporate recruitment partner",
      recruiter_name,
      recruiter_email: recruiter_email || "contact@example.com",
      recruiter_phone: recruiter_phone || "+91 98000 00000",
      status: "active",
      tier,
    });

    setCompanies(getAdminCompanies());
    setIsNewCompanyOpen(false);
    toast.success(`${created.name} added and activated for placement drives!`);
  };

  const selectedComputed = useMemo(() => {
    if (!selectedCompany) return null;
    return companyCards.find((c) => c.id === selectedCompany.id) ?? null;
  }, [selectedCompany, companyCards]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Partner Companies & Recruiters"
        subtitle="Manage campus recruiting partners, job listings, liaison contacts, and drive eligibility."
        action={
          <Button size="sm" onClick={() => setIsNewCompanyOpen(true)} className="gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" /> Add Company Partner
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="rounded-xl border bg-card p-4 shadow-xs">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by company, recruiter, industry, location..."
              className="pl-9 h-9 text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 w-full rounded-md border bg-card px-2.5 text-xs text-foreground"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Partners</option>
              <option value="under_review">Under Review</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <select
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="h-9 w-full rounded-md border bg-card px-2.5 text-xs text-foreground"
            >
              <option value="all">All Industries</option>
              {industries.map((ind) => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Company Cards Grid */}
      {filtered.length === 0 ? (
        <Empty>No companies match your search criteria.</Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <div
              key={c.id}
              onClick={() => setSelectedCompany(c)}
              className="group rounded-xl border bg-card p-5 shadow-xs hover:border-accent/60 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-accent/10 text-accent font-bold flex items-center justify-center shrink-0">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base text-foreground group-hover:text-accent transition-colors">
                        {c.name}
                      </h3>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" /> {c.location}
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant={
                      c.status === "active"
                        ? "default"
                        : c.status === "under_review"
                        ? "secondary"
                        : "destructive"
                    }
                    className="capitalize text-[10px] py-0 px-2"
                  >
                    {c.status.replace("_", " ")}
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
                  {c.description}
                </p>

                {/* Recruiter Details */}
                <div className="rounded-lg border bg-secondary/30 p-2.5 text-xs space-y-1 mb-4">
                  <div className="font-medium text-foreground flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    {c.recruiter_name}
                  </div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 truncate">
                    <Mail className="h-3 w-3" /> {c.recruiter_email}
                  </div>
                </div>
              </div>

              {/* Stats Footer */}
              <div>
                <div className="grid grid-cols-3 gap-2 pt-3 border-t text-center text-xs">
                  <div>
                    <div className="font-bold text-foreground">{c.jobCount}</div>
                    <div className="text-[10px] text-muted-foreground">Open Roles</div>
                  </div>
                  <div>
                    <div className="font-bold text-foreground">{c.driveCount}</div>
                    <div className="text-[10px] text-muted-foreground">Drives</div>
                  </div>
                  <div>
                    <div className="font-bold text-accent">{c.offerCount}</div>
                    <div className="text-[10px] text-muted-foreground">Offers</div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between pt-2">
                  <span className="text-[11px] text-muted-foreground">{c.tier}</span>
                  <Button size="sm" variant="ghost" className="h-7 text-xs px-2">
                    Manage Partner
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Company Detail Modal */}
      {selectedCompany && (
        <Dialog open={!!selectedCompany} onOpenChange={(open) => !open && setSelectedCompany(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex flex-wrap items-center justify-between gap-3 pr-6">
                <div>
                  <DialogTitle className="text-xl flex items-center gap-2">
                    {selectedCompany.name}
                    <Badge variant="outline" className="text-xs">{selectedCompany.industry}</Badge>
                  </DialogTitle>
                  <DialogDescription className="text-xs mt-1 flex items-center gap-2">
                    <span>{selectedCompany.location}</span>
                    <span>·</span>
                    <a
                      href={selectedCompany.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-accent hover:underline flex items-center gap-0.5"
                    >
                      <Globe className="h-3 w-3" /> Visit Website <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </DialogDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Status:</span>
                  <select
                    value={selectedCompany.status}
                    onChange={(e) => handleStatusUpdate(selectedCompany.id, e.target.value as any)}
                    className="h-8 rounded-md border bg-card px-2 text-xs font-semibold capitalize"
                  >
                    <option value="active">Active</option>
                    <option value="under_review">Under Review</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-5 pt-2 text-sm">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {selectedCompany.description}
              </p>

              {/* Recruiter Liaison Information */}
              <div className="rounded-lg border bg-secondary/30 p-4 space-y-2">
                <h4 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                  Recruiter Contact Information
                </h4>
                <div className="grid sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <div className="text-muted-foreground">Lead Recruiter</div>
                    <div className="font-semibold text-sm mt-0.5">{selectedCompany.recruiter_name}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Email</div>
                    <div className="font-medium text-foreground mt-0.5 truncate">{selectedCompany.recruiter_email}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Phone</div>
                    <div className="font-medium text-foreground mt-0.5">{selectedCompany.recruiter_phone}</div>
                  </div>
                </div>
              </div>

              {/* Active Jobs */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                    Active Job Openings ({selectedComputed?.jobs.length ?? 0})
                  </h4>
                </div>
                {(selectedComputed?.jobs ?? []).length === 0 ? (
                  <p className="text-xs text-muted-foreground">No active job listings for this company.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedComputed?.jobs.map((j) => (
                      <div key={j.id} className="flex items-center justify-between rounded-lg border p-3 text-xs">
                        <div>
                          <div className="font-semibold text-foreground">{j.title}</div>
                          <div className="text-muted-foreground text-[11px]">{j.location} · ₹{j.ctc_lpa} LPA · Cutoff: {j.min_cgpa} CGPA</div>
                        </div>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {j.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Associated Placement Drives */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                    Placement Drives ({selectedComputed?.drives.length ?? 0})
                  </h4>
                </div>
                {(selectedComputed?.drives ?? []).length === 0 ? (
                  <p className="text-xs text-muted-foreground">No placement drives scheduled yet.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedComputed?.drives.map((d) => (
                      <div key={d.id} className="flex items-center justify-between rounded-lg border p-3 text-xs">
                        <div>
                          <div className="font-semibold text-foreground">{d.title}</div>
                          <div className="text-muted-foreground text-[11px]">{d.drive_date} · {d.venue}</div>
                        </div>
                        <Badge variant="secondary" className="text-[10px] capitalize">
                          {d.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                {selectedCompany.status !== "active" ? (
                  <Button
                    size="sm"
                    onClick={() => handleStatusUpdate(selectedCompany.id, "active")}
                    className="gap-1.5"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Approve & Activate
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusUpdate(selectedCompany.id, "inactive")}
                    className="text-destructive border-destructive/30"
                  >
                    Deactivate Partner
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Add New Company Dialog */}
      <Dialog open={isNewCompanyOpen} onOpenChange={setIsNewCompanyOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Register Placement Partner</DialogTitle>
            <DialogDescription className="text-xs">
              Add a new hiring corporate partner and configure liaison recruiter details.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCompany} className="space-y-3.5 text-xs pt-1">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-foreground">Company Name *</label>
                <Input name="name" placeholder="e.g. Acme Tech Labs" required className="h-9 mt-1 text-xs" />
              </div>
              <div>
                <label className="font-medium text-foreground">Industry</label>
                <Input name="industry" placeholder="e.g. Enterprise Software" className="h-9 mt-1 text-xs" />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-foreground">Headquarters / Location</label>
                <Input name="location" placeholder="e.g. Bengaluru" className="h-9 mt-1 text-xs" />
              </div>
              <div>
                <label className="font-medium text-foreground">Website</label>
                <Input name="website" placeholder="https://example.com" className="h-9 mt-1 text-xs" />
              </div>
            </div>

            <div>
              <label className="font-medium text-foreground">Description</label>
              <Input name="description" placeholder="Brief company profile" className="h-9 mt-1 text-xs" />
            </div>

            <div className="grid sm:grid-cols-3 gap-3 pt-2 border-t">
              <div>
                <label className="font-medium text-foreground">Recruiter Name *</label>
                <Input name="recruiter_name" placeholder="Contact person" required className="h-9 mt-1 text-xs" />
              </div>
              <div>
                <label className="font-medium text-foreground">Email *</label>
                <Input name="recruiter_email" type="email" placeholder="recruiter@co.com" required className="h-9 mt-1 text-xs" />
              </div>
              <div>
                <label className="font-medium text-foreground">Phone</label>
                <Input name="recruiter_phone" placeholder="+91 98000 00000" className="h-9 mt-1 text-xs" />
              </div>
            </div>

            <div>
              <label className="font-medium text-foreground">Hiring Tier</label>
              <select name="tier" className="h-9 w-full rounded-md border bg-card px-2.5 text-xs text-foreground mt-1">
                <option value="Tier 1 (Dream)">Tier 1 (Dream - ₹10+ LPA)</option>
                <option value="Tier 2 (Core)">Tier 2 (Core - ₹6-10 LPA)</option>
                <option value="Tier 3 (Mass)">Tier 3 (Mass - ₹3.5-6 LPA)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsNewCompanyOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Register & Save
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
