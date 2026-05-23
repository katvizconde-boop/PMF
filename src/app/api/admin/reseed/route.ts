import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Rebuilds demo data. Protected by CRON_SECRET (so only HR admin or deploy hook
 * can trigger). Wipes all data and recreates the seed state from code.
 *
 * Call: POST /api/admin/reseed
 *       Header: Authorization: Bearer <CRON_SECRET>
 */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return new NextResponse("CRON_SECRET not configured", { status: 500 });
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) return new NextResponse("Unauthorized", { status: 401 });

  // Wipe (preserve Department customizations)
  await db.response.deleteMany();
  await db.assignment.deleteMany();
  await db.cycle.deleteMany();
  await db.question.deleteMany();
  await db.section.deleteMany();
  await db.template.deleteMany();
  await db.goal.deleteMany();
  await db.auditLog.deleteMany();
  await db.user.deleteMany();

  const pw = await bcrypt.hash("password123", 10);
  const mk = (e: any) => db.user.create({ data: { ...e, passwordHash: pw } });

  const hr      = await mk({ email: "hr@company.com",       firstName: "Hannah",      lastName: "HR",       position: "HR Director",            role: "HR_ADMIN", employmentType: "REGULAR", company: "7GEN",                department: "HR and Admin Team" });
  const tmLead  = await mk({ email: "katlyn@company.com",   firstName: "Katlyn Kaye", lastName: "Vizconde", position: "Talent Management Lead", role: "MANAGER",  employmentType: "REGULAR", company: "7GEN",                department: "HR and Admin Team", managerId: hr.id });
  const engMgr  = await mk({ email: "manager@company.com",  firstName: "Alex",        lastName: "Rivera",   position: "Engineering Manager",    role: "MANAGER",  employmentType: "REGULAR", company: "7GEN",                department: "Back End Team",     managerId: hr.id });
  const csLead  = await mk({ email: "patricia@company.com", firstName: "Patricia",    lastName: "Lim",      position: "Client Success Lead",    role: "MANAGER",  employmentType: "REGULAR", company: "M2.0 Communications", department: "Client Success Team", managerId: hr.id });
  const mmLead  = await mk({ email: "martin@company.com",   firstName: "Martin",      lastName: "Cruz",     position: "Operations Lead",        role: "MANAGER",  employmentType: "REGULAR", company: "Media Meter Inc",     department: "Operations Team",   managerId: hr.id });
  const rdbLead = await mk({ email: "vince@company.com",    firstName: "Vince",       lastName: "Aquino",   position: "Reports Lead",           role: "MANAGER",  employmentType: "REGULAR", company: "Rythmos DB Inc.",     department: "SG Reports",        managerId: hr.id });

  const employees = await Promise.all([
    mk({ email: "krystle@company.com",      firstName: "Krystle Anne", lastName: "Tacpalan",     position: "HR-Recruitment and Onboarding Specialist", role: "EMPLOYEE", employmentType: "REGULAR",      company: "7GEN",                department: "HR and Admin Team",                 managerId: tmLead.id, hireDate: new Date("2023-01-15") }),
    mk({ email: "janella@company.com",      firstName: "Janella",      lastName: "Jose",         position: "HR-Recruitment and Onboarding Specialist", role: "EMPLOYEE", employmentType: "PROBATIONARY", company: "7GEN",                department: "HR and Admin Team",                 managerId: tmLead.id, hireDate: new Date("2026-01-15") }),
    mk({ email: "jal@company.com",          firstName: "Jal",          lastName: "Santos",       position: "HR Specialist",                            role: "EMPLOYEE", employmentType: "REGULAR",      company: "7GEN",                department: "HR and Admin Team",                 managerId: tmLead.id, hireDate: new Date("2024-06-01") }),
    mk({ email: "marco@company.com",        firstName: "Marco",        lastName: "Dela Cruz",    position: "Backend Engineer",                         role: "EMPLOYEE", employmentType: "REGULAR",      company: "7GEN",                department: "Back End Team",                     managerId: engMgr.id, hireDate: new Date("2023-09-15") }),
    mk({ email: "carlos@company.com",       firstName: "Carlos",       lastName: "Mendoza",      position: "QA Analyst",                               role: "EMPLOYEE", employmentType: "PROBATIONARY", company: "7GEN",                department: "Front End and QA Team",             managerId: engMgr.id, hireDate: new Date("2026-02-01") }),
    mk({ email: "diana@company.com",        firstName: "Diana",        lastName: "Reyes",        position: "ML Engineer",                              role: "EMPLOYEE", employmentType: "REGULAR",      company: "7GEN",                department: "Data Collection and Machine Learning Team", managerId: engMgr.id, hireDate: new Date("2024-01-20") }),
    mk({ email: "angela@company.com",       firstName: "Angela",       lastName: "Torres",       position: "Content Strategist",                       role: "EMPLOYEE", employmentType: "REGULAR",      company: "M2.0 Communications", department: "Content Team",                      managerId: csLead.id, hireDate: new Date("2024-03-15") }),
    mk({ email: "raymond@company.com",      firstName: "Raymond",      lastName: "Garcia",       position: "Creative Designer",                        role: "EMPLOYEE", employmentType: "REGULAR",      company: "M2.0 Communications", department: "Creatives Team",                    managerId: csLead.id, hireDate: new Date("2024-05-10") }),
    mk({ email: "liza@company.com",         firstName: "Liza",         lastName: "Bautista",     position: "Business Analyst",                         role: "EMPLOYEE", employmentType: "PROBATIONARY", company: "M2.0 Communications", department: "Business and Strategy Team",        managerId: csLead.id, hireDate: new Date("2026-01-10") }),
    mk({ email: "noel@company.com",         firstName: "Noel",         lastName: "Fernandez",    position: "Business Development Associate",           role: "EMPLOYEE", employmentType: "REGULAR",      company: "Media Meter Inc",     department: "Business Development Team",         managerId: mmLead.id, hireDate: new Date("2024-02-01") }),
    mk({ email: "cecille@company.com",      firstName: "Cecille",      lastName: "Navarro",      position: "Client Success Associate",                 role: "EMPLOYEE", employmentType: "REGULAR",      company: "Media Meter Inc",     department: "Client Success Team",               managerId: mmLead.id, hireDate: new Date("2024-07-15") }),
    mk({ email: "ivan@company.com",         firstName: "Ivan",         lastName: "Villanueva",   position: "Reports Analyst",                          role: "EMPLOYEE", employmentType: "REGULAR",      company: "Rythmos DB Inc.",     department: "SG Reports",                        managerId: rdbLead.id, hireDate: new Date("2023-11-20") }),
    mk({ email: "mia@company.com",          firstName: "Mia",          lastName: "Santiago",     position: "Newsletter Editor",                        role: "EMPLOYEE", employmentType: "REGULAR",      company: "Rythmos DB Inc.",     department: "SG Newsletter",                     managerId: rdbLead.id, hireDate: new Date("2024-04-05") }),
    mk({ email: "paolo@company.com",        firstName: "Paolo",        lastName: "Ramos",        position: "Reports Analyst (AU)",                     role: "EMPLOYEE", employmentType: "PROBATIONARY", company: "Rythmos DB Inc.",     department: "AU Reports",                        managerId: rdbLead.id, hireDate: new Date("2026-01-25") }),
    mk({ email: "yvonne@company.com",       firstName: "Yvonne",       lastName: "Del Rosario",  position: "Innovations Associate",                    role: "EMPLOYEE", employmentType: "REGULAR",      company: "Rythmos DB Inc.",     department: "Innovations Team",                  managerId: rdbLead.id, hireDate: new Date("2024-09-10") }),
    mk({ email: "employee@company.com",     firstName: "Demo",         lastName: "Employee",     position: "HR Associate",                             role: "EMPLOYEE", employmentType: "REGULAR",      company: "7GEN",                department: "HR and Admin Team",                 managerId: tmLead.id, hireDate: new Date("2023-01-15") }),
    mk({ email: "probationary@company.com", firstName: "Demo",         lastName: "Probationary", position: "Junior Specialist",                        role: "EMPLOYEE", employmentType: "PROBATIONARY", company: "7GEN",                department: "HR and Admin Team",                 managerId: tmLead.id, hireDate: new Date("2026-01-15") }),
  ]);

  // Templates (minimal — just enough for demo; full structure created by seed.ts)
  const regular = await db.template.create({
    data: {
      name: "Regular Employee - Quarterly Evaluation", type: "REGULAR",
      sections: { create: [
        { title: "PART I: Contributions and Achievements", kind: "KPI", weight: 35, sortOrder: 1,
          questions: { create: [
            { prompt: "Overall Contribution Rating for the Quarter", description: "Overall contribution.", inputType: "rating", sortOrder: 1, required: true, weight: 1 },
            { prompt: "Significant Comments (Evidence)", inputType: "text", sortOrder: 2, required: false, weight: 0 },
          ]}},
        { title: "PART II: Core Competencies", kind: "COMPETENCY", weight: 30, sortOrder: 2,
          questions: { create: [
            { prompt: "Collaboration and Leadership", description: "Working together with the team by being dependable.", inputType: "rating", sortOrder: 1, required: true, weight: 1 },
            { prompt: "Emphasis for Results", description: "Strong bias for action and measurable results.", inputType: "rating", sortOrder: 2, required: true, weight: 1 },
            { prompt: "Innovation and Disruption", description: "Always seeking newer and better ways.", inputType: "rating", sortOrder: 3, required: true, weight: 1 },
            { prompt: "Integrity", description: "Aligns actions with words, operates with transparency.", inputType: "rating", sortOrder: 4, required: true, weight: 1 },
            { prompt: "Passion for Learning", description: "Learns from each person and project.", inputType: "rating", sortOrder: 5, required: true, weight: 1 },
          ]}},
        { title: "PART III: Individual Goals", kind: "KPI", weight: 35, sortOrder: 3,
          questions: { create: [
            { prompt: "Goal 1 — Description", inputType: "text", sortOrder: 1, required: false, weight: 0 },
            { prompt: "Goal 1 — Achievement Rating", inputType: "rating", sortOrder: 2, required: true, weight: 1 },
            { prompt: "Goal 2 — Description", inputType: "text", sortOrder: 3, required: false, weight: 0 },
            { prompt: "Goal 2 — Achievement Rating", inputType: "rating", sortOrder: 4, required: true, weight: 1 },
            { prompt: "Goal 3 — Description", inputType: "text", sortOrder: 5, required: false, weight: 0 },
            { prompt: "Goal 3 — Achievement Rating", inputType: "rating", sortOrder: 6, required: true, weight: 1 },
          ]}},
        { title: "PART IV: Summary", kind: "COMMENT", weight: 0, sortOrder: 4,
          questions: { create: [
            { prompt: "Strengths", inputType: "text", sortOrder: 1, required: false, weight: 0 },
            { prompt: "Developmental Goals", inputType: "text", sortOrder: 2, required: false, weight: 0 },
          ]}},
        { title: "PART V: Next Steps and Tenure Considerations", kind: "RECOMMENDATION", weight: 0, sortOrder: 5,
          questions: { create: [
            { prompt: "Top 3 Goals for Next Quarter", inputType: "text", sortOrder: 1, required: false, weight: 0 },
            { prompt: "Action Plan", inputType: "text", sortOrder: 2, required: false, weight: 0 },
            { prompt: "Recommendation", inputType: "select",
              options: JSON.stringify(["No Action", "Promotion", "Transfer", "Salary Increase", "Individual Development Plan", "Other"]),
              sortOrder: 3, required: true, weight: 0 },
            { prompt: "Justification", inputType: "text", sortOrder: 4, required: false, weight: 0 },
          ]}},
      ]},
    },
    include: { sections: { include: { questions: true } } },
  });

  // Probationary (full — 6 perf subsections + 9 core-values subsections)
  const probWeightPerf = 50 / 6;
  const probWeightCore = 50 / 9;
  let so = 1;
  const probSections = [
    ["PART I-A: Job Knowledge and Technical Skills", "KPI", probWeightPerf, [
      "Demonstrates thorough understanding of job responsibilities and requirements",
      "Masters required technical tools and software",
      "Applies technical knowledge effectively to solve problems",
    ]],
    ["PART I-B: Quality of Work", "KPI", probWeightPerf, [
      "Meets quality standards consistently",
      "Follows established procedures and guidelines",
      "Pays attention to detail and documents work properly and thoroughly",
    ]],
    ["PART I-C: Productivity and Efficiency", "KPI", probWeightPerf, [
      "Completes assignments within deadlines",
      "Manages multiple tasks effectively",
      "Takes initiative to handle additional responsibilities when needed",
    ]],
    ["PART I-D: Communication", "KPI", probWeightPerf, [
      "Expresses ideas clearly and concisely in verbal and written form",
      "Provides timely updates on projects and tasks",
      "Effectively communicates with different stakeholders",
    ]],
    ["PART I-E: Problem-Solving", "KPI", probWeightPerf, [
      "Identifies problems proactively",
      "Develops effective solutions",
      "Evaluates outcomes and adjusts approach as needed",
    ]],
    ["PART I-F: Professional Conduct", "KPI", probWeightPerf, [
      "Maintains consistent attendance and punctuality",
      "Follows company policies and procedures",
      "Manages workplace relationships professionally",
    ]],
    ["PART II-1: Humility", "COMPETENCY", probWeightCore, [
      "Accepts feedback constructively", "Acknowledges mistakes and learns from them",
      "Shows respect for all team members regardless of position", "Shares credit for success with others",
    ]],
    ["PART II-2: Upholds Fairness", "COMPETENCY", probWeightCore, [
      "Treats all colleagues with equal respect", "Makes unbiased decisions",
      "Follows procedures consistently", "Addresses conflicts impartially",
    ]],
    ["PART II-3: Mission-Driven", "COMPETENCY", probWeightCore, [
      "Aligns work with company goals", "Shows commitment to organization's vision",
      "Makes decisions that support long-term objectives", "Understands and promotes company mission",
    ]],
    ["PART II-4: Accountability", "COMPETENCY", probWeightCore, [
      "Takes ownership of responsibilities", "Meets deadlines consistently",
      "Admits and corrects mistakes", "Can be relied upon by team members",
    ]],
    ["PART II-5: Innovative", "COMPETENCY", probWeightCore, [
      "Suggests process improvements", "Brings creative solutions to challenges",
      "Adapts well to change", "Shows initiative in problem-solving",
    ]],
    ["PART II-6: Collaboration", "COMPETENCY", probWeightCore, [
      "Works effectively in team settings", "Supports colleagues' success",
      "Communicates clearly and constructively", "Contributes positively to team projects",
    ]],
    ["PART II-7: Openness", "COMPETENCY", probWeightCore, [
      "Receptive to new ideas", "Transparent in communication",
      "Shares knowledge with team members", "Welcomes diverse perspectives",
    ]],
    ["PART II-8: Resilience", "COMPETENCY", probWeightCore, [
      "Maintains effectiveness under pressure", "Adapts to changing priorities",
      "Recovers quickly from setbacks", "Maintains positive attitude during challenges",
    ]],
    ["PART II-9: Excellence", "COMPETENCY", probWeightCore, [
      "Consistently delivers high-quality work", "Sets high personal standards",
      "Seeks opportunities for improvement", "Goes above and beyond expectations",
    ]],
  ] as const;

  const probTmpl = await db.template.create({
    data: {
      name: "Probationary / Contractual - Performance & Core Values", type: "PROBATIONARY",
      sections: { create: [
        ...probSections.map(([title, kind, weight, qs]: any) => ({
          title, kind, weight, sortOrder: so++,
          questions: { create: qs.map((q: string, i: number) => ({
            prompt: q, inputType: "rating", sortOrder: i + 1, required: true, weight: 1,
          }))},
        })),
        { title: "PART IV: Development Plan", kind: "COMMENT", weight: 0, sortOrder: so++,
          questions: { create: [
            { prompt: "Area for Improvement #1 and Action Plan", inputType: "text", sortOrder: 1, required: false, weight: 0 },
            { prompt: "Area for Improvement #2 and Action Plan", inputType: "text", sortOrder: 2, required: false, weight: 0 },
            { prompt: "Area for Improvement #3 and Action Plan", inputType: "text", sortOrder: 3, required: false, weight: 0 },
            { prompt: "Evaluator Comments", inputType: "text", sortOrder: 4, required: false, weight: 0 },
            { prompt: "Employee Comments", inputType: "text", sortOrder: 5, required: false, weight: 0 },
          ]}},
        { title: "Tenure Recommendation", kind: "RECOMMENDATION", weight: 0, sortOrder: so++,
          questions: { create: [
            { prompt: "Recommendation", inputType: "select",
              options: JSON.stringify(["Regular Status", "Probationary Status (Extended)", "Performance Improvement Plan", "Terminate"]),
              sortOrder: 1, required: true, weight: 0 },
            { prompt: "Justification for Recommendation", inputType: "text", sortOrder: 2, required: false, weight: 0 },
          ]}},
      ]},
    },
    include: { sections: { include: { questions: true } } },
  });

  // Cycles
  const cQ4 = await db.cycle.create({ data: { name: "Q4 2025", periodStart: new Date("2025-10-01"), periodEnd: new Date("2025-12-31"), dueDate: new Date("2026-01-15") }});
  const cQ1 = await db.cycle.create({ data: { name: "Q1 2026", periodStart: new Date("2026-01-01"), periodEnd: new Date("2026-03-31"), dueDate: new Date("2026-04-15") }});
  const cQ2 = await db.cycle.create({ data: { name: "Q2 2026", periodStart: new Date("2026-04-01"), periodEnd: new Date("2026-06-30"), dueDate: new Date("2026-07-15") }});

  // Historical finalized (score-only; skip full response rows for speed)
  const histSamples: Array<[number, string, string, number]> = [
    [0, tmLead.id, cQ4.id, 4.2],   [0, tmLead.id, cQ1.id, 4.5],
    [2, tmLead.id, cQ4.id, 3.5],
    [3, engMgr.id, cQ4.id, 4.0],   [3, engMgr.id, cQ1.id, 4.3],
    [5, engMgr.id, cQ4.id, 4.1],   [5, engMgr.id, cQ1.id, 4.4],
    [6, csLead.id, cQ4.id, 4.0],   [6, csLead.id, cQ1.id, 4.5],
    [7, csLead.id, cQ4.id, 3.8],
    [9, mmLead.id, cQ4.id, 3.9],
  ];
  for (const [idx, mgrId, cycleId, score] of histSamples) {
    const emp = employees[idx];
    const a = await db.assignment.create({
      data: { cycleId, templateId: regular.id, employeeId: emp.id, managerId: mgrId,
        state: "FINALIZED", selfSubmittedAt: new Date(), managerSubmittedAt: new Date(),
        hrApprovedAt: new Date(), finalizedAt: new Date(), overallScore: score, recommendation: "No Action" },
    });
    // Record a few ratings so the Summary table has real numbers
    const ratingQs = regular.sections.flatMap((s) => s.questions).filter((q) => q.inputType === "rating");
    for (const q of ratingQs) {
      await db.response.create({ data: { assignmentId: a.id, questionId: q.id, authorRole: "MANAGER", rating: score, comment: "Solid." }});
      await db.response.create({ data: { assignmentId: a.id, questionId: q.id, authorRole: "EMPLOYEE", rating: Math.min(5, score + 0.3) }});
    }
  }

  // Managers also get their own evaluations (assigned by HR Admin)
  await db.assignment.create({ data: { cycleId: cQ2.id, templateId: regular.id, employeeId: tmLead.id,  managerId: hr.id, state: "SELF_ASSESS" }});
  await db.assignment.create({ data: { cycleId: cQ2.id, templateId: regular.id, employeeId: engMgr.id,  managerId: hr.id, state: "SELF_ASSESS" }});
  await db.assignment.create({ data: { cycleId: cQ2.id, templateId: regular.id, employeeId: csLead.id,  managerId: hr.id, state: "SELF_ASSESS" }});
  await db.assignment.create({ data: { cycleId: cQ2.id, templateId: regular.id, employeeId: mmLead.id,  managerId: hr.id, state: "SELF_ASSESS" }});
  await db.assignment.create({ data: { cycleId: cQ2.id, templateId: regular.id, employeeId: rdbLead.id, managerId: hr.id, state: "SELF_ASSESS" }});

  // Q2 2026 in-progress
  await db.assignment.create({ data: { cycleId: cQ2.id, templateId: regular.id,  employeeId: employees[0].id,  managerId: tmLead.id, state: "SELF_ASSESS" }});
  await db.assignment.create({ data: { cycleId: cQ2.id, templateId: probTmpl.id, employeeId: employees[1].id,  managerId: tmLead.id, state: "SELF_ASSESS" }});
  await db.assignment.create({ data: { cycleId: cQ2.id, templateId: probTmpl.id, employeeId: employees[4].id,  managerId: engMgr.id, state: "MANAGER_REVIEW", selfSubmittedAt: new Date() }});
  await db.assignment.create({ data: { cycleId: cQ2.id, templateId: regular.id,  employeeId: employees[3].id,  managerId: engMgr.id, state: "HR_REVIEW", selfSubmittedAt: new Date(), managerSubmittedAt: new Date(), overallScore: 4.1 }});
  await db.assignment.create({ data: { cycleId: cQ2.id, templateId: probTmpl.id, employeeId: employees[8].id,  managerId: csLead.id, state: "SELF_ASSESS" }});
  await db.assignment.create({ data: { cycleId: cQ2.id, templateId: regular.id,  employeeId: employees[11].id, managerId: tmLead.id, state: "SELF_ASSESS" }});
  await db.assignment.create({ data: { cycleId: cQ2.id, templateId: probTmpl.id, employeeId: employees[12].id, managerId: tmLead.id, state: "SELF_ASSESS" }});

  return NextResponse.json({
    ok: true,
    users: await db.user.count(),
    templates: 2,
    cycles: 3,
    assignments: await db.assignment.count(),
  });
}
