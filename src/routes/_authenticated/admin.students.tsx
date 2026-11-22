import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { GraduationCap, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Empty, Loading, PageHeader } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { adminProfilesQuery, type AdminProfile } from "@/lib/admin-live-data";

const EMPTY_PROFILES: AdminProfile[] = [];

export const Route = createFileRoute("/_authenticated/admin/students")({
  head: () => ({ meta: [{ title: "Student Management — Skill to Hire Admin" }] }),
  component: AdminStudentsPage,
});

function AdminStudentsPage() {
  const profiles = useQuery(adminProfilesQuery);
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");

  const students = (profiles.data ?? EMPTY_PROFILES).filter(
    (profile) => profile.role === "student",
  );
  const branches = [...new Set(students.map((student) => student.branch).filter(Boolean))].sort();
  const years = [
    ...new Set(students.map((student) => student.graduation_year).filter((year) => year !== null)),
  ].sort((a, b) => b - a);
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return students.filter((student) => {
      const matchesSearch =
        !needle ||
        student.full_name.toLowerCase().includes(needle) ||
        student.email.toLowerCase().includes(needle) ||
        student.branch?.toLowerCase().includes(needle);
      return (
        matchesSearch &&
        (branchFilter === "all" || student.branch === branchFilter) &&
        (yearFilter === "all" || String(student.graduation_year) === yearFilter)
      );
    });
  }, [students, search, branchFilter, yearFilter]);

  if (profiles.isLoading) return <Loading />;
  if (profiles.error) {
    return (
      <Empty>
        Student profiles could not be loaded:{" "}
        {profiles.error instanceof Error ? profiles.error.message : "Unknown Supabase error"}
      </Empty>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Directory"
        subtitle="Student accounts filtered by profiles.role from records visible under current policies. This directory reads profiles only; academic metrics and placement status are not joined here."
        action={
          <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm">
            <GraduationCap className="h-4 w-4 text-accent" />
            {students.length} student profiles
          </div>
        }
      />

      <div className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-3">
        <div className="relative sm:col-span-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, email, or branch"
            className="pl-9"
          />
        </div>
        <select
          value={branchFilter}
          onChange={(event) => setBranchFilter(event.target.value)}
          className="h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="all">All branches</option>
          {branches.map((branch) => (
            <option key={branch} value={branch ?? ""}>
              {branch}
            </option>
          ))}
        </select>
        <select
          value={yearFilter}
          onChange={(event) => setYearFilter(event.target.value)}
          className="h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="all">All graduation years</option>
          {years.map((year) => (
            <option key={year} value={String(year)}>
              {year}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <Empty>
          {students.length ? "No students match your filters." : "No student profiles found."}
        </Empty>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-secondary/60 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-3.5">Student</th>
                  <th className="p-3.5">Branch</th>
                  <th className="p-3.5">Graduation year</th>
                  <th className="p-3.5">Account created</th>
                  <th className="p-3.5">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((student) => (
                  <tr key={student.id} className="hover:bg-muted/30">
                    <td className="p-3.5">
                      <div className="font-medium">{student.full_name || "Name unavailable"}</div>
                      <div className="text-xs text-muted-foreground">{student.email}</div>
                    </td>
                    <td className="p-3.5">
                      {student.branch ? (
                        <Badge variant="outline">{student.branch}</Badge>
                      ) : (
                        <span className="text-muted-foreground">Not set</span>
                      )}
                    </td>
                    <td className="p-3.5">{student.graduation_year ?? "Not set"}</td>
                    <td className="p-3.5 text-muted-foreground">
                      {new Date(student.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3.5">{student.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t bg-secondary/30 px-4 py-2 text-xs text-muted-foreground">
            Showing {filtered.length} of {students.length}. Profile edits and placement management
            remain unavailable here because their write policies and related student-record mappings
            have not been verified against the deployed database.
          </div>
        </div>
      )}
    </div>
  );
}
