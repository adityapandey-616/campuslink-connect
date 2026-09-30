import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Loading, PageHeader, Stat } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminAnalytics,
});

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--muted-foreground)"];

function AdminAnalytics() {
  const q = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const [s, a, o] = await Promise.all([
        supabase.from("students").select("id,branch,placement_status"),
        supabase.from("applications").select("status, job:jobs(company:companies(name))"),
        supabase.from("offers").select("ctc_lpa,status"),
      ]);
      return { students: s.data ?? [], apps: a.data ?? [], offers: o.data ?? [] };
    },
  });
  if (q.isLoading || !q.data) return <Loading />;
  const { students, apps, offers } = q.data;
  const placed = students.filter((s) => s.placement_status === "placed").length;
  const ctcs = offers.map((o) => Number(o.ctc_lpa));
  const avg = ctcs.length ? (ctcs.reduce((a, b) => a + b, 0) / ctcs.length).toFixed(1) : "0";
  const max = ctcs.length ? Math.max(...ctcs) : 0;

  const branches = [...new Set(students.map((s) => s.branch))].map((b) => {
    const all = students.filter((s) => s.branch === b);
    return { branch: b, total: all.length, placed: all.filter((s) => s.placement_status === "placed").length };
  });
  const funnel = ["applied", "shortlisted", "interview", "offered", "joined", "rejected"].map((st) => ({ name: st, value: apps.filter((a) => a.status === st).length }));
  const byCompany = Object.entries(apps.reduce<Record<string, number>>((acc, a) => {
    const n = a.job?.company?.name ?? "—";
    if (a.status === "offered" || a.status === "joined") acc[n] = (acc[n] ?? 0) + 1;
    return acc;
  }, {})).map(([name, offers]) => ({ name, offers }));

  return (
    <>
      <PageHeader title="Placement analytics" subtitle="Live view across all students, companies and drives." />
      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Placement rate" value={`${students.length ? Math.round((placed / students.length) * 100) : 0}%`} hint={`${placed} of ${students.length} students`} />
        <Stat label="Offers released" value={offers.length} />
        <Stat label="Average CTC" value={`₹${avg} LPA`} />
        <Stat label="Highest CTC" value={`₹${max} LPA`} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Branch-wise placement">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={branches}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="branch" fontSize={12} /><YAxis fontSize={12} allowDecimals={false} /><Tooltip />
              <Bar dataKey="total" fill="var(--chart-2)" name="Students" radius={[3, 3, 0, 0]} />
              <Bar dataKey="placed" fill="var(--chart-1)" name="Placed" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Application pipeline">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={funnel} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
                {funnel.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 text-xs">{funnel.map((f, i) => <span key={f.name} className="flex items-center gap-1 capitalize"><span className="h-2 w-2 rounded-full" style={{ background: COLORS[i] }} />{f.name} {f.value}</span>)}</div>
        </Card>
        <Card title="Offers by company" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byCompany} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" fontSize={12} allowDecimals={false} /><YAxis type="category" dataKey="name" width={140} fontSize={12} /><Tooltip />
              <Bar dataKey="offers" fill="var(--chart-1)" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </>
  );
}

function Card({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return <section className={`rounded-lg border bg-card p-5 ${className}`}><h2 className="mb-4 font-semibold">{title}</h2>{children}</section>;
}
