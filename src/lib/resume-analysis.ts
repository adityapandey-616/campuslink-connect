export type ResumeSkillCategory = "Technical" | "Soft skill";

export interface DetectedResumeSkill {
  name: string;
  category: ResumeSkillCategory;
  evidence: string;
}

export interface ResumeCompletenessCheck {
  label: string;
  pointsEarned: number;
  pointsAvailable: number;
  explanation: string;
}

export const RESUME_TARGET_ROLES = [
  "Software Developer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Data Analyst",
  "Data Scientist",
  "DevOps Engineer",
  "QA Engineer",
  "UI/UX Designer",
] as const;

export type ResumeTargetRole = (typeof RESUME_TARGET_ROLES)[number];

export interface ResumeAnalysis {
  skills: DetectedResumeSkill[];
  missingRoleSkills: string[];
  completenessScore: number;
  completenessChecks: ResumeCompletenessCheck[];
  resumeSuggestions: string[];
  careerRecommendations: string[];
}

const SKILL_KEYWORDS: Array<{
  name: string;
  category: ResumeSkillCategory;
  aliases: string[];
}> = [
  { name: "JavaScript", category: "Technical", aliases: ["JavaScript", "JS"] },
  { name: "TypeScript", category: "Technical", aliases: ["TypeScript", "TS"] },
  { name: "Python", category: "Technical", aliases: ["Python"] },
  { name: "Java", category: "Technical", aliases: ["Java"] },
  { name: "C#", category: "Technical", aliases: ["C#"] },
  { name: "C++", category: "Technical", aliases: ["C++"] },
  { name: "Go", category: "Technical", aliases: ["Golang", "Go language", "Go programming"] },
  { name: "Rust", category: "Technical", aliases: ["Rust"] },
  { name: "React", category: "Technical", aliases: ["React"] },
  { name: "React Native", category: "Technical", aliases: ["React Native"] },
  { name: "Angular", category: "Technical", aliases: ["Angular"] },
  { name: "Vue.js", category: "Technical", aliases: ["Vue.js", "Vue"] },
  { name: "Node.js", category: "Technical", aliases: ["Node.js", "NodeJS"] },
  { name: "Express.js", category: "Technical", aliases: ["Express.js", "Express"] },
  { name: "ASP.NET", category: "Technical", aliases: ["ASP.NET"] },
  { name: ".NET", category: "Technical", aliases: [".NET"] },
  {
    name: "SQL",
    category: "Technical",
    aliases: ["PostgreSQL", "MySQL", "SQL"],
  },
  { name: "MongoDB", category: "Technical", aliases: ["MongoDB"] },
  {
    name: "REST APIs",
    category: "Technical",
    aliases: ["RESTful APIs", "RESTful API", "REST APIs", "REST API"],
  },
  { name: "GraphQL", category: "Technical", aliases: ["GraphQL"] },
  { name: "HTML", category: "Technical", aliases: ["HTML"] },
  { name: "CSS", category: "Technical", aliases: ["CSS"] },
  { name: "Git", category: "Technical", aliases: ["Git"] },
  { name: "GitHub", category: "Technical", aliases: ["GitHub"] },
  { name: "Docker", category: "Technical", aliases: ["Docker"] },
  { name: "Kubernetes", category: "Technical", aliases: ["Kubernetes"] },
  { name: "AWS", category: "Technical", aliases: ["AWS", "Amazon Web Services"] },
  { name: "Azure", category: "Technical", aliases: ["Azure"] },
  { name: "Google Cloud", category: "Technical", aliases: ["Google Cloud", "GCP"] },
  { name: "Linux", category: "Technical", aliases: ["Linux"] },
  { name: "CI/CD", category: "Technical", aliases: ["CI/CD"] },
  { name: "Machine Learning", category: "Technical", aliases: ["Machine Learning"] },
  { name: "Statistics", category: "Technical", aliases: ["Statistics"] },
  { name: "Data Visualization", category: "Technical", aliases: ["Data Visualization"] },
  { name: "Power BI", category: "Technical", aliases: ["Power BI"] },
  { name: "Tableau", category: "Technical", aliases: ["Tableau"] },
  { name: "Excel", category: "Technical", aliases: ["Excel", "Microsoft Excel"] },
  { name: "Testing", category: "Technical", aliases: ["Testing", "Test automation"] },
  { name: "Selenium", category: "Technical", aliases: ["Selenium"] },
  { name: "Jest", category: "Technical", aliases: ["Jest"] },
  { name: "Figma", category: "Technical", aliases: ["Figma"] },
  { name: "User Research", category: "Technical", aliases: ["User Research"] },
  { name: "Wireframing", category: "Technical", aliases: ["Wireframing"] },
  { name: "Prototyping", category: "Technical", aliases: ["Prototyping"] },
  { name: "Accessibility", category: "Technical", aliases: ["Accessibility"] },
  { name: "Communication", category: "Soft skill", aliases: ["Communication"] },
  { name: "Teamwork", category: "Soft skill", aliases: ["Teamwork", "Team player"] },
  { name: "Leadership", category: "Soft skill", aliases: ["Leadership"] },
  { name: "Collaboration", category: "Soft skill", aliases: ["Collaboration"] },
  {
    name: "Problem-solving",
    category: "Soft skill",
    aliases: ["Problem-solving", "Problem solving"],
  },
  { name: "Critical thinking", category: "Soft skill", aliases: ["Critical thinking"] },
  { name: "Adaptability", category: "Soft skill", aliases: ["Adaptability"] },
  { name: "Time management", category: "Soft skill", aliases: ["Time management"] },
  { name: "Mentoring", category: "Soft skill", aliases: ["Mentoring"] },
  { name: "Presentation", category: "Soft skill", aliases: ["Presentation"] },
  { name: "Negotiation", category: "Soft skill", aliases: ["Negotiation"] },
  { name: "Creativity", category: "Soft skill", aliases: ["Creativity"] },
  {
    name: "Attention to detail",
    category: "Soft skill",
    aliases: ["Attention to detail"],
  },
];

