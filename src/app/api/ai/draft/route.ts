import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import { getSessionUser, canAccessAssignment } from "@/lib/rbac";
import { audit } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 60;

function client() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  return new Anthropic({ apiKey: key });
}

const MODEL = "claude-sonnet-4-5";

/** Strip preamble — Claude sometimes leads with "Here's a draft:" or similar. */
function stripPreamble(text: string): string {
  return text.replace(/^\s*(here(?:'s| is)?|sure|certainly|of course)[^.\n]*[.:]?\s*\n+/i, "").trim();
}

export async function POST(req: Request) {
  const u = await getSessionUser();
  if (!u) return new NextResponse("Unauthorized", { status: 401 });

  const c = client();
  if (!c) return NextResponse.json({ ok: false, error: "AI is not configured. Set ANTHROPIC_API_KEY in environment variables." }, { status: 503 });

  const body = await req.json();
  const { assignmentId, kind, questionId } = body as {
    assignmentId: string;
    kind: "summary" | "strengths" | "development" | "justification" | "next-steps";
    questionId?: string;
  };

  const a = await canAccessAssignment(u.id, u.role, assignmentId);
  if (!a) return new NextResponse("Forbidden", { status: 403 });

  const full = await db.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      employee: { select: { firstName: true, lastName: true, position: true, department: true, employmentType: true, hireDate: true } },
      manager: { select: { firstName: true, lastName: true, position: true } },
      cycle: true,
      template: { include: { sections: { orderBy: { sortOrder: "asc" }, include: { questions: { orderBy: { sortOrder: "asc" } } } } } },
      responses: true,
    },
  });
  if (!full) return new NextResponse("Not found", { status: 404 });

  // Build evaluation context
  const lines: string[] = [];
  lines.push(`Employee: ${full.employee.firstName} ${full.employee.lastName}`);
  lines.push(`Position: ${full.employee.position ?? "N/A"} · Department: ${full.employee.department ?? "N/A"}`);
  lines.push(`Employment: ${full.employee.employmentType}`);
  lines.push(`Cycle: ${full.cycle.name}`);
  lines.push(`Template: ${full.template.name}`);
  lines.push(``);
  lines.push(`=== Ratings & Justifications ===`);

  for (const s of full.template.sections) {
    if (s.kind !== "KPI" && s.kind !== "COMPETENCY") continue;
    lines.push(`\n## ${s.title}${s.weight > 0 ? ` (Weight: ${s.weight}%)` : ""}`);
    for (const q of s.questions) {
      if (q.inputType !== "rating") continue;
      const emp = full.responses.find((r) => r.questionId === q.id && r.authorRole === "EMPLOYEE");
      const mgr = full.responses.find((r) => r.questionId === q.id && r.authorRole === "MANAGER");
      lines.push(`- ${q.prompt}`);
      if (q.description) lines.push(`  (${q.description})`);
      if (emp?.rating != null) lines.push(`  • Self: ${emp.rating}/5${emp.comment ? ` — ${emp.comment}` : ""}`);
      if (mgr?.rating != null) lines.push(`  • Manager: ${mgr.rating}/5${mgr.comment ? ` — ${mgr.comment}` : ""}`);
    }
  }

  // Build the appropriate prompt
  let userPrompt = "";
  let title = "draft";

  if (kind === "justification" && questionId) {
    const q = full.template.sections.flatMap((s) => s.questions).find((qq) => qq.id === questionId);
    const mgr = full.responses.find((r) => r.questionId === questionId && r.authorRole === "MANAGER");
    if (!q || !mgr || mgr.rating == null) {
      return NextResponse.json({ ok: false, error: "Pick a rating first — AI needs the rating to draft a justification." }, { status: 400 });
    }
    userPrompt = `You are helping a manager draft a brief, evidence-based justification for the rating they gave on one specific competency.

Employee: ${full.employee.firstName} ${full.employee.lastName}
Position: ${full.employee.position ?? "N/A"}
Cycle: ${full.cycle.name}

Competency: ${q.prompt}
${q.description ? `Description: ${q.description}\n` : ""}
Rating given: ${mgr.rating}/5

Write a 2-3 sentence justification in first-person ("I observed...", "She demonstrated...", etc.) that:
- References specific behaviors typical of this performance level
- Is constructive and professional
- Does NOT invent specific projects or names — keep it generic but grounded in observable behavior
- Matches the rating: 5 = exceptional, 4 = exceeds, 3 = meets, 2 = partially meets, 1 = unsatisfactory

Return ONLY the justification text. No preamble, no quotation marks, no headers.`;
    title = "justification draft";
  } else if (kind === "strengths") {
    userPrompt = `You are an HR coach helping a manager write a Strengths section for an employee's quarterly performance review.

${lines.join("\n")}

Based on the ratings and justifications above, write a clear, professional "Strengths" section (3-5 bullet points) that:
- Highlights the highest-rated competencies and goals
- Uses specific behavioral language drawn from the existing justifications
- Is positive and constructive
- Avoids generic platitudes — reference concrete patterns from the data

Format as bullet points starting with "•". Return ONLY the bullet list. No preamble.`;
    title = "strengths draft";
  } else if (kind === "development") {
    userPrompt = `You are an HR coach helping a manager write a Developmental Goals section for an employee's quarterly performance review.

${lines.join("\n")}

Based on the ratings and justifications above, write a constructive "Developmental Goals" section (3-5 bullet points) that:
- Identifies the lowest-rated areas as growth opportunities
- Frames each as a forward-looking goal (e.g. "Build deeper expertise in...")
- Suggests specific actions or behaviors to develop
- Is encouraging, not critical

Format as bullet points starting with "•". Return ONLY the bullet list. No preamble.`;
    title = "developmental goals draft";
  } else if (kind === "next-steps") {
    userPrompt = `You are an HR coach helping a manager write the "Top 3 Goals for Next Quarter" section.

${lines.join("\n")}

Suggest 3 SMART goals for next quarter, balancing growth in weaker areas with stretch challenges in strong areas. Each goal should be:
- Specific and measurable
- Achievable in a quarter
- Tied to the employee's current role

Format as a numbered list (1. … 2. … 3. …). Return ONLY the list. No preamble.`;
    title = "next steps draft";
  } else if (kind === "summary") {
    userPrompt = `You are an HR coach helping a manager write a complete narrative summary of an employee's quarterly performance review.

${lines.join("\n")}

Write a balanced 4-6 sentence summary that:
- Opens with the overall performance level
- Highlights 1-2 key strengths
- Acknowledges 1-2 development areas constructively
- Closes with a forward-looking statement

Use professional, neutral tone. Return ONLY the summary paragraph. No preamble.`;
    title = "summary draft";
  } else {
    return new NextResponse("Invalid kind", { status: 400 });
  }

  try {
    const msg = await c.messages.create({
      model: MODEL,
      max_tokens: 800,
      messages: [{ role: "user", content: userPrompt }],
    });
    const text = msg.content
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("\n");
    const cleaned = stripPreamble(text);
    await audit(u.id, "AI_DRAFT", "Assignment", assignmentId, { kind, model: MODEL, tokens: (msg.usage as any)?.output_tokens ?? null });
    return NextResponse.json({ ok: true, draft: cleaned, kind });
  } catch (e: any) {
    console.error("AI draft failed:", e);
    return NextResponse.json({ ok: false, error: `AI request failed: ${e.message ?? "unknown error"}` }, { status: 500 });
  }
}
