const defaultOrigins = [
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

const envOrigins = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = new Set([...defaultOrigins, ...envOrigins]);

const maxResumeLength = 16_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function response(request: Request, payload: Record<string, unknown>, status: number): Response {
  const headers = new Headers({
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    Vary: "Origin",
  });
  const origin = request.headers.get("Origin");
  if (origin && allowedOrigins.has(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set(
      "Access-Control-Allow-Headers",
      "authorization, apikey, x-client-info, content-type",
    );
    headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    headers.set("Access-Control-Max-Age", "86400");
  }
  return new Response(JSON.stringify(payload), { status, headers });
}

function hasEvidenceInResume(evidence: string, resumeText: string): boolean {
  return resumeText.toLowerCase().includes(evidence.toLowerCase());
}

Deno.serve(async (request) => {
  const origin = request.headers.get("Origin");
  if (!origin || !allowedOrigins.has(origin)) {
    return response(request, { error: "Origin is not allowed." }, 403);
  }

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Max-Age": "86400",
        Vary: "Origin",
      },
    });
  }

  if (request.method !== "POST") {
    return response(request, { error: "Method not allowed." }, 405);
  }

  const authorization = request.headers.get("Authorization");
  const accessToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!accessToken) {
    return response(request, { error: "Sign in is required." }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  const openAiKey = Deno.env.get("OPENAI_API_KEY");
  const openAiModel = Deno.env.get("OPENAI_MODEL");
  if (!supabaseUrl || !supabaseKey || !openAiKey || !openAiModel) {
    console.error("[resume-analysis] Required server configuration is missing.");
    return response(request, { error: "Resume analysis is not configured on the server." }, 503);
  }

  const projectUrl = supabaseUrl.replace(/\/+$/, "");
  let authResponse: Response;
  try {
    authResponse = await fetch(`${projectUrl}/auth/v1/user`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    console.error("[resume-analysis] Supabase Auth could not be reached.");
    return response(request, { error: "Your session could not be verified." }, 503);
  }
  if (!authResponse.ok) {
    return response(request, { error: "Your session is invalid or expired." }, 401);
  }
  let authPayload: unknown;
  try {
    authPayload = await authResponse.json();
  } catch {
    return response(request, { error: "Supabase Auth returned an invalid response." }, 503);
  }
  if (!isRecord(authPayload) || typeof authPayload.id !== "string") {
    return response(request, { error: "Your session is invalid or expired." }, 401);
  }

  let profileResponse: Response;
  try {
    const profileUrl = new URL(`${projectUrl}/rest/v1/profiles`);
    profileUrl.searchParams.set("select", "role");
    profileUrl.searchParams.set("id", `eq.${authPayload.id}`);
    profileUrl.searchParams.set("limit", "1");
    profileResponse = await fetch(profileUrl, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    console.error("[resume-analysis] The authenticated profile query could not be reached.");
    return response(request, { error: "Your account role could not be verified." }, 503);
  }
  if (!profileResponse.ok) {
    console.error("[resume-analysis] Could not verify the authenticated profile role.");
    return response(request, { error: "Your account role could not be verified." }, 503);
  }
  let profilePayload: unknown;
  try {
    profilePayload = await profileResponse.json();
  } catch {
    return response(request, { error: "The account role response was invalid." }, 503);
  }
  const role =
    Array.isArray(profilePayload) && isRecord(profilePayload[0]) ? profilePayload[0].role : null;
  if (role !== "student") {
    return response(
      request,
      { error: "Resume analysis is available to student accounts only." },
      403,
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return response(request, { error: "Request body must be valid JSON." }, 400);
  }
  if (!isRecord(body)) {
    return response(request, { error: "Request body must be a JSON object." }, 400);
  }

  const resumeText = typeof body.resumeText === "string" ? body.resumeText.trim() : "";
  const targetRole = typeof body.targetRole === "string" ? body.targetRole.trim() : "";
  if (body.consent !== true) {
    return response(request, { error: "Consent to OpenAI processing is required." }, 400);
  }
  if (!resumeText) {
    return response(request, { error: "Resume text is required." }, 400);
  }
  if (resumeText.length > maxResumeLength) {
    return response(
      request,
      { error: `Resume text must be ${maxResumeLength} characters or fewer.` },
      413,
    );
  }
  if (targetRole.length > 120) {
    return response(request, { error: "Target role must be 120 characters or fewer." }, 400);
  }

  let providerResponse: Response;
  try {
    providerResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAiKey}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(45_000),
      body: JSON.stringify({
        model: openAiModel,
        temperature: 0.2,
        max_tokens: 1200,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Analyze the submitted resume conservatively. Return one JSON object with skills array of objects {name,evidence}; developmentSuggestions array of strings; careerGuidance array of strings. List a skill only when its name is explicitly present in the resume, and make evidence an exact, short quote from the resume that contains the skill name. Never infer or invent skills, academic qualifications, employers, dates, achievements, or a resume summary. Development suggestions must be framed as optional future learning, not as claims about missing qualifications. Do not assign eligibility, a match score, or an opportunity-specific skill gap. Keep each list concise and include no other fields.",
          },
          {
            role: "user",
            content: JSON.stringify({ resumeText, targetRole: targetRole || null }),
          },
        ],
      }),
    });
  } catch {
    console.error("[resume-analysis] OpenAI request could not be reached.");
    return response(
      request,
      { error: "The AI provider could not be reached. Please retry later." },
      502,
    );
  }

  if (!providerResponse.ok) {
    if (providerResponse.status === 429) {
      return response(
        request,
        { error: "OpenAI rate limit or quota reached. Please retry later." },
        429,
      );
    }
    console.error(
      `[resume-analysis] OpenAI request failed with status ${providerResponse.status}.`,
    );
    return response(request, { error: "The AI provider could not complete this analysis." }, 502);
  }

  let providerPayload: unknown;
  try {
    providerPayload = await providerResponse.json();
  } catch {
    return response(request, { error: "The AI provider returned an invalid response." }, 502);
  }

  const choice =
    isRecord(providerPayload) && Array.isArray(providerPayload.choices)
      ? providerPayload.choices[0]
      : null;
  const message = isRecord(choice) && isRecord(choice.message) ? choice.message.content : null;
  if (typeof message !== "string") {
    return response(request, { error: "The AI provider returned an invalid response." }, 502);
  }

  let analysis: unknown;
  try {
    analysis = JSON.parse(message) as unknown;
  } catch {
    return response(request, { error: "The AI provider returned invalid analysis data." }, 502);
  }
  if (
    !isRecord(analysis) ||
    !Array.isArray(analysis.skills) ||
    !Array.isArray(analysis.developmentSuggestions) ||
    !Array.isArray(analysis.careerGuidance)
  ) {
    return response(request, { error: "The AI provider returned incomplete analysis data." }, 502);
  }

  const skills: Array<{ name: string; evidence: string }> = [];
  for (const item of analysis.skills) {
    if (!isRecord(item) || typeof item.name !== "string" || typeof item.evidence !== "string") {
      return response(request, { error: "The AI provider returned invalid skill evidence." }, 502);
    }
    const name = item.name.trim();
    const evidence = item.evidence.trim();
    if (
      !name ||
      !evidence ||
      !evidence.toLowerCase().includes(name.toLowerCase()) ||
      !hasEvidenceInResume(evidence, resumeText)
    ) {
      return response(
        request,
        { error: "The AI provider returned unsupported skill evidence." },
        502,
      );
    }
    skills.push({ name, evidence });
  }
  if (skills.length > 20) {
    return response(request, { error: "The AI provider returned too many extracted skills." }, 502);
  }

  const suggestions = (value: unknown): string[] | null => {
    if (!Array.isArray(value) || value.length > 12) return null;
    const items: string[] = [];
    for (const item of value) {
      if (typeof item !== "string" || !item.trim() || item.length > 400) return null;
      items.push(item.trim());
    }
    return items;
  };
  const developmentSuggestions = suggestions(analysis.developmentSuggestions);
  const careerGuidance = suggestions(analysis.careerGuidance);
  if (!developmentSuggestions || !careerGuidance) {
    return response(request, { error: "The AI provider returned incomplete analysis data." }, 502);
  }

  return response(
    request,
    {
      skills,
      developmentSuggestions,
      careerGuidance,
      limitations:
        "AI suggestions are not verified qualifications. No eligibility or opportunity match score is calculated.",
    },
    200,
  );
});