const ROLE_REQUIREMENTS: Record<ResumeTargetRole, { skills: string[]; recommendation: string }> = {
  "Software Developer": {
    skills: ["Java", "Python", "JavaScript", "SQL", "Git", "Problem-solving"],
    recommendation:
      "Build and document a small application that demonstrates your chosen language, version control, and problem-solving process.",
  },
  "Frontend Developer": {
    skills: ["HTML", "CSS", "JavaScript", "TypeScript", "React", "Accessibility", "Git"],
    recommendation:
      "Build a responsive, accessible interface and describe the user problem, implementation choices, and outcome.",
  },
  "Backend Developer": {
    skills: ["Node.js", "Python", "Java", "SQL", "REST APIs", "Docker", "Git"],
    recommendation:
      "Create a small API with documented endpoints, data storage, tests, and a clear explanation of your design choices.",
  },
  "Full Stack Developer": {
    skills: ["HTML", "CSS", "JavaScript", "TypeScript", "React", "Node.js", "SQL", "Git"],
    recommendation:
      "Build a small end-to-end application and explain how its interface, API, and data store work together.",
  },
  "Data Analyst": {
    skills: ["SQL", "Python", "Excel", "Statistics", "Data Visualization", "Communication"],
    recommendation:
      "Publish a concise analysis using a real or public dataset, with clear methods, visualizations, and findings.",
  },
  "Data Scientist": {
    skills: ["Python", "SQL", "Statistics", "Machine Learning", "Data Visualization"],
    recommendation:
      "Document an end-to-end data project, including the dataset, evaluation method, limitations, and results.",
  },
  "DevOps Engineer": {
    skills: ["Linux", "Docker", "Kubernetes", "CI/CD", "AWS", "Git"],
    recommendation:
      "Automate a small deployment pipeline and document its build, test, and release steps.",
  },
  "QA Engineer": {
    skills: ["Testing", "Selenium", "JavaScript", "Python", "CI/CD", "Attention to detail"],
    recommendation:
      "Create a test plan and automated test suite for a small application, then describe coverage and discovered issues.",
  },
  "UI/UX Designer": {
    skills: [
      "Figma",
      "User Research",
      "Wireframing",
      "Prototyping",
      "Accessibility",
      "Communication",
    ],
    recommendation:
      "Present a compact case study showing user needs, design iterations, accessibility considerations, and feedback.",
  },
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findKeyword(text: string, keyword: string) {
  const expression = new RegExp(
    `(^|[^\\p{L}\\p{N}])(${escapeRegExp(keyword)})(?=$|[^\\p{L}\\p{N}])`,
    "iu",
  );
  const match = expression.exec(text);
  if (!match || match[2] === undefined) return null;
  return { start: match.index + (match[1]?.length ?? 0), length: match[2].length };
}

function getEvidence(text: string, start: number, length: number) {
  const lineStart = text.lastIndexOf("\n", start) + 1;
  const lineEndIndex = text.indexOf("\n", start + length);
  const lineEnd = lineEndIndex === -1 ? text.length : lineEndIndex;
  const maxLength = 220;
  let excerptStart = lineStart;
  let excerptEnd = lineEnd;

  if (excerptEnd - excerptStart > maxLength) {
    excerptStart = Math.max(lineStart, start - 80);
    excerptEnd = Math.min(lineEnd, excerptStart + maxLength);
    if (excerptEnd < start + length) {
      excerptEnd = start + length;
      excerptStart = Math.max(lineStart, excerptEnd - maxLength);
    }
  }

  const excerpt = text.slice(excerptStart, excerptEnd).trim();
  return `${excerptStart > lineStart ? "…" : ""}${excerpt}${excerptEnd < lineEnd ? "…" : ""}`;
}

function findDetectedSkills(resumeText: string): DetectedResumeSkill[] {
  const skills: DetectedResumeSkill[] = [];
  for (const skill of SKILL_KEYWORDS) {
    const matches = skill.aliases
      .map((alias) => findKeyword(resumeText, alias))
      .filter((match): match is NonNullable<typeof match> => match !== null)
      .sort((left, right) => left.start - right.start);
    const firstMatch = matches[0];
    if (firstMatch) {
      skills.push({
        name: skill.name,
        category: skill.category,
        evidence: getEvidence(resumeText, firstMatch.start, firstMatch.length),
      });
    }
  }
  return skills;
}

function hasHeading(resumeText: string, headings: string[]) {
  return resumeText.split(/\r?\n/).some((line) => {
    const normalized = line
      .trim()
      .replace(/^#+\s*/, "")
      .replace(/[*_`]/g, "")
      .replace(/:\s*$/, "")
      .trim()
      .toLowerCase();
    return headings.includes(normalized);
  });
}

function scoreCompleteness(resumeText: string, skills: DetectedResumeSkill[]) {
  const hasEmail = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(resumeText);
  const phoneCandidates = resumeText.match(/\+?\d[\d\s().-]{7,}\d/g) ?? [];
  const hasPhone = phoneCandidates.some((candidate) => (candidate.match(/\d/g) ?? []).length >= 10);
  const hasSummary = hasHeading(resumeText, [
    "summary",
    "professional summary",
    "profile",
    "objective",
    "professional objective",
  ]);
  const hasEducation = hasHeading(resumeText, ["education", "education and training", "academics"]);
  const hasExperience = hasHeading(resumeText, [
    "experience",
    "work experience",
    "professional experience",
    "employment history",
    "internships",
  ]);
  const hasProjects = hasHeading(resumeText, [
    "projects",
    "selected projects",
    "project experience",
  ]);
  const hasSkills =
    hasHeading(resumeText, [
      "skills",
      "technical skills",
      "core skills",
      "core competencies",
      "technical competencies",
    ]) || skills.length > 0;
  const hasMeasurableImpact =
    /\b\d+(?:[.,]\d+)?\b/.test(resumeText) &&
    /\b(?:increased|reduced|improved|delivered|saved|grew|accelerated|achieved|cut|raised)\b/i.test(
      resumeText,
    );

  const checks: ResumeCompletenessCheck[] = [
    {
      label: "Email address",
      pointsEarned: hasEmail ? 10 : 0,
      pointsAvailable: 10,
      explanation: "A recognizable email address appears in the resume text.",
    },
    {
      label: "Phone number",
      pointsEarned: hasPhone ? 10 : 0,
      pointsAvailable: 10,
      explanation: "A number with at least 10 digits appears as contact information.",
    },
    {
      label: "Professional summary",
      pointsEarned: hasSummary ? 10 : 0,
      pointsAvailable: 10,
      explanation: "A Summary, Profile, or Objective heading is present.",
    },
    {
      label: "Education",
      pointsEarned: hasEducation ? 15 : 0,
      pointsAvailable: 15,
      explanation: "An Education or Academics heading is present.",
    },
    {
      label: "Experience",
      pointsEarned: hasExperience ? 20 : 0,
      pointsAvailable: 20,
      explanation: "An Experience, Employment, or Internships heading is present.",
    },
    {
      label: "Projects",
      pointsEarned: hasProjects ? 15 : 0,
      pointsAvailable: 15,
      explanation: "A Projects heading is present.",
    },
    {
      label: "Skills",
      pointsEarned: hasSkills ? 10 : 0,
      pointsAvailable: 10,
      explanation: "A Skills heading or at least one recognized skill keyword is present.",
    },
    {
      label: "Measurable impact",
      pointsEarned: hasMeasurableImpact ? 10 : 0,
      pointsAvailable: 10,
      explanation: "At least one number and an impact verb appear in the text.",
    },
  ];

  return {
    checks,
    score: checks.reduce((total, check) => total + check.pointsEarned, 0),
  };
}

export function analyzeResume(resumeText: string, targetRole: ResumeTargetRole): ResumeAnalysis {
  const skills = findDetectedSkills(resumeText);
  const detectedNames = new Set(skills.map((skill) => skill.name));
  const roleRequirements = ROLE_REQUIREMENTS[targetRole];
  const missingRoleSkills = roleRequirements.skills.filter((skill) => !detectedNames.has(skill));
  const completeness = scoreCompleteness(resumeText, skills);
  const resumeSuggestions = completeness.checks
    .filter((check) => check.pointsEarned === 0)
    .map((check) => {
      const suggestions: Record<string, string> = {
        "Email address": "Add a professional email address near the top of the resume.",
        "Phone number":
          "Add a preferred contact number if you want recruiters to reach you by phone.",
        "Professional summary":
          "Consider adding a brief summary or objective that describes your focus and strengths.",
        Education: "Add an Education section with relevant qualifications and dates.",
        Experience:
          "Add relevant experience, internships, coursework, or volunteering where applicable.",
        Projects:
          "Add selected projects with your contribution, tools used, and a concrete outcome.",
        Skills: "Add a clearly labeled skills section with skills you can support with examples.",
        "Measurable impact":
          "Where accurate, add numbers or outcomes to explain the impact of your work.",
      };
      return suggestions[check.label] ?? `Review the ${check.label.toLowerCase()} section.`;
    });

  return {
    skills,
    missingRoleSkills,
    completenessScore: completeness.score,
    completenessChecks: completeness.checks,
    resumeSuggestions,
    careerRecommendations: [
      roleRequirements.recommendation,
      missingRoleSkills.length
        ? `The following role keywords were not detected: ${missingRoleSkills.join(", ")}. If you have this experience, add specific evidence; otherwise, consider learning or project work in these areas.`
        : "All predefined role keywords were detected. Make sure each is supported by a specific example in your resume.",
      "Compare your resume with current role descriptions and tailor the most relevant, accurate examples for each application.",
    ],
  };
}
