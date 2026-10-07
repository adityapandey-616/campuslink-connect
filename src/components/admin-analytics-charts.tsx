import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Award, Building2, GraduationCap, Sparkles, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const PIE_COLORS = [
  "oklch(0.62 0.11 185)",
  "oklch(0.26 0.05 255)",
  "oklch(0.75 0.14 75)",
  "oklch(0.6 0.13 155)",
  "oklch(0.577 0.22 27)",
  "oklch(0.5 0.02 255)",
];

interface AnalyticsChartsProps {
  branchData: Array<{ branch: string; total: number; placed: number; rate: number }>;
  funnelData: Array<{ name: string; count: number }>;
  ctcBands: Array<{ name: string; value: number }>;
  readinessDistribution: Array<{ tier: string; count: number }>;
  cohortStudents: Array<{ branch: string }>;
  companyHiringData: Array<{ company: string; offers: number; tier: string }>;
}

export function AnalyticsCharts({
  branchData,
  funnelData,
  ctcBands,
  readinessDistribution,
  cohortStudents,
  companyHiringData,
}: AnalyticsChartsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border bg-card p-5 shadow-xs">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-base text-foreground">Branch-wise Placement Performance</h3>
            <p className="text-xs text-muted-foreground">Total enrolled students vs. placed candidates</p>
          </div>
          <GraduationCap className="h-5 w-5 text-accent" />
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={branchData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="branch" fontSize={12} stroke="var(--muted-foreground)" />
            <YAxis fontSize={12} allowDecimals={false} stroke="var(--muted-foreground)" />
            <Tooltip contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "8px", fontSize: "12px" }} />
            <Bar dataKey="total" fill="var(--chart-2)" name="Enrolled" radius={[4, 4, 0, 0]} />
            <Bar dataKey="placed" fill="var(--chart-1)" name="Placed" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-xs">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-base text-foreground">Application Conversion Funnel</h3>
            <p className="text-xs text-muted-foreground">Progression across hiring rounds</p>
          </div>
          <TrendingUp className="h-5 w-5 text-accent" />
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={funnelData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis type="number" fontSize={12} allowDecimals={false} stroke="var(--muted-foreground)" />
            <YAxis type="category" dataKey="name" width={85} fontSize={12} stroke="var(--muted-foreground)" tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)} />
            <Tooltip contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "8px", fontSize: "12px" }} />
            <Bar dataKey="count" fill="var(--chart-1)" radius={[0, 4, 4, 0]} name="Candidates" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-xs">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-base text-foreground">Salary Bracket Distribution (CTC)</h3>
            <p className="text-xs text-muted-foreground">Compensation bands across released offers</p>
          </div>
          <Award className="h-5 w-5 text-success" />
        </div>
        <div className="grid items-center gap-4 sm:grid-cols-2">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={ctcBands} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                {ctcBands.map((_, idx) => (
                  <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "8px", fontSize: "12px" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 text-xs">
            {ctcBands.map((band, idx) => (
              <div key={band.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                  <span className="font-medium text-foreground">{band.name}</span>
                </div>
                <span className="font-bold text-foreground">{band.value} offer{band.value > 1 ? "s" : ""}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-xs">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-base text-foreground">Cohort AI Readiness Spread</h3>
            <p className="text-xs text-muted-foreground">Distribution of student interview readiness scores</p>
          </div>
          <Sparkles className="h-5 w-5 text-accent" />
        </div>
        <div className="space-y-4 pt-2">
          {readinessDistribution.map((item) => {
            const pct = cohortStudents.length ? Math.round((item.count / cohortStudents.length) * 100) : 0;
            return (
              <div key={item.tier} className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">{item.tier}</span>
                  <span className="text-muted-foreground"><strong className="text-foreground">{item.count}</strong> students ({pct}%)</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div className={`h-full rounded-full transition-all duration-500 ${item.tier.includes("High") ? "bg-success" : item.tier.includes("Moderate") ? "bg-accent" : "bg-destructive"}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-xs lg:col-span-2">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-base text-foreground">Top Hiring Recruiter Partners</h3>
            <p className="text-xs text-muted-foreground">Volume of offers made per recruitment partner</p>
          </div>
          <Building2 className="h-5 w-5 text-accent" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b bg-secondary/60 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-3">Recruiting Company</th>
                <th className="p-3">Hiring Tier</th>
                <th className="p-3">Offers Released</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {companyHiringData.map((c) => (
                <tr key={c.company} className="hover:bg-muted/40">
                  <td className="p-3 font-semibold text-sm text-foreground">{c.company}</td>
                  <td className="p-3"><Badge variant="outline" className="text-[10px]">{c.tier}</Badge></td>
                  <td className="p-3 font-bold text-sm text-accent">{c.offers}</td>
                  <td className="p-3"><span className="flex items-center gap-1 text-[11px] font-medium text-success">Active Hiring Drive</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
