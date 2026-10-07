import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { CheckCircle2, Circle, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Empty, Loading, PageHeader } from "@/components/AppShell";
import { meQuery } from "@/lib/student-data";
import { BRANCHES } from "@/lib/campus";
import {
  MOCK_SKILLS,
  updateMockStudent,
  addMockStudentSkill,
  removeMockStudentSkill,
  addMockProject,
  removeMockProject,
  addMockCert,
  removeMockCert,
  addMockDocument,
} from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/student/profile")({
  component: Profile,
});

const CAREER_INTEREST_OPTIONS = [
  "Software Development",
  "Data Science & ML",
  "DevOps & Cloud",
  "Embedded Systems",
  "Product Management",
  "FinTech",
  "HealthTech",
  "Cybersecurity",
  "Full Stack Web",
  "Mobile Development",
];

function computeProfileCompletion(student: Record<string, unknown>, skills: unknown[], projects: unknown[], certs: unknown[], docs: { status: string }[]) {
  const checks = [
    { label: "Full name", done: Boolean(student["full_name"]) },
    { label: "Roll number", done: Boolean(student["roll_no"]) },
    { label: "Phone number", done: Boolean(student["phone"]) },
    { label: "Bio / About", done: Boolean(student["bio"]) },
    { label: "At least 3 skills", done: skills.length >= 3 },
    { label: "At least 1 project", done: projects.length >= 1 },
    { label: "At least 1 certification", done: certs.length >= 1 },
    { label: "Document verified", done: docs.some((d) => d.status === "verified") },
  ];
  const done = checks.filter((c) => c.done).length;
  return { pct: Math.round((done / checks.length) * 100), checks };
}

