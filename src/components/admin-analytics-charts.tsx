import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BriefcaseBusiness, Building2, CalendarCheck, GraduationCap } from "lucide-react";

interface AnalyticsChartsProps {
  branchData: Array<{ branch: string; students: number }>;
  applicationStatusData: Array<{ status: string; count: number }>;
  interviewStatusData: Array<{ status: string; count: number }>;
  companyOpportunityData: Array<{ company: string; opportunities: number }>;
}

const chartTooltip = {
  backgroundColor: "var(--card)",
  borderColor: "var(--border)",
  borderRadius: "8px",
  fontSize: "12px",
};

export function AnalyticsCharts({
  branchData,
  applicationStatusData,
  interviewStatusData,
  companyOpportunityData,
}: AnalyticsChartsProps) {
  const charts = [
    {
      title: "Student profiles by branch",
      description: "Live profiles.role = student records",
      icon: GraduationCap,
      data: branchData,
      category: "branch",
      value: "students",
    },
    {
      title: "Application status",
      description: "Applications linked to the selected student cohort",
      icon: BriefcaseBusiness,
      data: applicationStatusData,
      category: "status",
      value: "count",
    },
    {
      title: "Interview status",
      description: "All live interview records",
      icon: CalendarCheck,
      data: interviewStatusData,
      category: "status",
      value: "count",
    },
    {
      title: "Opportunities by company",
      description: "Live opportunities linked to companies",
      icon: Building2,
      data: companyOpportunityData,
      category: "company",
      value: "opportunities",
    },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {charts.map(({ title, description, icon: Icon, data, category, value }) => (
        <section key={title} className="rounded-xl border bg-card p-5 shadow-xs">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">{title}</h2>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <Icon className="h-5 w-5 shrink-0 text-accent" />
          </div>
          {data.length === 0 ? (
            <div className="grid h-[260px] place-items-center text-sm text-muted-foreground">
              No records available.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey={category} fontSize={11} stroke="var(--muted-foreground)" />
                <YAxis allowDecimals={false} fontSize={12} stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={chartTooltip} />
                <Bar dataKey={value} fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </section>
      ))}
    </div>
  );
}
