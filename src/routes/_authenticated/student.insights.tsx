import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, CheckCircle2, FileText, Sparkles } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Empty, Loading, PageHeader } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { myProfileQuery } from "@/lib/student-data";
import {
  analyzeResume,
  RESUME_TARGET_ROLES,
  type ResumeAnalysis,
  type ResumeTargetRole,
} from "@/lib/resume-analysis";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/student/insights")({
  component: SkillInsights,
});

function SkillInsights() {
  const profile = useQuery(myProfileQuery);
  const [resumeText, setResumeText] = useState("");
  const [targetRole, setTargetRole] = useState<ResumeTargetRole | "">("");
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);

  const handleAnalyze = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!targetRole || !resumeText.trim()) return;
    setAnalysis(analyzeResume(resumeText, targetRole));
  };

  if (profile.isLoading) return <Loading />;
  if (profile.error) {
    return (
      <Empty>
        Student profile could not be loaded:{" "}
        {profile.error instanceof Error ? profile.error.message : "Unknown Supabase error"}
      </Empty>
    );
  }
  if (!profile.data) return <Empty>A student profile is not available for this account.</Empty>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rule-Based Resume Analysis"
        subtitle="Keyword-based guidance runs locally in your browser. This feature is not generative AI."
        action={
          <Link to="/student/opportunities">
            <Button>
              Browse opportunities
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        }
      />

      <section className="rounded-xl border bg-muted/20 p-4">
        <h2 className="flex items-center gap-2 font-semibold">
          <FileText className="h-4 w-4 text-accent" />
          Local processing and limitations
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Resume text stays in this browser tab. It is not sent to Supabase or external AI services,
          and this feature does not save it. Skills are detected with a fixed keyword list and word
          boundaries; evidence quotes show where a matched keyword appears. Results can miss
          relevant wording or match context incorrectly.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          The completeness score checks for resume sections and simple text signals. It does not
          measure resume quality, verify credentials, or determine eligibility for a role.
        </p>
      </section>

      <form className="space-y-4 rounded-xl border bg-card p-5" onSubmit={handleAnalyze}>
        <div className="space-y-2">
          <Label htmlFor="resume-text">Resume text</Label>
          <Textarea
            id="resume-text"
            value={resumeText}
            onChange={(event) => {
              setResumeText(event.target.value);
              setAnalysis(null);
            }}
            maxLength={16_000}
            rows={10}
            required
            placeholder="Paste resume text for local keyword analysis."
          />
          <p className="text-right text-xs text-muted-foreground">
            {resumeText.length.toLocaleString()} / 16,000
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="target-role">Target role</Label>
          <select
            id="target-role"
            required
            value={targetRole}
            onChange={(event) => {
              const role = RESUME_TARGET_ROLES.find(
                (availableRole) => availableRole === event.target.value,
              );
              setTargetRole(role ?? "");
              setAnalysis(null);
            }}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option value="" disabled>
              Select a target role
            </option>
            {RESUME_TARGET_ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" disabled={!resumeText.trim() || !targetRole}>
          <Sparkles className="mr-2 h-4 w-4" />
          Analyze locally
        </Button>
      </form>

      {analysis && (
        <div className="space-y-5" aria-live="polite">
          <section className="rounded-xl border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">Resume completeness score</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Presence-based checklist only; it does not grade content quality.
                </p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-semibold">{analysis.completenessScore}</span>
                <span className="text-muted-foreground"> / 100</span>
              </div>
            </div>
            <div
              role="progressbar"
              aria-label="Resume completeness score"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={analysis.completenessScore}
              className="mt-4 h-2 overflow-hidden rounded-full bg-secondary"
            >
              <div
                className="h-full rounded-full bg-accent transition-[width]"
                style={{ width: `${analysis.completenessScore}%` }}
              />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Calculation: email +10, phone +10, summary +10, education +15, experience +20,
              projects +15, skills +10, measurable impact +10. Points are awarded only when each
              text signal is found.
            </p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {analysis.completenessChecks.map((check) => (
                <li key={check.label} className="flex items-start gap-2 rounded-md border p-3">
                  <CheckCircle2
                    className={`mt-0.5 h-4 w-4 shrink-0 ${
                      check.pointsEarned ? "text-accent" : "text-muted-foreground"
                    }`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex justify-between gap-2 text-sm font-medium">
                      {check.label}
                      <span>
                        {check.pointsEarned}/{check.pointsAvailable}
                      </span>
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {check.explanation}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border bg-card p-5">
            <h2 className="font-semibold">Detected skills and supporting evidence</h2>
            {analysis.skills.length ? (
              <ul className="mt-3 space-y-3">
                {analysis.skills.map((skill) => (
                  <li key={skill.name} className="rounded-md border p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{skill.name}</span>
                      <Badge variant="secondary">{skill.category}</Badge>
                    </div>
                    <blockquote className="mt-2 border-l-2 pl-3 text-sm text-muted-foreground">
                      “{skill.evidence}”
                    </blockquote>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                No skill keywords from the current rule list were found.
              </p>
            )}
          </section>

          <section className="rounded-xl border bg-card p-5">
            <h2 className="font-semibold">Skill gaps for {targetRole}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              These are predefined role keywords not found in the submitted text, not a judgment
              that you lack those skills.
            </p>
            {analysis.missingRoleSkills.length ? (
              <ul className="mt-3 space-y-2">
                {analysis.missingRoleSkills.map((skill) => (
                  <li key={skill} className="rounded-md border p-3">
                    <span className="font-medium">{skill}</span>
                    <p className="mt-1 text-sm text-muted-foreground">
                      No matching keyword was detected. If you have this experience, add a specific
                      example; otherwise, consider a learning exercise or project using {skill}.
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                All predefined role keywords were detected. Make sure your resume includes
                supporting examples.
              </p>
            )}
          </section>

          <div className="grid gap-5 md:grid-cols-2">
            <section className="rounded-xl border bg-card p-5">
              <h2 className="font-semibold">Resume improvement suggestions</h2>
              {analysis.resumeSuggestions.length ? (
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                  {analysis.resumeSuggestions.map((suggestion) => (
                    <li key={suggestion}>{suggestion}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  All completeness checklist signals were found. Review the content for accuracy and
                  clarity.
                </p>
              )}
            </section>
            <section className="rounded-xl border bg-card p-5">
              <h2 className="flex items-center gap-2 font-semibold">
                <BookOpen className="h-4 w-4 text-accent" />
                Career recommendations
              </h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                {analysis.careerRecommendations.map((recommendation) => (
                  <li key={recommendation}>{recommendation}</li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      )}

      <section className="rounded-xl border bg-card p-5">
        <h2 className="flex items-center gap-2 font-semibold">
          <BookOpen className="h-4 w-4 text-accent" />
          Matching status
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This tool compares text against a predefined keyword list only. It does not calculate
          opportunity matches, candidate eligibility, or verified qualifications.
        </p>
      </section>
    </div>
  );
}
