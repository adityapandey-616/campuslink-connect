import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loading, PageHeader } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/admin/drives")({
  component: Drives,
});

function Drives() {
  const qc = useQueryClient();
  const drives = useQuery({ queryKey: ["drives"], queryFn: async () => (await supabase.from("placement_drives").select("*, company:companies(name)").order("drive_date")).data ?? [] });
  const companies = useQuery({ queryKey: ["companies"], queryFn: async () => (await supabase.from("companies").select("id,name").order("name")).data ?? [] });
  if (drives.isLoading) return <Loading />;

  async function create(f: FormData) {
    const { error } = await supabase.from("placement_drives").insert({ company_id: String(f.get("company")), title: String(f.get("title")).slice(0, 120), drive_date: String(f.get("date")), venue: String(f.get("venue")).slice(0, 120) });
    if (error) { toast.error(error.message); return; }
    toast.success("Drive scheduled");
    qc.invalidateQueries({ queryKey: ["drives"] });
  }
  async function setStatus(id: string, status: string) {
    await supabase.from("placement_drives").update({ status }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["drives"] });
  }

  return (
    <>
      <PageHeader title="Placement drives" />
      <form className="mb-6 grid gap-2 rounded-lg border bg-card p-4 md:grid-cols-5" onSubmit={(e) => { e.preventDefault(); create(new FormData(e.currentTarget)); e.currentTarget.reset(); }}>
        <select name="company" required className="h-9 rounded-md border bg-card px-2 text-sm">{(companies.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <Input name="title" placeholder="Drive title" required />
        <Input name="date" type="date" required />
        <Input name="venue" placeholder="Venue" />
        <Button>Schedule drive</Button>
      </form>
      <div className="divide-y rounded-lg border bg-card">
        {(drives.data ?? []).map((d) => (
          <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div><div className="font-medium">{d.title}</div><div className="text-sm text-muted-foreground">{d.company?.name} · {d.drive_date} · {d.venue}</div></div>
            <select value={d.status} onChange={(e) => setStatus(d.id, e.target.value)} className="h-8 rounded-md border bg-card px-2 text-sm capitalize">
              {["scheduled", "ongoing", "completed", "cancelled"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        ))}
      </div>
    </>
  );
}
