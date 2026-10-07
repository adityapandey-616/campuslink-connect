import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Bell,
  Building,
  CheckCircle2,
  FileCheck2,
  Save,
  ShieldCheck,
  Sliders,
  Sparkles,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  getAdminSettings,
  updateAdminSettings,
  type AdminSettings,
} from "@/lib/admin-data";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  head: () => ({ meta: [{ title: "Placement Cell Settings â€” Skill to Hire Admin" }] }),
  component: AdminSettingsPage,
});

function AdminSettingsPage() {
  const [settings, setSettings] = useState<AdminSettings>(() => getAdminSettings());
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);

    const fd = new FormData(e.currentTarget);
    const updated = updateAdminSettings({
      officer_name: String(fd.get("officer_name") || settings.officer_name),
      officer_id: String(fd.get("officer_id") || settings.officer_id),
      officer_email: String(fd.get("officer_email") || settings.officer_email),
      officer_phone: String(fd.get("officer_phone") || settings.officer_phone),
      office_location: String(fd.get("office_location") || settings.office_location),
      institution_name: String(fd.get("institution_name") || settings.institution_name),
      academic_year: String(fd.get("academic_year") || settings.academic_year),
      placement_season: String(fd.get("placement_season") || settings.placement_season),
      max_applications_per_student: Number(fd.get("max_applications_per_student") || settings.max_applications_per_student),
      min_attendance_pct: Number(fd.get("min_attendance_pct") || settings.min_attendance_pct),
      auto_shortlist_threshold: Number(fd.get("auto_shortlist_threshold") || settings.auto_shortlist_threshold),
      allow_multiple_offers: fd.get("allow_multiple_offers") === "on",
      notify_email_digest: fd.get("notify_email_digest") === "on",
      notify_conflict_alerts: fd.get("notify_conflict_alerts") === "on",
      notify_drive_reminders: fd.get("notify_drive_reminders") === "on",
    });

    setTimeout(() => {
      setSettings(updated);
      setIsSaving(false);
      toast.success("Placement cell policies and configuration saved successfully!");
    }, 300);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Placement Cell Configuration & Policies"
        subtitle="Manage training & placement officer credentials, institutional guidelines, policy caps, and notification thresholds."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Officer Information Card */}
        <div className="rounded-xl border bg-card p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b">
            <User className="h-5 w-5 text-accent" />
            <div>
              <h3 className="font-semibold text-base text-foreground">Placement Officer Profile</h3>
              <p className="text-xs text-muted-foreground">Primary administrative liaison for recruitment drives</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
            <div>
              <label className="font-medium text-foreground">Officer Full Name</label>
              <Input
                name="officer_name"
                defaultValue={settings.officer_name}
                required
                className="h-9 mt-1 text-xs"
              />
            </div>
            <div>
              <label className="font-medium text-foreground">Officer / Staff ID</label>
              <Input
                name="officer_id"
                defaultValue={settings.officer_id}
                required
                className="h-9 mt-1 text-xs"
              />
            </div>
            <div>
              <label className="font-medium text-foreground">Official Email Address</label>
              <Input
                name="officer_email"
                type="email"
                defaultValue={settings.officer_email}
                required
                className="h-9 mt-1 text-xs"
              />
            </div>
            <div>
              <label className="font-medium text-foreground">Office Contact Phone</label>
              <Input
                name="officer_phone"
                defaultValue={settings.officer_phone}
                required
                className="h-9 mt-1 text-xs"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="font-medium text-foreground">Placement Cell Office Location</label>
              <Input
                name="office_location"
                defaultValue={settings.office_location}
                required
                className="h-9 mt-1 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Institutional Season Setup */}
        <div className="rounded-xl border bg-card p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b">
            <Building className="h-5 w-5 text-accent" />
            <div>
              <h3 className="font-semibold text-base text-foreground">Institutional Placement Season</h3>
              <p className="text-xs text-muted-foreground">Campus naming and academic year cycle</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 text-xs">
            <div>
              <label className="font-medium text-foreground">Institution Name</label>
              <Input
                name="institution_name"
                defaultValue={settings.institution_name}
                required
                className="h-9 mt-1 text-xs"
              />
            </div>
            <div>
              <label className="font-medium text-foreground">Academic Year</label>
              <Input
                name="academic_year"
                defaultValue={settings.academic_year}
                required
                className="h-9 mt-1 text-xs"
              />
            </div>
            <div>
              <label className="font-medium text-foreground">Placement Season Title</label>
              <Input
                name="placement_season"
                defaultValue={settings.placement_season}
                required
                className="h-9 mt-1 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Placement Policies & Quotas */}
        <div className="rounded-xl border bg-card p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b">
            <Sliders className="h-5 w-5 text-accent" />
            <div>
              <h3 className="font-semibold text-base text-foreground">Placement Governance & Policies</h3>
              <p className="text-xs text-muted-foreground">Automated eligibility caps and offer acceptance rules</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 text-xs">
            <div>
              <label className="font-medium text-foreground">Max Applications per Student</label>
              <Input
                name="max_applications_per_student"
                type="number"
                min="1"
                max="20"
                defaultValue={settings.max_applications_per_student}
                required
                className="h-9 mt-1 text-xs"
              />
              <span className="text-[11px] text-muted-foreground mt-0.5 block">
                Prevents spamming across all recruiters
              </span>
            </div>

            <div>
              <label className="font-medium text-foreground">Min Attendance % Required</label>
              <Input
                name="min_attendance_pct"
                type="number"
                min="0"
                max="100"
                defaultValue={settings.min_attendance_pct}
                required
                className="h-9 mt-1 text-xs"
              />
              <span className="text-[11px] text-muted-foreground mt-0.5 block">
                Required for placement drive sign-off
              </span>
            </div>

            <div>
              <label className="font-medium text-foreground">Auto-Shortlist Score Threshold</label>
              <Input
                name="auto_shortlist_threshold"
                type="number"
                min="50"
                max="100"
                defaultValue={settings.auto_shortlist_threshold}
                required
                className="h-9 mt-1 text-xs"
              />
              <span className="text-[11px] text-muted-foreground mt-0.5 block">
                AI Match threshold for one-click shortlists
              </span>
            </div>
          </div>

          <div className="pt-2 border-t">
            <label className="flex items-center gap-2.5 text-xs font-medium cursor-pointer">
              <input
                type="checkbox"
                name="allow_multiple_offers"
                defaultChecked={settings.allow_multiple_offers}
                className="rounded h-4 w-4"
              />
              <span>Allow multiple dream company offers (Dream Offer Upgrade Policy)</span>
            </label>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="rounded-xl border bg-card p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b">
            <Bell className="h-5 w-5 text-accent" />
            <div>
              <h3 className="font-semibold text-base text-foreground">Notification Preferences</h3>
              <p className="text-xs text-muted-foreground">Admin alert triggers and digest reports</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center gap-2.5 font-medium cursor-pointer">
              <input
                type="checkbox"
                name="notify_conflict_alerts"
                defaultChecked={settings.notify_conflict_alerts}
                className="rounded h-4 w-4"
              />
              <span>Immediately alert when interview schedule conflicts are detected</span>
            </label>

            <label className="flex items-center gap-2.5 font-medium cursor-pointer">
              <input
                type="checkbox"
                name="notify_drive_reminders"
                defaultChecked={settings.notify_drive_reminders}
                className="rounded h-4 w-4"
              />
              <span>Send morning reminders 24 hours prior to placement drive dates</span>
            </label>

            <label className="flex items-center gap-2.5 font-medium cursor-pointer">
              <input
                type="checkbox"
                name="notify_email_digest"
                defaultChecked={settings.notify_email_digest}
                className="rounded h-4 w-4"
              />
              <span>Receive weekly placement digest email with branch progress reports</span>
            </label>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="submit" disabled={isSaving} className="gap-1.5 shadow-sm">
            <Save className="h-4 w-4" />
            {isSaving ? "Saving Configuration..." : "Save Configuration"}
          </Button>
        </div>
      </form>
    </div>
  );
}