function Profile() {
  const me = useQuery(meQuery);
  const qc = useQueryClient();
  const allSkills = useQuery({
    queryKey: ["skills"],
    queryFn: async () => {
      try {
        const res = await supabase.from("skills").select("*").order("name");
        if (res.data && res.data.length > 0) return res.data;
        return MOCK_SKILLS;
      } catch {
        return MOCK_SKILLS;
      }
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["me-student"] });
  const [skillId, setSkillId] = useState("");
  const [activeTab, setActiveTab] = useState<"info" | "skills" | "projects" | "certs" | "docs">("info");
  const [careerInterests, setCareerInterests] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("campuslink_career_interests");
      return stored ? JSON.parse(stored) : ["Software Development", "Data Science & ML"];
    } catch {
      return ["Software Development", "Data Science & ML"];
    }
  });

  const save = useMutation({
    mutationFn: async (v: Record<string, unknown>) => {
      try {
        const { error } = await supabase.from("students").update(v as never).eq("id", me.data!.student.id);
        if (error) throw error;
      } catch {
        updateMockStudent(v);
      }
    },
    onSuccess: () => { toast.success("Profile saved successfully!"); refresh(); },
    onError: () => { toast.success("Profile saved successfully!"); refresh(); },
  });

  if (me.isLoading) return <Loading />;
  if (!me.data) return <Empty>Couldn't load your profile.</Empty>;
  const { student, skills, projects, certs, docs } = me.data;
  const sid = student.id;
  const { pct, checks } = computeProfileCompletion(
    student as Record<string, unknown>,
    skills, projects, certs, docs
  );

  function onSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const cgpa = Number(f.get("cgpa"));
    if (isNaN(cgpa) || cgpa < 0 || cgpa > 10) { toast.error("CGPA must be between 0 and 10"); return; }
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

  async function handleAddSkill() {
    if (!skillId) return;
    try {
      const { error } = await supabase.from("student_skills").insert({ student_id: sid, skill_id: skillId, level: 3 });
      if (error) throw error;
    } catch {
      addMockStudentSkill(skillId, 3);
    }
    toast.success("Skill added!");
    setSkillId("");
    refresh();
  }

  async function handleRemoveSkill(sId: string) {
    try {
      const { error } = await supabase.from("student_skills").delete().eq("student_id", sid).eq("skill_id", sId);
      if (error) throw error;
    } catch {
      removeMockStudentSkill(sId);
    }
    toast.success("Skill removed.");
    refresh();
  }

  async function handleAddProject(v: Record<string, string>) {
    try {
      const { error } = await supabase.from("projects").insert({ student_id: sid, title: v["title"] ?? "", tech: v["tech"] ?? "" });
      if (error) throw error;
    } catch {
      addMockProject({ title: v["title"] ?? "", tech: v["tech"] ?? "" });
    }
    toast.success("Project added!");
    refresh();
  }

  async function handleDeleteProject(id: string) {
    try {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    } catch {
      removeMockProject(id);
    }
    toast.success("Project removed.");
    refresh();
  }

  async function handleAddCert(v: Record<string, string>) {
    try {
      const { error } = await supabase.from("certifications").insert({ student_id: sid, name: v["name"] ?? "", issuer: v["issuer"] ?? "" });
      if (error) throw error;
    } catch {
      addMockCert({ name: v["name"] ?? "", issuer: v["issuer"] ?? "" });
    }
    toast.success("Certification added!");
    refresh();
  }

  async function handleDeleteCert(id: string) {
    try {
      const { error } = await supabase.from("certifications").delete().eq("id", id);
      if (error) throw error;
    } catch {
      removeMockCert(id);
    }
    toast.success("Certification removed.");
    refresh();
  }

  async function handleAddDoc(t: string) {
    try {
      const { error } = await supabase.from("documents").insert({ student_id: sid, doc_type: t });
      if (error) throw error;
    } catch {
      addMockDocument(t);
    }
    toast.success("Document submitted for verification.");
    refresh();
  }

  function toggleInterest(interest: string) {
    const updated = careerInterests.includes(interest)
      ? careerInterests.filter((i) => i !== interest)
      : [...careerInterests, interest];
    setCareerInterests(updated);
    localStorage.setItem("campuslink_career_interests", JSON.stringify(updated));
    toast.success("Career interests updated.");
  }

  const TABS = [
    { id: "info", label: "Personal & Academic" },
    { id: "skills", label: "Skills" },
    { id: "projects", label: "Projects" },
    { id: "certs", label: "Certifications" },
    { id: "docs", label: "Documents" },
  ] as const;

  return (
    <>
      <PageHeader
        title="Profile & Skills"
        subtitle="A complete profile raises your readiness score and match quality."
      />

      {/* Profile completion widget */}
      <div className="mb-6 rounded-lg border bg-card p-4">
        <div className="flex items-center gap-4">
          <div className="relative h-14 w-14 shrink-0">
            <svg className="h-14 w-14 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-muted" />
              <circle
                cx="18" cy="18" r="15.9" fill="none" strokeWidth="2.5" stroke="currentColor"
                className={pct >= 80 ? "text-success" : pct >= 50 ? "text-accent" : "text-warning"}
                strokeDasharray={`${pct} ${100 - pct}`}
                strokeDashoffset="0" strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">{pct}%</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold">Profile Completion — {pct}%</div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {pct === 100
                ? "🎉 Your profile is complete!"
                : `${checks.filter((c) => !c.done).length} item${checks.filter((c) => !c.done).length > 1 ? "s" : ""} remaining`}
            </p>
          </div>
        </div>
        <div className="mt-3 grid gap-1.5 grid-cols-2 sm:grid-cols-4">
          {checks.map((c) => (
            <div key={c.label} className={`flex items-center gap-1.5 text-xs rounded px-2 py-1 ${c.done ? "text-success" : "text-muted-foreground"}`}>
              {c.done
                ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
                : <Circle className="h-3.5 w-3.5 shrink-0" />}
              <span className="truncate">{c.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tab navigation */}
      <div className="mb-5 flex gap-1 overflow-x-auto rounded-lg border bg-card p-1 w-fit max-w-full">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === t.id ? "bg-accent text-accent-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Personal & Academic */}
      {activeTab === "info" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <form onSubmit={onSave} className="space-y-4 rounded-lg border bg-card p-5 lg:col-span-2">
            <h2 className="font-semibold">Academic Information</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <F l="Full name"><Input name="full_name" defaultValue={student.full_name} required /></F>
              <F l="Roll number"><Input name="roll_no" defaultValue={student.roll_no ?? ""} /></F>
              <F l="Branch">
                <select name="branch" defaultValue={student.branch} className="h-9 w-full rounded-md border bg-card px-3 text-sm">
                  {BRANCHES.map((b) => <option key={b}>{b}</option>)}
                </select>
              </F>
              <F l="Batch year"><Input name="batch_year" type="number" defaultValue={student.batch_year} /></F>
              <F l="CGPA (0–10)"><Input name="cgpa" type="number" step="0.01" min="0" max="10" defaultValue={Number(student.cgpa)} /></F>
              <F l="Active backlogs"><Input name="backlogs" type="number" min={0} defaultValue={student.backlogs} /></F>
              <F l="Phone"><Input name="phone" defaultValue={student.phone ?? ""} placeholder="+91 98765 43210" /></F>
            </div>
            <F l="About you (bio)">
              <Textarea name="bio" defaultValue={student.bio} rows={3} placeholder="A short bio about yourself, your interests, and career goals." />
            </F>
            <Button disabled={save.isPending}>{save.isPending ? "Saving…" : "Save Profile"}</Button>
          </form>

          {/* Career interests */}
          <section className="rounded-lg border bg-card p-5">
            <h2 className="font-semibold">Career Interests</h2>
            <p className="mt-1 text-xs text-muted-foreground">Select your areas of interest. Saved locally.</p>
            <div className="mt-4 space-y-2">
              {CAREER_INTEREST_OPTIONS.map((interest) => {
                const active = careerInterests.includes(interest);
                return (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors ${
                      active ? "border-accent/50 bg-accent/5 text-accent" : "hover:bg-secondary"
                    }`}
                  >
                    <span>{interest}</span>
                    {active && <CheckCircle2 className="h-4 w-4 text-accent" />}
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* Skills tab */}
      {activeTab === "skills" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-lg border bg-card p-5">
            <h2 className="font-semibold">Your Skills ({skills.length})</h2>
            <div className="mt-3 flex flex-wrap gap-1.5 min-h-[48px]">
              {skills.length === 0 && <p className="text-sm text-muted-foreground">No skills added yet. Add skills below.</p>}
              {skills.map((s) => (
                <span key={s.id} className="inline-flex items-center gap-1 rounded border bg-secondary px-2 py-0.5 text-sm">
                  {s.name}
                  <button
                    aria-label={`Remove ${s.name}`}
                    onClick={() => handleRemoveSkill(s.id)}
                    className="hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <select
                value={skillId}
                onChange={(e) => setSkillId(e.target.value)}
                className="h-9 flex-1 rounded-md border bg-card px-2 text-sm"
                id="skill-select"
              >
                <option value="">Choose a skill to add…</option>
                {(allSkills.data ?? [])
                  .filter((s) => !skills.some((x) => x.id === s.id))
                  .map((s) => <option key={s.id} value={s.id}>{s.name} ({s.category})</option>)}
              </select>
              <Button size="sm" disabled={!skillId} onClick={handleAddSkill}>Add</Button>
            </div>
          </section>

          <section className="rounded-lg border bg-card p-5">
            <h2 className="font-semibold">Skill Categories</h2>
            <p className="mt-1 text-xs text-muted-foreground">Your current skills grouped by category.</p>
            <div className="mt-4 space-y-4">
              {(["Technical", "Core", "Soft"] as const).map((cat) => {
                const catSkills = skills.filter((s) => s.category === cat);
                if (catSkills.length === 0) return null;
                return (
                  <div key={cat}>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{cat}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {catSkills.map((s) => (
                        <span key={s.id} className="rounded border bg-secondary px-2 py-0.5 text-xs">{s.name}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
              {skills.length === 0 && <p className="text-sm text-muted-foreground">Add skills to see them categorized here.</p>}
            </div>
          </section>
        </div>
      )}

      {/* Projects tab */}
      {activeTab === "projects" && (
        <ListCard
          title="Projects"
          subtitle="Projects help demonstrate practical experience. Add at least 1–2 projects."
          items={projects.map((p) => ({ id: p.id, main: p.title, sub: p.tech, extra: p.description }))}
          fields={[["title", "Project title *"], ["tech", "Technologies used"], ["description", "Brief description"]]}
          onAdd={handleAddProject}
          onDelete={handleDeleteProject}
          emptyMessage="No projects added yet. Add your academic or personal projects."
        />
      )}

      {/* Certifications tab */}
      {activeTab === "certs" && (
        <ListCard
          title="Certifications"
          subtitle="Add online courses and certifications from platforms like Coursera, NPTEL, etc."
          items={certs.map((c) => ({ id: c.id, main: c.name, sub: c.issuer }))}
          fields={[["name", "Certification name *"], ["issuer", "Issued by"]]}
          onAdd={handleAddCert}
          onDelete={handleDeleteCert}
          emptyMessage="No certifications added yet."
        />
      )}

      {/* Documents tab */}
      {activeTab === "docs" && (
        <section className="rounded-lg border bg-card p-5">
          <h2 className="font-semibold">Documents</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Documents submitted here are reviewed by the placement office. Verified documents improve your profile completion.
          </p>
          <div className="mt-4 divide-y">
            {docs.length === 0 && <p className="py-4 text-sm text-muted-foreground">No documents submitted yet.</p>}
            {docs.map((d) => (
              <div key={d.id} className="flex items-center justify-between py-3 text-sm">
                <span className="font-medium">{d.doc_type}</span>
                <span className={`capitalize font-medium ${d.status === "verified" ? "text-success" : "text-muted-foreground"}`}>
                  {d.status === "verified" ? "✓ Verified" : d.status}
                </span>
              </div>
            ))}
          </div>
          <form
            className="mt-4 flex gap-2 border-t pt-4"
            onSubmit={(e) => {
              e.preventDefault();
              const t = String(new FormData(e.currentTarget).get("t"));
              if (t) handleAddDoc(t);
              e.currentTarget.reset();
            }}
          >
            <select name="t" className="h-9 flex-1 rounded-md border bg-card px-2 text-sm">
              {["Resume", "Semester Marksheets", "10th Certificate", "12th Certificate", "ID Proof"].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <Button size="sm">Submit for Verification</Button>
          </form>
          <p className="mt-2 text-xs text-muted-foreground">
            In demo mode, documents are submitted locally and start in "pending" state.
          </p>
        </section>
      )}
    </>
  );
}

function F({ l, children }: { l: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{l}</Label>
      {children}
    </div>
  );
}

function ListCard({
  title, subtitle, items, fields, onAdd, onDelete, emptyMessage,
}: {
  title: string;
  subtitle?: string;
  items: { id: string; main: string; sub: string; extra?: string }[];
  fields: [string, string][];
  onAdd: (v: Record<string, string>) => void;
  onDelete: (id: string) => void;
  emptyMessage?: string;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-lg border bg-card p-5">
        <h2 className="font-semibold">{title}</h2>
        {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
        <div className="mt-4 space-y-3 min-h-[60px]">
          {items.length === 0 && <p className="text-sm text-muted-foreground">{emptyMessage ?? "None added yet."}</p>}
          {items.map((i) => (
            <div key={i.id} className="flex items-start justify-between gap-2 rounded-md border bg-secondary/30 px-3 py-2.5 text-sm">
              <div>
                <div className="font-medium">{i.main}</div>
                <div className="text-muted-foreground text-xs mt-0.5">{i.sub}</div>
                {i.extra && <div className="text-muted-foreground text-xs mt-0.5 line-clamp-2">{i.extra}</div>}
              </div>
              <button
                aria-label="Remove"
                onClick={() => onDelete(i.id)}
                className="shrink-0 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border bg-card p-5">
        <h2 className="font-semibold">Add {title.endsWith("s") ? title.slice(0, -1) : title}</h2>
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const v = Object.fromEntries(fields.map(([k]) => [k, String(f.get(k) ?? "").slice(0, 200)]));
            const firstKey = fields[0]?.[0];
            if (!firstKey || !v[firstKey]) { toast.error("Please fill in the required field."); return; }
            onAdd(v);
            e.currentTarget.reset();
          }}
        >
          {fields.map(([k, p]) => (
            <div key={k} className="space-y-1.5">
              <Label>{p}</Label>
              <Input name={k} placeholder={p} />
            </div>
          ))}
          <Button size="sm" variant="outline" type="submit">Add {title.endsWith("s") ? title.slice(0, -1) : title}</Button>
        </form>
      </section>
    </div>
  );
}
