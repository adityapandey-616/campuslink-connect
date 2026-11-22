import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2, Globe2, Mail, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Empty, Loading, PageHeader } from "@/components/AppShell";
import { myCompanyQuery } from "@/lib/recruiter-data";

export const Route = createFileRoute("/_authenticated/recruiter/company")({
  component: CompanyProfile,
});

function CompanyProfile() {
  const company = useQuery(myCompanyQuery);

  if (company.isLoading) return <Loading />;
  if (company.error) {
    return (
      <Empty>
        Company profile could not be loaded:{" "}
        {company.error instanceof Error ? company.error.message : "Unknown Supabase error"}
      </Empty>
    );
  }
  if (!company.data) return <Empty>Your recruiter account is not linked to a company.</Empty>;

  const profile = company.data;

  return (
    <>
      <PageHeader
        title="Company profile"
        subtitle="Live company record. This recruiter view is read-only until company update permissions are confirmed against deployed RLS."
      />
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <section className="rounded-lg border bg-card p-5 text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-2xl bg-accent/10 text-accent">
            <Building2 className="h-9 w-9" />
          </div>
          <div className="mt-4 font-semibold">{profile.name}</div>
          <div className="mt-1 text-sm text-muted-foreground">
            {profile.industry} · {profile.location}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Logo upload, company size, and named recruiter contacts are not represented in the
            current generated companies type.
          </p>
        </section>
        <section className="rounded-lg border bg-card p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="company-name">Company name</Label>
              <Input id="company-name" value={profile.name ?? ""} readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input id="industry" value={profile.industry ?? ""} readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" value={profile.location ?? ""} readOnly />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Company description</Label>
              <Textarea id="description" value={profile.description ?? ""} readOnly rows={4} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">
                <Globe2 className="mr-2 inline h-4 w-4" />
                Website
              </Label>
              <Input id="website" type="url" value={profile.website ?? ""} readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-email">
                <Mail className="mr-2 inline h-4 w-4" />
                Company contact email
              </Label>
              <Input id="contact-email" type="email" value={profile.email ?? ""} readOnly />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="contact-phone">
                <Phone className="mr-2 inline h-4 w-4" />
                Company phone
              </Label>
              <Input id="contact-phone" value={profile.phone ?? ""} readOnly />
            </div>
          </div>
          <p className="mt-5 text-xs text-muted-foreground">
            To change these values, ask an admin to update the company record. Logo upload, company
            size, and named recruiter contacts are not represented in the current generated type.
          </p>
        </section>
      </div>
    </>
  );
}
