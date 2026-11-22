import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertCircle, ArrowRight, BookOpen, Sparkles } from "lucide-react";
import { useState } from "react";
import { Empty, Loading, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { myProfileQuery } from "@/lib/student-data";

type ResumeAnalysis = {
  skills: Array<{ name: string; evidence: string }>;
  developmentSuggestions: string[];
  careerGuidance: string[];
  limitations: string;
};

export const Route = createFileRoute("/_authenticated/student/insights")({
  component: SkillInsights,
});

function SkillInsights() {
  const profile = useQuery(myProfileQuery);
  const [resumeText, setResumeText] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [consent, setConsent] = useState(false);
  const analysis = useMutation({
    mutationFn: async (): Promise<ResumeAnalysis> => {
      const { data, error } = await supabase.functions.invoke<ResumeAnalysis>("resume-analysis", {
        body: { resumeText, targetRole, consent },
      });
      if (error) {
        let message = error.message;
        if ("context" in error && error.context instanceof Response) {
          const errorBody: unknown = await error.context
            .clone()
            .json()
            .catch(() => null);
          if (
            typeof errorBody === "object" &&
            errorBody !== null &&
            "error" in errorBody &&
            typeof errorBody.error === "string"
          ) {
            message = errorBody.error;
          }
        }
        throw new Error(`Resume analysis failed: ${message}`);
      }
      if (!data) throw new Error("Resume analysis returned no result.");
      return data;
    },
  });

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
        title="Career Guidance"
        subtitle="Optional AI resume analysis with evidence-backed skill extraction. No eligibility or opportunity match score is generated."
        action={
          <Link to="/student/opportunities">
            <Button>
              Browse opportunities
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        }
      />

      <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
        <h2 className="flex items-center gap-2 font-semibold">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          Data use and limitations
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Submitting sends the text to OpenAI for processing. This function does not save or log the
          resume text; OpenAI retention is subject to the configured OpenAI account policy.
          Extracted skills are shown only with a matching quote from your text. Suggestions are
          general guidance, not verified qualifications. Opportunity-specific gaps and match scores
          are unavailable until job requirements are connected to student skills.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          The server-side function and OpenAI secrets must be configured and deployed before this
          feature can return results. No response is mocked.
        </p>
      </section>

      <form
        className="space-y-4 rounded-xl border bg-card p-5"
        onSubmit={(event) => {
          event.preventDefault();
          analysis.mutate();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="resume-text">Resume text</Label>
          <Textarea
            id="resume-text"
            value={resumeText}
            onChange={(event) => setResumeText(event.target.value)}
            maxLength={16_000}
            rows={10}
            required
            placeholder="Paste resume text for this one-time analysis."
          />
          <p className="text-right text-xs text-muted-foreground">
            {resumeText.length.toLocaleString()} / 16,000
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="target-role">Target role (optional)</Label>
          <Input
            id="target-role"
            value={targetRole}
            onChange={(event) => setTargetRole(event.target.value)}
            maxLength={120}
            placeholder="e.g. Frontend Engineer"
          />
        </div>
        <label className="flex items-start gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
            className="mt-1"
          />
          <span>
            I consent to send this resume text to OpenAI for analysis under the configured account
            policy.
          </span>
        </label>
        {analysis.error && (
          <p className="text-sm text-destructive" role="alert">
            {analysis.error.message}
          </p>
        )}
        <Button type="submit" disabled={!consent || !resumeText.trim() || analysis.isPending}>
          <Sparkles className="mr-2 h-4 w-4" />
          {analysis.isPending ? "Analyzing..." : "Analyze resume"}
        </Button>
      </form>

      {analysis.data && (
        <section className="space-y-5 rounded-xl border bg-card p-5" aria-live="polite">
          <h2 className="flex items-center gap-2 font-semibold">
            <Sparkles className="h-4 w-4 text-accent" />
            Resume analysis
          </h2>
          <div>
            <h3 className="font-medium">Skills found in the submitted text</h3>
            {analysis.data.skills.length ? (
              <ul className="mt-2 space-y-2">
                {analysis.data.skills.map((skill) => (
                  <li key={`${skill.name}-${skill.evidence}`} className="rounded-md border p-3">
                    <div className="font-medium">{skill.name}</div>
                    <blockquote className="mt-1 border-l-2 pl-3 text-sm text-muted-foreground">
                      “{skill.evidence}”
                    </blockquote>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                No skill could be supported by an exact quote from the submitted text.
              </p>
            )}
          </div>
          <div>
            <h3 className="font-medium">Optional development suggestions</h3>
            {analysis.data.developmentSuggestions.length ? (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {analysis.data.developmentSuggestions.map((suggestion) => (
                  <li key={suggestion}>{suggestion}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">No suggestions returned.</p>
            )}
          </div>
          <div>
            <h3 className="font-medium">Career guidance</h3>
            {analysis.data.careerGuidance.length ? (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {analysis.data.careerGuidance.map((guidance) => (
                  <li key={guidance}>{guidance}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">No guidance returned.</p>
            )}
          </div>
          <p className="border-t pt-3 text-xs text-muted-foreground">{analysis.data.limitations}</p>
        </section>
      )}

      <section className="rounded-xl border bg-card p-5">
        <h2 className="flex items-center gap-2 font-semibold">
          <BookOpen className="h-4 w-4 text-accent" />
          Matching status
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          No match score is calculated. The current opportunities relation is not connected to the
          jobs and job-skills relations in the generated types.
        </p>
      </section>
    </div>
  );
}
