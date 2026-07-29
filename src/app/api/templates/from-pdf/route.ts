import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";
import { audit } from "@/lib/auth";

// Dynamic import; pdf-parse v2 uses a default export.
// Wrapped in a 15-second timeout to prevent malicious PDFs from hanging the function.
async function parsePdf(buf: Buffer): Promise<string> {
  const PDF_TIMEOUT_MS = 15_000;
  const mod: any = await import("pdf-parse");
  const pdfParse = mod.default || mod;

  const parsePromise = pdfParse(buf);
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("PDF parsing exceeded 15s timeout (file may be malformed or too complex)")), PDF_TIMEOUT_MS)
  );

  const out: any = await Promise.race([parsePromise, timeoutPromise]);
  return (out.text as string) || "";
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DraftQuestion = { prompt: string; description?: string; inputType: "rating" | "text" | "select"; sortOrder: number };
type DraftSection  = { title: string; kind: "KPI" | "COMPETENCY" | "COMMENT" | "RECOMMENDATION"; weight: number; sortOrder: number; questions: DraftQuestion[] };

function looksLikeHeading(line: string) {
  if (!line) return false;
  if (/^part\s+[ivx\d]+/i.test(line)) return true;
  if (/^section\s+\d/i.test(line)) return true;
  if (/^(performance|competenc|core\s+values|goals|objectives|contributions|recommendation|manager\s+feedback|comments|development)/i.test(line)) return true;
  return false;
}
function classifySection(title: string): DraftSection["kind"] {
  const t = title.toLowerCase();
  if (/recommend|regulariz|probation|decision/.test(t)) return "RECOMMENDATION";
  if (/comment|feedback|development|career|goal|strength|focus|next\s+quarter/.test(t)) return "COMMENT";
  if (/competenc|core\s+value|behav|culture|integrity|collaboration|innovation|learning|results/.test(t)) return "COMPETENCY";
  return "KPI";
}

function parseTextToTemplate(text: string): DraftSection[] {
  // Normalize whitespace, drop junk lines
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/[\u00A0\u200B]/g, " ").trim())
    .filter((l) => l.length > 1 && !/^(page\s*\d|\d+\s*of\s*\d+|confidential)$/i.test(l));

  const sections: DraftSection[] = [];
  let current: DraftSection | null = null;
  let sortQ = 0;

  const pushSection = (title: string) => {
    if (current) sections.push(current);
    sortQ = 0;
    current = {
      title: title.replace(/[:\-]+$/, "").trim().slice(0, 120),
      kind: classifySection(title),
      weight: 0, sortOrder: sections.length, questions: [],
    };
  };

  for (const raw of lines) {
    const line = raw.replace(/\s+/g, " ");
    if (looksLikeHeading(line) && line.length < 80) {
      pushSection(line);
      continue;
    }
    if (!current) pushSection("Imported Content");
    // Skip obvious instruction paragraphs (too long & purely prose)
    if (line.length > 220) continue;

    // Heuristic: rating prompt if it contains "rating", "score", ends with ":" or "____"
    const isRating =
      /\b(rating|score|rate\b|out of 5|1[-–]5)\b/i.test(line) ||
      /_+\s*$/.test(line) ||
      /^(collaboration|innovation|results|integrity|learning|teamwork|accountability|excellence|attendance|quality|productivity|job\s+knowledge)/i.test(line);

    current!.questions.push({
      prompt: line.replace(/[:_]+\s*$/, "").trim().slice(0, 200),
      inputType: isRating ? "rating" : "text",
      sortOrder: sortQ++,
    });
  }
  if (current) sections.push(current);

  // If we ended up with one giant section, distribute weights evenly across rating sections
  const ratingSections = sections.filter((s) => s.kind === "KPI" || s.kind === "COMPETENCY");
  if (ratingSections.length) {
    const w = Math.round(100 / ratingSections.length);
    ratingSections.forEach((s) => (s.weight = w));
  }
  // Trim noise: drop sections with no questions
  return sections.filter((s) => s.questions.length > 0);
}

export async function POST(req: Request) {
  const u = await getSessionUser();
  if (!u || u.role !== "HR_ADMIN") return new NextResponse("Forbidden", { status: 403 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const name = (form.get("name") as string) || "Imported Template";
  const type = ((form.get("type") as string) || "REGULAR").toUpperCase();

  if (!file) return new NextResponse("No file uploaded", { status: 400 });
  if (!file.type.includes("pdf") && !file.name.toLowerCase().endsWith(".pdf")) {
    return new NextResponse("Only PDF files are supported", { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) return new NextResponse("PDF too large (>10MB)", { status: 400 });

  let text = "";
  try {
    const buf = Buffer.from(await file.arrayBuffer());
    text = await parsePdf(buf);
  } catch (e: any) {
    return new NextResponse("Failed to read PDF: " + e.message, { status: 500 });
  }

  if (!text || text.trim().length < 40) {
    return new NextResponse("PDF appears to contain no extractable text (maybe scanned images — OCR not supported yet).", { status: 422 });
  }

  let sections = parseTextToTemplate(text);
  if (sections.length === 0) {
    sections = [{
      title: "Imported Content", kind: "KPI", weight: 100, sortOrder: 0,
      questions: [{ prompt: "Imported (edit me)", inputType: "text", sortOrder: 0 }],
    }];
  }

  const created = await db.template.create({
    data: {
      name, type, isActive: false, // start inactive so HR can review before assigning
      sections: {
        create: sections.map((s) => ({
          title: s.title, kind: s.kind, weight: s.weight, sortOrder: s.sortOrder,
          questions: { create: s.questions.map((q) => ({
            prompt: q.prompt, description: q.description || null,
            inputType: q.inputType, required: true, weight: 1, sortOrder: q.sortOrder,
          }))},
        })),
      },
    },
  });

  await audit(u.id, "IMPORT_TEMPLATE_PDF", "Template", created.id, {
    filename: file.name, bytes: file.size, sections: sections.length,
    questions: sections.reduce((n, s) => n + s.questions.length, 0),
  });

  return NextResponse.json({
    ok: true, id: created.id,
    summary: { sections: sections.length, questions: sections.reduce((n, s) => n + s.questions.length, 0) },
  });
}
