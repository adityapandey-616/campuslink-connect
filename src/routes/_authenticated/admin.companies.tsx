import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Edit2,
  ExternalLink,
  MapPin,
  Plus,
  Search,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { Empty, Loading, PageHeader } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import {
  adminCompaniesQuery,
  adminOpportunitiesQuery,
  adminRecruitersQuery,
  type AdminCompany,
} from "@/lib/admin-live-data";

const EMPTY_COMPANIES: AdminCompany[] = [];

export const Route = createFileRoute("/_authenticated/admin/companies")({
  head: () => ({ meta: [{ title: "Company Management — Skill to Hire Admin" }] }),
  component: AdminCompaniesPage,
});

function AdminCompaniesPage() {
  const queryClient = useQueryClient();
  const directory = useQuery(adminCompaniesQuery);
  const opportunityQuery = useQuery(adminOpportunitiesQuery);
  const recruiterQuery = useQuery(adminRecruitersQuery);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<AdminCompany | null>(null);
  const [assigningCompany, setAssigningCompany] = useState<AdminCompany | null>(null);
  const [selectedRecruiterId, setSelectedRecruiterId] = useState<string>("");

  const recruiters = recruiterQuery.data ?? [];
  const companies = directory.data ?? EMPTY_COMPANIES;
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return companies.filter((company) => {
      const matchesSearch =
        !needle ||
        company.name.toLowerCase().includes(needle) ||
        company.industry.toLowerCase().includes(needle) ||
        company.location.toLowerCase().includes(needle) ||
        (company.email ?? "").toLowerCase().includes(needle);
      return matchesSearch && (statusFilter === "all" || company.status === statusFilter);
    });
  }, [companies, search, statusFilter]);

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from("companies")
        .update({ status })
        .eq("id", id)
        .select("id")
        .maybeSingle();
      if (error) throw new Error(`Could not update company status: ${error.message}`);
      if (!data) throw new Error("No company was updated under the current permissions.");
    },
    onSuccess: () => {
      toast.success("Company status updated.");
      queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
      queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not update company status."),
  });

  const createCompany = useMutation({
    mutationFn: async (fields: CompanyFormFields) => {
      const { error } = await supabase.from("companies").insert({ ...fields, status: "active" });
      if (error) throw new Error(`Could not create company: ${error.message}`);
    },
    onSuccess: () => {
      toast.success("Company added.");
      setCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
      queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not create company."),
  });

  const updateCompany = useMutation({
    mutationFn: async ({ id, fields }: { id: string; fields: CompanyFormFields }) => {
      const { data, error } = await supabase
        .from("companies")
        .update(fields)
        .eq("id", id)
        .select("id")
        .maybeSingle();
      if (error) throw new Error(`Could not update company: ${error.message}`);
      if (!data) throw new Error("No company was updated under the current permissions.");
    },
    onSuccess: () => {
      toast.success("Company record updated.");
      setEditingCompany(null);
      queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
      queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not update company."),
  });

  const assignRecruiter = useMutation({
    mutationFn: async ({ userId, companyId }: { userId: string; companyId: string }) => {
      const { data, error } = await supabase
        .from("recruiters")
        .upsert(
          {
            user_id: userId,
            company_id: companyId,
          },
          { onConflict: "user_id" },
        )
        .select("user_id")
        .maybeSingle();
      if (error) throw new Error(`Could not update recruiter assignment: ${error.message}`);
      if (!data) throw new Error("No recruiter was updated under the current permissions.");
    },
    onSuccess: () => {
      toast.success("Recruiter assignment updated.");
      setAssigningCompany(null);
      setSelectedRecruiterId("");
      queryClient.invalidateQueries({ queryKey: ["admin-recruiters"] });
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "Could not assign recruiter to company.",
      ),
  });

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    if (!name) {
      toast.error("Company name is required.");
      return;
    }
    const website = String(formData.get("website") ?? "").trim();
    if (website && !/^https?:\/\/.+/i.test(website)) {
      toast.error("Website must start with http:// or https://.");
      return;
    }
    const fields: CompanyFormFields = {
      name,
      industry: String(formData.get("industry") ?? "").trim(),
      location: String(formData.get("location") ?? "").trim(),
      website: website || null,
      description: String(formData.get("description") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      tier: String(formData.get("tier") ?? "").trim() || null,
    };
    if (editingCompany) updateCompany.mutate({ id: editingCompany.id, fields });
    else createCompany.mutate(fields);
  };

  if (directory.isLoading) return <Loading />;
  if (directory.error) {
    return (
      <Empty>
        Company records could not be loaded:{" "}
        {directory.error instanceof Error ? directory.error.message : "Unknown Supabase error"}
      </Empty>
    );
  }

  const opportunities = opportunityQuery.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Partner Companies"
        subtitle="Manage company records and supported contact fields. Recruiter assignments and drive/offer totals are not joined into this directory."
        action={
          <Button
            size="sm"
            onClick={() => {
              setEditingCompany(null);
              setCreateOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Company
          </Button>
        }
      />

      {recruiterQuery.error && (
        <p role="alert" className="text-sm text-destructive">
          Recruiter assignments could not be loaded:{" "}
          {recruiterQuery.error instanceof Error
            ? recruiterQuery.error.message
            : "Unknown Supabase error"}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Companies</div>
          <div className="mt-1 text-2xl font-semibold">{companies.length}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm text-muted-foreground">Opportunities</div>
          <div className="mt-1 text-2xl font-semibold">
            {opportunityQuery.isLoading
              ? "Loading"
              : opportunityQuery.error
                ? "Unavailable"
                : opportunities.length}
          </div>
        </div>
      </div>
      {opportunityQuery.error && (
        <p className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-muted-foreground">
          Opportunities could not be read under the current RLS policy:{" "}
          {opportunityQuery.error instanceof Error
            ? opportunityQuery.error.message
            : "Unknown Supabase error"}
          . Company records remain available below.
        </p>
      )}

      <div className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-[1fr_220px]">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search company, industry, location, or contact email"
            className="pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="all">All statuses</option>
          {[...new Set(companies.map((company) => company.status).filter(Boolean))].map(
            (status) => (
              <option key={status} value={status ?? ""}>
                {status}
              </option>
            ),
          )}
        </select>
      </div>

      {filtered.length === 0 ? (
        <Empty>
          {companies.length ? "No companies match your filters." : "No companies found."}
        </Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((company) => {
            const opportunityCount = opportunities.filter(
              (opportunity) => opportunity.company_id === company.id,
            ).length;
            const assignedRecruiters = recruiters.filter((r) => r.company_id === company.id);
            return (
              <article key={company.id} className="rounded-xl border bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate font-semibold">{company.name}</h2>
                      <p className="text-xs text-muted-foreground">{company.industry}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{company.status ?? "No status"}</Badge>
                </div>
                <p className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {company.location}
                </p>
                <p className="mt-2 line-clamp-3 min-h-12 text-sm text-muted-foreground">
                  {company.description || "No description provided."}
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
                  <span className="text-xs text-muted-foreground">
                    {opportunityQuery.error
                      ? "Opportunity count unavailable"
                      : `${opportunityCount} opportunities`}{" "}
                    · {company.tier ?? "Tier not set"}
                  </span>
                  <div className="flex items-center gap-2">
                    <select
                      aria-label={`Update ${company.name} status`}
                      value={company.status ?? ""}
                      disabled={updateStatus.isPending}
                      onChange={(event) =>
                        updateStatus.mutate({ id: company.id, status: event.target.value })
                      }
                      className="h-8 rounded-md border bg-background px-2 text-xs"
                    >
                      {company.status && <option value={company.status}>{company.status}</option>}
                      {["active", "under_review", "inactive"]
                        .filter((status) => status !== company.status)
                        .map((status) => (
                          <option key={status} value={status}>
                            {status.replace("_", " ")}
                          </option>
                        ))}
                    </select>
                    <Button size="sm" variant="outline" onClick={() => setEditingCompany(company)}>
                      <Edit2 className="mr-1 h-3 w-3" />
                      Edit
                    </Button>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t pt-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5 truncate">
                    <UserCheck className="h-3.5 w-3.5 shrink-0 text-accent" />
                    <span className="truncate">
                      {assignedRecruiters.length
                        ? assignedRecruiters.map((r) => r.full_name).join(", ")
                        : "No recruiter assigned"}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs text-accent"
                    disabled={recruiterQuery.isLoading || !!recruiterQuery.error}
                    onClick={() => {
                      setAssigningCompany(company);
                      setSelectedRecruiterId(assignedRecruiters[0]?.user_id ?? "");
                    }}
                  >
                    <UserPlus className="mr-1 h-3 w-3" />
                    Assign
                  </Button>
                </div>
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-xs text-accent hover:underline"
                  >
                    Website <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </article>
            );
          })}
        </div>
      )}

      <Dialog
        open={createOpen || !!editingCompany}
        onOpenChange={(open) => {
          if (!open) {
            setCreateOpen(false);
            setEditingCompany(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCompany ? `Edit ${editingCompany.name}` : "Add Company"}
            </DialogTitle>
          </DialogHeader>
          <form
            key={editingCompany?.id ?? "new-company"}
            onSubmit={handleCreate}
            className="grid gap-3 sm:grid-cols-2"
          >
            <Input
              name="name"
              placeholder="Company name *"
              defaultValue={editingCompany?.name}
              required
            />
            <Input name="industry" placeholder="Industry" defaultValue={editingCompany?.industry} />
            <Input name="location" placeholder="Location" defaultValue={editingCompany?.location} />
            <Input
              name="website"
              placeholder="https://example.com"
              type="url"
              defaultValue={editingCompany?.website ?? ""}
            />
            <Input
              name="email"
              placeholder="Contact email"
              type="email"
              defaultValue={editingCompany?.email ?? ""}
            />
            <Input
              name="phone"
              placeholder="Contact phone"
              defaultValue={editingCompany?.phone ?? ""}
            />
            <Input name="tier" placeholder="Tier" defaultValue={editingCompany?.tier ?? ""} />
            <textarea
              name="description"
              placeholder="Company description"
              defaultValue={editingCompany?.description ?? ""}
              className="min-h-20 rounded-md border bg-background px-3 py-2 text-sm sm:col-span-2"
            />
            <div className="flex justify-end gap-2 sm:col-span-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateOpen(false);
                  setEditingCompany(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createCompany.isPending || updateCompany.isPending}>
                {createCompany.isPending || updateCompany.isPending
                  ? "Saving..."
                  : editingCompany
                    ? "Save changes"
                    : "Create company"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!assigningCompany}
        onOpenChange={(open) => {
          if (!open) {
            setAssigningCompany(null);
            setSelectedRecruiterId("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Recruiter to {assigningCompany?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Select a recruiter account to link with <strong>{assigningCompany?.name}</strong>. The
              recruiter will be able to post jobs, manage applicants, and schedule interviews for
              this company.
            </p>
            <div className="space-y-2">
              <label htmlFor="select-recruiter" className="text-sm font-medium">
                Recruiter Account
              </label>
              <select
                id="select-recruiter"
                className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                value={selectedRecruiterId}
                onChange={(e) => setSelectedRecruiterId(e.target.value)}
              >
                <option value="">-- Choose a recruiter --</option>
                {recruiters.map((r) => {
                  const isCurrent = r.company_id === assigningCompany?.id;
                  const otherCompany =
                    r.company_id && !isCurrent
                      ? companies.find((c) => c.id === r.company_id)?.name
                      : null;
                  return (
                    <option key={r.user_id} value={r.user_id}>
                      {r.full_name} ({r.email}){" "}
                      {isCurrent
                        ? "— Currently assigned"
                        : otherCompany
                          ? `— Assigned to ${otherCompany}`
                          : "— Unassigned"}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setAssigningCompany(null);
                  setSelectedRecruiterId("");
                }}
              >
                Cancel
              </Button>
              <Button
                disabled={!selectedRecruiterId || assignRecruiter.isPending}
                onClick={() => {
                  if (assigningCompany && selectedRecruiterId) {
                    assignRecruiter.mutate({
                      userId: selectedRecruiterId,
                      companyId: assigningCompany.id,
                    });
                  }
                }}
              >
                {assignRecruiter.isPending ? "Assigning..." : "Confirm Assignment"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface CompanyFormFields {
  name: string;
  industry: string;
  location: string;
  website: string | null;
  description: string;
  email: string | null;
  phone: string | null;
  tier: string | null;
}
