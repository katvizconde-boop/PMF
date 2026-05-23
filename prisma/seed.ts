import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  await db.response.deleteMany();
  await db.assignment.deleteMany();
  await db.cycle.deleteMany();
  await db.question.deleteMany();
  await db.section.deleteMany();
  await db.template.deleteMany();
  await db.auditLog.deleteMany();
  await db.user.deleteMany();

  const pw = await bcrypt.hash("password123", 10);
  const mk = (e: any) => db.user.create({ data: { ...e, passwordHash: pw } });

  // ── Users ─────────────────────────────────────────────────────
  const hr      = await mk({ email: "hr@company.com",       firstName: "Hannah",      lastName: "HR",        position: "HR Director",              role: "HR_ADMIN", employmentType: "REGULAR", company: "7GEN",                department: "HR and Admin Team" });
  const tmLead  = await mk({ email: "katlyn@company.com",   firstName: "Katlyn Kaye", lastName: "Vizconde",  position: "Talent Management Lead",   role: "MANAGER",  employmentType: "REGULAR", company: "7GEN",                department: "HR and Admin Team", managerId: hr.id, hireDate: new Date("2022-03-01") });
  const engMgr  = await mk({ email: "manager@company.com",  firstName: "Alex",        lastName: "Rivera",    position: "Engineering Manager",      role: "MANAGER",  employmentType: "REGULAR", company: "7GEN",                department: "Back End Team",     managerId: hr.id, hireDate: new Date("2021-08-15") });
  const csLead  = await mk({ email: "patricia@company.com", firstName: "Patricia",    lastName: "Lim",       position: "Client Success Lead",      role: "MANAGER",  employmentType: "REGULAR", company: "M2.0 Communications", department: "Client Success Team", managerId: hr.id, hireDate: new Date("2021-05-10") });
  const mmLead  = await mk({ email: "martin@company.com",   firstName: "Martin",      lastName: "Cruz",      position: "Operations Lead",          role: "MANAGER",  employmentType: "REGULAR", company: "Media Meter Inc",     department: "Operations Team",   managerId: hr.id, hireDate: new Date("2021-11-01") });

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
    mk({ email: "employee@company.com",     firstName: "Demo",         lastName: "Employee",     position: "HR Associate",                             role: "EMPLOYEE", employmentType: "REGULAR",      company: "7GEN",                department: "HR and Admin Team",                 managerId: tmLead.id, hireDate: new Date("2023-01-15") }),
    mk({ email: "probationary@company.com", firstName: "Demo",         lastName: "Probationary", position: "Junior Specialist",                        role: "EMPLOYEE", employmentType: "PROBATIONARY", company: "7GEN",                department: "HR and Admin Team",                 managerId: tmLead.id, hireDate: new Date("2026-01-15") }),
  ]);

  // ══════════════════════════════════════════════════════════════
  // REGULAR EMPLOYEE — 5-part Quarterly Evaluation (from Krystle's PDF)
  // ══════════════════════════════════════════════════════════════
  const regular = await db.template.create({
    data: {
      name: "Regular Employee - Quarterly Evaluation",
      type: "REGULAR",
      sections: { create: [

        // PART I: Contributions and Achievements  (35% weight, 1 overall rating)
        { title: "PART I: Contributions and Achievements", kind: "KPI", weight: 35, sortOrder: 1,
          questions: { create: [
            { prompt: "Overall Contribution Rating for the Quarter",
              description: "Based on the employee's key responsibilities, activities and achievements this period, indicate your overall individual rating.",
              inputType: "rating", sortOrder: 1, required: true, weight: 1 },
            { prompt: "Significant Comments (Evidence for overall rating)",
              description: "Narrative support for the overall rating above.",
              inputType: "text", sortOrder: 2, required: false, weight: 0 },
          ]}},

        // PART II: Core Competencies  (30% weight, 5 rating items)
        { title: "PART II: Core Competencies", kind: "COMPETENCY", weight: 30, sortOrder: 2,
          questions: { create: [
            { prompt: "Collaboration and Leadership",
              description: "Working together with the team by being dependable.",
              inputType: "rating", sortOrder: 1, required: true, weight: 1 },
            { prompt: "Emphasis for Results",
              description: "We have a strong bias for action and always work to attain clear measurable results for all our projects.",
              inputType: "rating", sortOrder: 2, required: true, weight: 1 },
            { prompt: "Innovation and Disruption",
              description: "We don't stop at good. We always seek newer and better ways to do our work.",
              inputType: "rating", sortOrder: 3, required: true, weight: 1 },
            { prompt: "Integrity",
              description: "Aligns his or her actions with his or her words and operates with transparency.",
              inputType: "rating", sortOrder: 4, required: true, weight: 1 },
            { prompt: "Passion for Learning",
              description: "We believe that we can learn new things from each person and each new project we take on and that getting better is the ultimate reward for work.",
              inputType: "rating", sortOrder: 5, required: true, weight: 1 },
          ]}},

        // PART III: Individual Goals  (35% weight, 3 goals)
        { title: "PART III: Individual Goals", kind: "KPI", weight: 35, sortOrder: 3,
          questions: { create: [
            { prompt: "Goal 1 — Description",
              description: "Enter the goal description, then rate achievement (1-5).",
              inputType: "text", sortOrder: 1, required: false, weight: 0 },
            { prompt: "Goal 1 — Achievement Rating", inputType: "rating", sortOrder: 2, required: true, weight: 1 },
            { prompt: "Goal 2 — Description", inputType: "text", sortOrder: 3, required: false, weight: 0 },
            { prompt: "Goal 2 — Achievement Rating", inputType: "rating", sortOrder: 4, required: true, weight: 1 },
            { prompt: "Goal 3 — Description", inputType: "text", sortOrder: 5, required: false, weight: 0 },
            { prompt: "Goal 3 — Achievement Rating", inputType: "rating", sortOrder: 6, required: true, weight: 1 },
          ]}},

        // PART IV: Summary (Strengths & Developmental Goals — narrative)
        { title: "PART IV: Summary", kind: "COMMENT", weight: 0, sortOrder: 4,
          questions: { create: [
            { prompt: "Strengths", description: "Areas where the employee excels.", inputType: "text", sortOrder: 1, required: false, weight: 0 },
            { prompt: "Developmental Goals", description: "Areas for development addressed through training or coaching.", inputType: "text", sortOrder: 2, required: false, weight: 0 },
          ]}},

        // PART V: Next Steps and Tenure Considerations
        { title: "PART V: Next Steps and Tenure Considerations", kind: "RECOMMENDATION", weight: 0, sortOrder: 5,
          questions: { create: [
            { prompt: "Top 3 Goals for Next Quarter",
              description: "Performance / competency goals the employee should focus on next quarter.",
              inputType: "text", sortOrder: 1, required: false, weight: 0 },
            { prompt: "Action Plan",
              description: "Specific steps to reinforce strengths and address development needs (persons involved, timeline, resources).",
              inputType: "text", sortOrder: 2, required: false, weight: 0 },
            { prompt: "Recommendation",
              description: "Select the recommendation that best fits.",
              inputType: "select",
              options: JSON.stringify(["No Action", "Promotion", "Transfer", "Salary Increase", "Individual Development Plan", "Other"]),
              sortOrder: 3, required: true, weight: 0 },
            { prompt: "Justification",
              description: "Justification for the recommendation and view of the staff member's future in the organization.",
              inputType: "text", sortOrder: 4, required: false, weight: 0 },
          ]}},
      ]},
    },
    include: { sections: { include: { questions: true } } },
  });

  // ══════════════════════════════════════════════════════════════
  // PROBATIONARY / CONTRACTUAL — 4-part Assessment (from Janella's PDF)
  // Performance Metrics (50%): 6 sub-categories with 3 items each
  // Core Values (50%): 9 sub-categories with 4 items each
  // ══════════════════════════════════════════════════════════════
  const probWeightPerf = 50 / 6;   // each of 6 performance sub-sections
  const probWeightCore = 50 / 9;   // each of 9 core-value sub-sections
  let so = 1;

  const probTmpl = await db.template.create({
    data: {
      name: "Probationary / Contractual - Performance & Core Values",
      type: "PROBATIONARY",
      sections: { create: [

        // PART I: Performance Metrics (6 sub-categories × 3 items)
        { title: "PART I-A: Job Knowledge and Technical Skills", kind: "KPI", weight: probWeightPerf, sortOrder: so++,
          questions: { create: [
            { prompt: "Demonstrates thorough understanding of job responsibilities and requirements", inputType: "rating", sortOrder: 1, required: true, weight: 1 },
            { prompt: "Masters required technical tools and software", inputType: "rating", sortOrder: 2, required: true, weight: 1 },
            { prompt: "Applies technical knowledge effectively to solve problems", inputType: "rating", sortOrder: 3, required: true, weight: 1 },
          ]}},

        { title: "PART I-B: Quality of Work", kind: "KPI", weight: probWeightPerf, sortOrder: so++,
          questions: { create: [
            { prompt: "Meets quality standards consistently", inputType: "rating", sortOrder: 1, required: true, weight: 1 },
            { prompt: "Follows established procedures and guidelines", inputType: "rating", sortOrder: 2, required: true, weight: 1 },
            { prompt: "Pays attention to detail and documents work properly and thoroughly", inputType: "rating", sortOrder: 3, required: true, weight: 1 },
          ]}},

        { title: "PART I-C: Productivity and Efficiency", kind: "KPI", weight: probWeightPerf, sortOrder: so++,
          questions: { create: [
            { prompt: "Completes assignments within deadlines", inputType: "rating", sortOrder: 1, required: true, weight: 1 },
            { prompt: "Manages multiple tasks effectively", inputType: "rating", sortOrder: 2, required: true, weight: 1 },
            { prompt: "Takes initiative to handle additional responsibilities when needed", inputType: "rating", sortOrder: 3, required: true, weight: 1 },
          ]}},

        { title: "PART I-D: Communication", kind: "KPI", weight: probWeightPerf, sortOrder: so++,
          questions: { create: [
            { prompt: "Expresses ideas clearly and concisely in verbal and written form", inputType: "rating", sortOrder: 1, required: true, weight: 1 },
            { prompt: "Provides timely updates on projects and tasks", inputType: "rating", sortOrder: 2, required: true, weight: 1 },
            { prompt: "Effectively communicates with different stakeholders", inputType: "rating", sortOrder: 3, required: true, weight: 1 },
          ]}},

        { title: "PART I-E: Problem-Solving", kind: "KPI", weight: probWeightPerf, sortOrder: so++,
          questions: { create: [
            { prompt: "Identifies problems proactively", inputType: "rating", sortOrder: 1, required: true, weight: 1 },
            { prompt: "Develops effective solutions", inputType: "rating", sortOrder: 2, required: true, weight: 1 },
            { prompt: "Evaluates outcomes and adjusts approach as needed", inputType: "rating", sortOrder: 3, required: true, weight: 1 },
          ]}},

        { title: "PART I-F: Professional Conduct", kind: "KPI", weight: probWeightPerf, sortOrder: so++,
          questions: { create: [
            { prompt: "Maintains consistent attendance and punctuality", inputType: "rating", sortOrder: 1, required: true, weight: 1 },
            { prompt: "Follows company policies and procedures", inputType: "rating", sortOrder: 2, required: true, weight: 1 },
            { prompt: "Manages workplace relationships professionally", inputType: "rating", sortOrder: 3, required: true, weight: 1 },
          ]}},

        // PART II: Core Values (9 sub-categories × 4 items)
        { title: "PART II-1: Humility", kind: "COMPETENCY", weight: probWeightCore, sortOrder: so++,
          questions: { create: [
            { prompt: "Accepts feedback constructively", inputType: "rating", sortOrder: 1, required: true, weight: 1 },
            { prompt: "Acknowledges mistakes and learns from them", inputType: "rating", sortOrder: 2, required: true, weight: 1 },
            { prompt: "Shows respect for all team members regardless of position", inputType: "rating", sortOrder: 3, required: true, weight: 1 },
            { prompt: "Shares credit for success with others", inputType: "rating", sortOrder: 4, required: true, weight: 1 },
          ]}},

        { title: "PART II-2: Upholds Fairness", kind: "COMPETENCY", weight: probWeightCore, sortOrder: so++,
          questions: { create: [
            { prompt: "Treats all colleagues with equal respect", inputType: "rating", sortOrder: 1, required: true, weight: 1 },
            { prompt: "Makes unbiased decisions", inputType: "rating", sortOrder: 2, required: true, weight: 1 },
            { prompt: "Follows procedures consistently", inputType: "rating", sortOrder: 3, required: true, weight: 1 },
            { prompt: "Addresses conflicts impartially", inputType: "rating", sortOrder: 4, required: true, weight: 1 },
          ]}},

        { title: "PART II-3: Mission-Driven", kind: "COMPETENCY", weight: probWeightCore, sortOrder: so++,
          questions: { create: [
            { prompt: "Aligns work with company goals", inputType: "rating", sortOrder: 1, required: true, weight: 1 },
            { prompt: "Shows commitment to organization's vision", inputType: "rating", sortOrder: 2, required: true, weight: 1 },
            { prompt: "Makes decisions that support long-term objectives", inputType: "rating", sortOrder: 3, required: true, weight: 1 },
            { prompt: "Understands and promotes company mission", inputType: "rating", sortOrder: 4, required: true, weight: 1 },
          ]}},

        { title: "PART II-4: Accountability", kind: "COMPETENCY", weight: probWeightCore, sortOrder: so++,
          questions: { create: [
            { prompt: "Takes ownership of responsibilities", inputType: "rating", sortOrder: 1, required: true, weight: 1 },
            { prompt: "Meets deadlines consistently", inputType: "rating", sortOrder: 2, required: true, weight: 1 },
            { prompt: "Admits and corrects mistakes", inputType: "rating", sortOrder: 3, required: true, weight: 1 },
            { prompt: "Can be relied upon by team members", inputType: "rating", sortOrder: 4, required: true, weight: 1 },
          ]}},

        { title: "PART II-5: Innovative", kind: "COMPETENCY", weight: probWeightCore, sortOrder: so++,
          questions: { create: [
            { prompt: "Suggests process improvements", inputType: "rating", sortOrder: 1, required: true, weight: 1 },
            { prompt: "Brings creative solutions to challenges", inputType: "rating", sortOrder: 2, required: true, weight: 1 },
            { prompt: "Adapts well to change", inputType: "rating", sortOrder: 3, required: true, weight: 1 },
            { prompt: "Shows initiative in problem-solving", inputType: "rating", sortOrder: 4, required: true, weight: 1 },
          ]}},

        { title: "PART II-6: Collaboration", kind: "COMPETENCY", weight: probWeightCore, sortOrder: so++,
          questions: { create: [
            { prompt: "Works effectively in team settings", inputType: "rating", sortOrder: 1, required: true, weight: 1 },
            { prompt: "Supports colleagues' success", inputType: "rating", sortOrder: 2, required: true, weight: 1 },
            { prompt: "Communicates clearly and constructively", inputType: "rating", sortOrder: 3, required: true, weight: 1 },
            { prompt: "Contributes positively to team projects", inputType: "rating", sortOrder: 4, required: true, weight: 1 },
          ]}},

        { title: "PART II-7: Openness", kind: "COMPETENCY", weight: probWeightCore, sortOrder: so++,
          questions: { create: [
            { prompt: "Receptive to new ideas", inputType: "rating", sortOrder: 1, required: true, weight: 1 },
            { prompt: "Transparent in communication", inputType: "rating", sortOrder: 2, required: true, weight: 1 },
            { prompt: "Shares knowledge with team members", inputType: "rating", sortOrder: 3, required: true, weight: 1 },
            { prompt: "Welcomes diverse perspectives", inputType: "rating", sortOrder: 4, required: true, weight: 1 },
          ]}},

        { title: "PART II-8: Resilience", kind: "COMPETENCY", weight: probWeightCore, sortOrder: so++,
          questions: { create: [
            { prompt: "Maintains effectiveness under pressure", inputType: "rating", sortOrder: 1, required: true, weight: 1 },
            { prompt: "Adapts to changing priorities", inputType: "rating", sortOrder: 2, required: true, weight: 1 },
            { prompt: "Recovers quickly from setbacks", inputType: "rating", sortOrder: 3, required: true, weight: 1 },
            { prompt: "Maintains positive attitude during challenges", inputType: "rating", sortOrder: 4, required: true, weight: 1 },
          ]}},

        { title: "PART II-9: Excellence", kind: "COMPETENCY", weight: probWeightCore, sortOrder: so++,
          questions: { create: [
            { prompt: "Consistently delivers high-quality work", inputType: "rating", sortOrder: 1, required: true, weight: 1 },
            { prompt: "Sets high personal standards", inputType: "rating", sortOrder: 2, required: true, weight: 1 },
            { prompt: "Seeks opportunities for improvement", inputType: "rating", sortOrder: 3, required: true, weight: 1 },
            { prompt: "Goes above and beyond expectations", inputType: "rating", sortOrder: 4, required: true, weight: 1 },
          ]}},

        // PART IV: Development Plan + Recommendation
        { title: "PART IV: Development Plan", kind: "COMMENT", weight: 0, sortOrder: so++,
          questions: { create: [
            { prompt: "Area for Improvement #1 and Action Plan", inputType: "text", sortOrder: 1, required: false, weight: 0 },
            { prompt: "Area for Improvement #2 and Action Plan", inputType: "text", sortOrder: 2, required: false, weight: 0 },
            { prompt: "Area for Improvement #3 and Action Plan", inputType: "text", sortOrder: 3, required: false, weight: 0 },
            { prompt: "Evaluator Comments", description: "Overall assessment narrative.", inputType: "text", sortOrder: 4, required: false, weight: 0 },
            { prompt: "Employee Comments", inputType: "text", sortOrder: 5, required: false, weight: 0 },
          ]}},

        { title: "Tenure Recommendation", kind: "RECOMMENDATION", weight: 0, sortOrder: so++,
          questions: { create: [
            { prompt: "Recommendation",
              description: "Decision for end of probationary period.",
              inputType: "select",
              options: JSON.stringify(["Regular Status", "Probationary Status (Extended)", "Performance Improvement Plan", "Terminate"]),
              sortOrder: 1, required: true, weight: 0 },
            { prompt: "Justification for Recommendation", inputType: "text", sortOrder: 2, required: false, weight: 0 },
          ]}},
      ]},
    },
    include: { sections: { include: { questions: true } } },
  });

  // ── Cycles ────────────────────────────────────────────────────
  const cQ4_2025 = await db.cycle.create({ data: { name: "Q4 2025", periodStart: new Date("2025-10-01"), periodEnd: new Date("2025-12-31"), dueDate: new Date("2026-01-15") }});
  const cQ1_2026 = await db.cycle.create({ data: { name: "Q1 2026", periodStart: new Date("2026-01-01"), periodEnd: new Date("2026-03-31"), dueDate: new Date("2026-04-15") }});
  const cQ2_2026 = await db.cycle.create({ data: { name: "Q2 2026", periodStart: new Date("2026-04-01"), periodEnd: new Date("2026-06-30"), dueDate: new Date("2026-07-15") }});

  // Seed some finalized historical evaluations for Regular template
  async function createCompleted(employeeId: string, managerId: string, cycleId: string, managerBase: number, commentary: string) {
    const a = await db.assignment.create({
      data: { employeeId, managerId, cycleId, templateId: regular.id,
        state: "FINALIZED",
        selfSubmittedAt: new Date(), managerSubmittedAt: new Date(),
        hrApprovedAt: new Date(), finalizedAt: new Date() },
    });
    const ratingQs = regular.sections.flatMap((s) => s.questions).filter((q) => q.inputType === "rating");
    let weightedSum = 0, weightTotal = 0;
    for (const s of regular.sections) {
      if (!(s.kind === "KPI" || s.kind === "COMPETENCY") || s.weight <= 0) continue;
      const qids = s.questions.filter((q) => q.inputType === "rating").map((q) => q.id);
      const empVals: number[] = [], mgrVals: number[] = [];
      for (const qid of qids) {
        const mgr = Math.max(1, Math.min(5, managerBase + (Math.random() - 0.5)));
        const emp = Math.max(1, Math.min(5, managerBase + (Math.random() - 0.3)));
        await db.response.create({ data: { assignmentId: a.id, questionId: qid, authorRole: "EMPLOYEE", rating: Number(emp.toFixed(1)) }});
        await db.response.create({ data: { assignmentId: a.id, questionId: qid, authorRole: "MANAGER", rating: Number(mgr.toFixed(1)), comment: "Solid performance." }});
        empVals.push(emp); mgrVals.push(mgr);
      }
      if (empVals.length) {
        const empAvg = empVals.reduce((x, y) => x + y, 0) / empVals.length;
        const mgrAvg = mgrVals.reduce((x, y) => x + y, 0) / mgrVals.length;
        const avg = (empAvg + mgrAvg) / 2;
        weightedSum += avg * s.weight;
        weightTotal += s.weight;
      }
    }
    const score = weightTotal > 0 ? Number((weightedSum / weightTotal).toFixed(2)) : null;
    await db.assignment.update({ where: { id: a.id }, data: { overallScore: score, recommendation: "No Action" }});
    return a;
  }

  // Historical data — Q4 2025 + Q1 2026 finalized
  await createCompleted(employees[0].id, tmLead.id, cQ4_2025.id, 4.2, "Strong quarter."); // Krystle Q4
  await createCompleted(employees[0].id, tmLead.id, cQ1_2026.id, 4.5, "Exceeded expectations.");
  await createCompleted(employees[2].id, tmLead.id, cQ4_2025.id, 3.5, "Steady progress."); // Jal
  await createCompleted(employees[3].id, engMgr.id, cQ4_2025.id, 4.0, "Reliable.");         // Marco
  await createCompleted(employees[3].id, engMgr.id, cQ1_2026.id, 4.3, "Growing fast.");
  await createCompleted(employees[5].id, engMgr.id, cQ4_2025.id, 4.1, "Strong ML work.");   // Diana
  await createCompleted(employees[5].id, engMgr.id, cQ1_2026.id, 4.4, "Excellent output.");
  await createCompleted(employees[6].id, csLead.id, cQ4_2025.id, 4.0, "Creative leadership."); // Angela
  await createCompleted(employees[6].id, csLead.id, cQ1_2026.id, 4.5, "Outstanding.");
  await createCompleted(employees[7].id, csLead.id, cQ4_2025.id, 3.8, "Good designs.");       // Raymond
  await createCompleted(employees[9].id, mmLead.id, cQ4_2025.id, 3.9, "Solid BD work.");     // Noel

  // Q2 2026 — in-progress across all states
  await db.assignment.create({ data: { cycleId: cQ2_2026.id, templateId: regular.id,  employeeId: employees[0].id,  managerId: tmLead.id, state: "SELF_ASSESS" }});  // Krystle
  await db.assignment.create({ data: { cycleId: cQ2_2026.id, templateId: probTmpl.id, employeeId: employees[1].id,  managerId: tmLead.id, state: "SELF_ASSESS" }});  // Janella
  await db.assignment.create({ data: { cycleId: cQ2_2026.id, templateId: probTmpl.id, employeeId: employees[4].id,  managerId: engMgr.id, state: "MANAGER_REVIEW", selfSubmittedAt: new Date() }}); // Carlos
  await db.assignment.create({ data: { cycleId: cQ2_2026.id, templateId: regular.id,  employeeId: employees[3].id,  managerId: engMgr.id, state: "HR_REVIEW", selfSubmittedAt: new Date(), managerSubmittedAt: new Date(), overallScore: 4.1 }}); // Marco
  await db.assignment.create({ data: { cycleId: cQ2_2026.id, templateId: probTmpl.id, employeeId: employees[8].id,  managerId: csLead.id, state: "SELF_ASSESS" }});  // Liza
  await db.assignment.create({ data: { cycleId: cQ2_2026.id, templateId: regular.id,  employeeId: employees[11].id, managerId: tmLead.id, state: "SELF_ASSESS" }});  // demo employee
  await db.assignment.create({ data: { cycleId: cQ2_2026.id, templateId: probTmpl.id, employeeId: employees[12].id, managerId: tmLead.id, state: "SELF_ASSESS" }});  // demo probationary

  console.log("✅ Seed complete with exact PDF-matched templates + 3 companies.\n");
  console.log("Logins (password: password123):");
  console.log("  HR Admin:            hr@company.com");
  console.log("  Manager (7GEN Eng):  manager@company.com");
  console.log("  Manager (HR Lead):   katlyn@company.com");
  console.log("  Manager (M2.0):      patricia@company.com");
  console.log("  Manager (MediaMtr):  martin@company.com");
  console.log("  Employee (Regular):  employee@company.com / krystle@company.com");
  console.log("  Employee (Prob):     probationary@company.com / janella@company.com");
}

main().finally(() => db.$disconnect());
