import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Empty, Loading, PageHeader } from "@/components/AppShell";
import { meQuery } from "@/lib/student-data";
import { BRANCHES } from "@/lib/campus";

export const Route = createFileRoute("/_authenticated/student/profile")({
  component: Profile,
});

function Profile() {
  const me = useQuery(meQuery);
  const qc = useQueryClient();
  const allSkills = useQuery({ queryKey: ["skills"], queryFn: async () => (await supabase.from("skills").select("*").order("name")).data ?? [] });
  const refresh = () => qc.invalidateQueries({ queryKey: ["me-student"] });
  const [skillId, setSkillId] = useState("");

  const save = useMutation({
    mutationFn: async (v: Record<string, unknown>) => {
      const { error } = await supabase.from("students").update(v).eq("id", me.data!.student.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Profile saved"); refresh(); },
    onError: (e) => toast.error(e.message),
  });

  if (me.isLoading) return <Loading />;
  if (!me.data) return <Empty>Couldn't load your profile.</Empty>;
  const { student, skills, projects, certs, docs } = me.data;
  const sid = student.id;

  function onSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const cgpa = Number(f.get("cgpa"));
    if (isNaN(cgpa) || cgpa < 0 || cgpa > 10) return toast.error("CGPA must be between 0 and 10");
    save.mutate({
      full_name: String(f.get("full_name")).slice(0, 100),
      roll_no: String(f.get("roll_no")).slice(0, 30),
      branch: f.get("branch"),
      batch_year: Number(f.get("batch_year")),
      cgpa,
      backlogs: Math.max(0, Number(f.get("backlogs")) || 0),
      phone: String(f.get("phone")).slice(0, 20),
      bio: String(f.get("bio")).slice(0, 500),
    });
  }
  async function run(p: PromiseLike<{ error: { message: string } | null }>) {
    const { error } = await p;
    if (error) toast.error(error.message); else refresh();
  }

  return (
    <>
      <PageHeader title="Profile & Skills" subtitle="A complete profile raises your readiness score and match quality." />
      <div className="grid gap-6 lg:grid-cols-3">
        <form onSubmit={onSave} className="space-y-4 rounded-lg border bg-card p-5 lg:col-span-2">
          <h2 className="font-semibold">Academic information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <F l="Full name"><Input name="full_name" defaultValue={student.full_name} required /></F>
            <F l="Roll number"><Input name="roll_no" defaultValue={student.roll_no ?? ""} /></F>
            <F l="Branch"><select name="branch" defaultValue={student.branch} className="h-9 w-full rounded-md border bg-card px-3 text-sm">{BRANCHES.map((b) => <option key={b}>{b}</option>)}</select></F>
            <F l="Batch year"><Input name="batch_year" type="number" defaultValue={student.batch_year} /></F>
            <F l="CGPA"><Input name="cgpa" type="number" step="0.01" defaultValue={Number(student.cgpa)} /></F>
            <F l="Active backlogs"><Input name="backlogs" type="number" min={0} defaultValue={student.backlogs} /></F>
            <F l="Phone"><Input name="phone" defaultValue={student.phone ?? ""} /></F>
          </div>
          <F l="About you"><Textarea name="bio" defaultValue={student.bio} rows={3} /></F>
          <Button disabled={save.isPending}>Save profile</Button>
        </form>

        <section className="rounded-lg border bg-card p-5">
          <h2 className="font-semibold">Skills</h2>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {skills.length === 0 && <p className="text-sm text-muted-foreground">No skills added yet.</p>}
            {skills.map((s) => (
              <span key={s.id} className="inline-flex items-center gap-1 rounded border bg-secondary px-2 py-0.5 text-sm">
                {s.name}
                <button aria-label={`Remove ${s.name}`} onClick={() => run(supabase.from("student_skills").delete().eq("student_id", sid).eq("skill_id", s.id))}><Trash2 className="h-3 w-3 text-muted-foreground" /></button>
              </span>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <select value={skillId} onChange={(e) => setSkillId(e.target.value)} className="h-9 flex-1 rounded-md border bg-card px-2 text-sm">
              <option value="">Add a skill…</option>
              {(allSkills.data ?? []).filter((s) => !skills.some((x) => x.id === s.id)).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <Button size="sm" disabled={!skillId} onClick={() => { run(supabase.from("student_skills").insert({ student_id: sid, skill_id: skillId, level: 3 })); setSkillId(""); }}>Add</Button>
          </div>
        </section>

        <ListCard
          title="Projects"
          items={projects.map((p) => ({ id: p.id, main: p.title, sub: p.tech }))}
          fields={[["title", "Project title"], ["tech", "Tech used"]]}
          onAdd={(v) => run(supabase.from("projects").insert({ student_id: sid, title: v.title, tech: v.tech }))}
          onDelete={(id) => run(supabase.from("projects").delete().eq("id", id))}
        />
        <ListCard
          title="Certifications"
          items={certs.map((c) => ({ id: c.id, main: c.name, sub: c.issuer }))}
          fields={[["name", "Certification"], ["issuer", "Issuer"]]}
          onAdd={(v) => run(supabase.from("certifications").insert({ student_id: sid, name: v.name, issuer: v.issuer }))}
          onDelete={(id) => run(supabase.from("certifications").delete().eq("id", id))}
        />
        <section className="rounded-lg border bg-card p-5">
          <h2 className="font-semibold">Documents</h2>
          <div className="mt-3 space-y-2">
            {docs.map((d) => (
              <div key={d.id} className="flex justify-between text-sm"><span>{d.doc_type}</span><span className={`capitalize ${d.status === "verified" ? "text-success" : "text-muted-foreground"}`}>{d.status}</span></div>
            ))}
          </div>
          <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); const t = String(new FormData(e.currentTarget).get("t")); if (t) run(supabase.from("documents").insert({ student_id: sid, doc_type: t })); e.currentTarget.reset(); }}>
            <select name="t" className="h-9 flex-1 rounded-md border bg-card px-2 text-sm">
              {["Resume", "Semester Marksheets", "10th Certificate", "12th Certificate", "ID Proof"].map((t) => <option key={t}>{t}</option>)}
            </select>
            <Button size="sm">Submit for verification</Button>
          </form>
        </section>
      </div>
    </>
  );
}

function F({ l, children }: { l: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{l}</Label>{children}</div>;
}

function ListCard({ title, items, fields, onAdd, onDelete }: {
  title: string; items: { id: string; main: string; sub: string }[]; fields: [string, string][];
  onAdd: (v: Record<string, string>) => void; onDelete: (id: string) => void;
}) {
  return (
    <section className="rounded-lg border bg-card p-5">
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-3 space-y-2">
        {items.length === 0 && <p className="text-sm text-muted-foreground">None added yet.</p>}
        {items.map((i) => (
          <div key={i.id} className="flex items-start justify-between gap-2 text-sm">
            <div><div className="font-medium">{i.main}</div><div className="text-muted-foreground">{i.sub}</div></div>
            <button aria-label="Remove" onClick={() => onDelete(i.id)}><Trash2 className="h-4 w-4 text-muted-foreground" /></button>
          </div>
        ))}
      </div>
      <form className="mt-3 space-y-2" onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const v = Object.fromEntries(fields.map(([k]) => [k, String(f.get(k) ?? "").slice(0, 200)]));
        if (!v[fields[0][0]]) return;
        onAdd(v); e.currentTarget.reset();
      }}>
        {fields.map(([k, p]) => <Input key={k} name={k} placeholder={p} />)}
        <Button size="sm" variant="outline">Add</Button>
      </form>
    </section>
  );
}
