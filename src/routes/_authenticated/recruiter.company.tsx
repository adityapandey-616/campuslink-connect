import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Building2, Globe2, Mail, MapPin, Phone, Save, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Empty, Loading, PageHeader } from "@/components/AppShell";
import { myCompanyQuery } from "@/lib/recruiter-data";
import { getStoredCompanyProfile, saveCompanyProfile } from "@/lib/recruiter-frontend";

export const Route = createFileRoute("/_authenticated/recruiter/company")({
  component: CompanyProfile,
});

function CompanyProfile() {
  const company = useQuery(myCompanyQuery);
  const qc = useQueryClient();
  const [profile, setProfile] = useState(() => getStoredCompanyProfile());
  const mutation = useMutation({
    mutationFn: async (next: typeof profile) => saveCompanyProfile(next),
    onSuccess: () => {
      toast.success("Company profile saved in demo mode.");
      qc.invalidateQueries({ queryKey: ["my-company"] });
    },
    onError: () => toast.error("Unable to save the company profile."),
  });

  if (company.isLoading) return <Loading />;
  if (!company.data) return <Empty>Your recruiter account is not linked to a company.</Empty>;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    mutation.mutate(profile);
  }

  return (
    <>
      <PageHeader title="Company profile" subtitle="Keep the company information accurate for candidates and hiring teams." />
      <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <section className="rounded-lg border bg-card p-5 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-accent/10 text-2xl font-bold text-accent">{profile.name.slice(0, 2).toUpperCase()}</div>
          <div className="mt-4 font-semibold">{profile.name}</div>
          <div className="mt-1 text-sm text-muted-foreground">{profile.industry} · {profile.location}</div>
          <button type="button" className="mt-4 inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm"><Upload className="h-4 w-4" />Upload logo</button>
          <p className="mt-3 text-xs text-muted-foreground">Logo changes are stored locally in demo mode.</p>
        </section>
        <section className="rounded-lg border bg-card p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="company-name">Company name</Label><Input id="company-name" value={profile.name} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))} required /></div>
            <div className="space-y-2"><Label htmlFor="industry">Industry</Label><Input id="industry" value={profile.industry} onChange={(event) => setProfile((current) => ({ ...current, industry: event.target.value }))} required /></div>
            <div className="space-y-2"><Label htmlFor="size">Company size</Label><Input id="size" value={profile.company_size} onChange={(event) => setProfile((current) => ({ ...current, company_size: event.target.value }))} /></div>
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="description">Company description</Label><Textarea id="description" value={profile.description} onChange={(event) => setProfile((current) => ({ ...current, description: event.target.value }))} rows={4} required /></div>
            <div className="space-y-2"><Label htmlFor="website"><Globe2 className="mr-2 inline h-4 w-4" />Website</Label><Input id="website" type="url" value={profile.website} onChange={(event) => setProfile((current) => ({ ...current, website: event.target.value }))} /></div>
            <div className="space-y-2"><Label htmlFor="location"><MapPin className="mr-2 inline h-4 w-4" />Location</Label><Input id="location" value={profile.location} onChange={(event) => setProfile((current) => ({ ...current, location: event.target.value }))} /></div>
            <div className="space-y-2"><Label htmlFor="contact-name"><Building2 className="mr-2 inline h-4 w-4" />Contact name</Label><Input id="contact-name" value={profile.contact_name} onChange={(event) => setProfile((current) => ({ ...current, contact_name: event.target.value }))} /></div>
            <div className="space-y-2"><Label htmlFor="contact-email"><Mail className="mr-2 inline h-4 w-4" />Contact email</Label><Input id="contact-email" type="email" value={profile.contact_email} onChange={(event) => setProfile((current) => ({ ...current, contact_email: event.target.value }))} /></div>
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="contact-phone"><Phone className="mr-2 inline h-4 w-4" />Contact phone</Label><Input id="contact-phone" value={profile.contact_phone} onChange={(event) => setProfile((current) => ({ ...current, contact_phone: event.target.value }))} /></div>
          </div>
          <div className="mt-6 flex justify-end"><Button type="submit" disabled={mutation.isPending}><Save className="mr-2 h-4 w-4" />{mutation.isPending ? "Saving…" : "Save company profile"}</Button></div>
        </section>
      </form>
    </>
  );
}
