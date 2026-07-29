/**
 * Templates for the 1:1 Notes form.
 *
 * Each template fills the Agenda field with a structured questionnaire.
 * The Notes field stays blank — managers type responses inline OR record
 * notes during/after the meeting.
 *
 * To add a new template: append to ONE_ON_ONE_TEMPLATES below.
 */

export type OneOnOneTemplate = {
  id: string;
  name: string;
  company?: string;        // optional — if set, suggests this template to that company's managers
  description: string;
  sections: { title: string; questions: string[] }[];
};

export const ONE_ON_ONE_TEMPLATES: OneOnOneTemplate[] = [
  {
    id: "rdb-quarterly-2025",
    name: "RDB Quarterly Check-In (Standard)",
    company: "Rythmos DB Inc.",
    description: "Rythmos DB's individual 1:1 interview questionnaire — covers Personal, Work, Us, Team, Company, Events, and Client.",
    sections: [
      {
        title: "Personal",
        questions: [
          "How are you doing outside of work? How do you usually spend your time after work?",
          "What are you looking forward to in life right now?",
          "Do you have any personal challenges or problems that you're comfortable discussing?",
        ],
      },
      {
        title: "Work",
        questions: [
          "What are you spending your time on that keeps you motivated?",
          "What projects or in what situations do you feel really challenged?",
          "How satisfied are you with your current workload?",
          "Is there any other task you'd like to be involved in / explore?",
          "Would you like to remove or change any accounts from your current bandwidth?",
          "Do you think you have opportunities for growth and development within the team?",
          "What are your career goals and aspirations for the next 6–12 months? Have you recently thought about leaving RDB?",
        ],
      },
      {
        title: "Us (Manager–Direct Report)",
        questions: [
          "Are the expectations clear? Are they too much or too less?",
          "Are you comfortable with the pace at work?",
          "Are you getting enough feedback from me or from the senior media analysts you are working with?",
          "What can I do to better support you in your work journey?",
        ],
      },
      {
        title: "Team",
        questions: [
          "How are you feeling about the team? Are you having problems working or reaching out to other members of the team?",
          "What can we do to improve our team dynamic? Is there anything that you are specifically longing for our team?",
          "Do you feel valued and recognized for the work that you do within the team?",
          "Do you have plans like studying or travelling that may affect the team?",
        ],
      },
      {
        title: "Rythmos DB",
        questions: [
          "How are you feeling about our company, and do you have clarity on our strategy and the direction of the company?",
          "Do you have enough materials and equipment you need to do your job, based on your current setup (full-remote or hybrid)?",
          "Are you satisfied with the current benefits that the company offers?",
          "Do we provide enough opportunities to maximize your potential here? Are there any other skills training that you are interested in receiving?",
        ],
      },
      {
        title: "Events and Activities",
        questions: [
          "Which elements of the event did you like the most? What did you not like?",
          "What content resonated with you the most?",
          "What topics would you like to see more of at our meetings? Is there anything you wish we'd talked about more / or less during these meetings?",
          "What would make our events more effective?",
        ],
      },
      {
        title: "Client",
        questions: [
          "How would you describe the communication style of the client? Are their instructions and feedback clear and actionable?",
          "Do you feel that the client values your input and treats you as a partner in achieving their goals?",
          "Are the client's expectations realistic and manageable within the given timelines? If not, what specific challenges have you experienced?",
          "Do you feel equipped and supported by our team when dealing with client requests or challenges? Is there anything we could improve to help you work more effectively with this client?",
          "How is your overall experience working with this client? Are there any specific concerns, challenges, or suggestions you'd like to share?",
        ],
      },
    ],
  },
  // ─────────────────────────────────────────────────────
  // M2.0 COMMUNICATIONS — PR/Comms Agency template
  // ─────────────────────────────────────────────────────
  {
    id: "m20-quarterly-2026",
    name: "M2.0 Quarterly Check-In",
    company: "M2.0 Communications",
    description: "M2.0 Communications 1:1 — focused on creative work, client portfolio, and team collaboration.",
    sections: [
      {
        title: "Personal",
        questions: [
          "How are you doing overall — at work and outside?",
          "What's been giving you energy lately? What's been draining it?",
          "Any personal challenges you'd like to share?",
        ],
      },
      {
        title: "Client Portfolio",
        questions: [
          "Walk me through your current accounts. Which one excites you most? Which one needs the most attention?",
          "Are you feeling stretched too thin or under-utilized? Why?",
          "Which clients are giving you growth opportunities (new media, new sectors, new skills)?",
          "Any account you'd like to step away from, or one you'd like to lead?",
          "How are client relationships? Any signals we should act on early?",
        ],
      },
      {
        title: "Creative & Content Work",
        questions: [
          "What's the best piece of work you've shipped this quarter? Why are you proud of it?",
          "Where have you felt your creative instincts were overridden? When did they shine?",
          "What tools / processes / templates would make your work faster or sharper?",
          "What kind of creative challenges are you hungry for?",
        ],
      },
      {
        title: "Team & Collaboration",
        questions: [
          "How is your relationship with your account team? With other practice areas?",
          "Where do handoffs break down — between strategy, creative, media, account management?",
          "Are you getting the feedback you need, when you need it?",
          "Who in the team have you learned the most from this quarter?",
        ],
      },
      {
        title: "Us (Manager–Direct Report)",
        questions: [
          "Are my expectations clear? Where am I being vague?",
          "What's something I'm doing that helps you? Something that gets in your way?",
          "How do you prefer feedback — what format, what frequency?",
          "What can I do differently to support you over the next quarter?",
        ],
      },
      {
        title: "Career & Growth",
        questions: [
          "Where do you want to be in 12 months? In 3 years?",
          "What skill, experience, or relationship do you need to get there?",
          "Have you thought about leaving M2.0 recently? If yes, what triggered it?",
          "What learning, training, or exposure are you missing?",
        ],
      },
      {
        title: "M2.0 (Company)",
        questions: [
          "How are you feeling about M2.0's direction? Do you have clarity on the strategy?",
          "What's working well across the agency? What's not?",
          "Do you have the tools, equipment, and setup you need to do great work?",
          "Are you satisfied with current benefits and compensation? Anything you'd change?",
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────
  // MEDIA METER INC. — Media monitoring/analytics
  // ─────────────────────────────────────────────────────
  {
    id: "mmi-quarterly-2026",
    name: "Media Meter Quarterly Check-In",
    company: "Media Meter Inc.",
    description: "Media Meter Inc. 1:1 — focused on data quality, deliverables, tooling, and analyst growth.",
    sections: [
      {
        title: "Personal",
        questions: [
          "How are you doing outside of work?",
          "What's keeping you motivated right now? What's draining you?",
          "Anything personal you'd like to talk about?",
        ],
      },
      {
        title: "Workload & Output",
        questions: [
          "How does your current workload feel — too much, too little, just right?",
          "Which reports or deliverables do you find most rewarding? Which feel like a slog?",
          "Where do you spend time that doesn't feel high-value? What could we automate or cut?",
          "Are deadlines realistic? Where do you need more lead time?",
        ],
      },
      {
        title: "Data Quality & Methodology",
        questions: [
          "Are you confident in the data you're working with? Where are the integrity gaps?",
          "Are our methodologies still fit for purpose? What would you change?",
          "Have you seen any patterns in client data we should flag as a trend?",
          "What checks or QA processes are missing?",
        ],
      },
      {
        title: "Tools & Technology",
        questions: [
          "Which tools do you use most? Which ones get in your way?",
          "What tool, dashboard, or automation would save you the most time?",
          "Are you getting the training you need on new tools we adopt?",
          "Do you have the hardware and software to work effectively (especially remote)?",
        ],
      },
      {
        title: "Clients",
        questions: [
          "Walk me through your client list. Who's easy? Who's tough? Why?",
          "Where are client expectations misaligned with what we deliver?",
          "Are clients giving you feedback you can act on? Are they treating you as a partner?",
          "Any client you'd like to learn more about / pitch to / step away from?",
        ],
      },
      {
        title: "Team & Mentorship",
        questions: [
          "Who on the team gives you the best feedback? Who do you wish would give more?",
          "Are you mentoring or being mentored? Is that working?",
          "Where do you see knowledge gaps in the team?",
          "What can we improve in our team rituals — standups, retros, brown bags?",
        ],
      },
      {
        title: "Us (Manager–Direct Report)",
        questions: [
          "What am I doing that helps? What gets in your way?",
          "Am I giving you enough context on company strategy?",
          "How can I better advocate for you?",
        ],
      },
      {
        title: "Career & Growth",
        questions: [
          "Where do you want to be in 6 months? 18 months?",
          "What specific skill or experience would move you closer?",
          "Have you thought about leaving Media Meter recently? Why?",
          "What learning, training, or certification are you interested in?",
        ],
      },
      {
        title: "Media Meter (Company)",
        questions: [
          "Do you feel clear on company direction and strategy?",
          "Are benefits / compensation working for you?",
          "What would make Media Meter a noticeably better place to work?",
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────
  // 7GEN — Holding / tech / shared services
  // ─────────────────────────────────────────────────────
  {
    id: "7gen-quarterly-2026",
    name: "7GEN Quarterly Check-In",
    company: "7GEN",
    description: "7GEN 1:1 — focused on cross-company impact, technical work, and strategic alignment.",
    sections: [
      {
        title: "Personal",
        questions: [
          "How are you doing — work and life?",
          "What's energizing you right now? What's wearing you down?",
          "Any personal stuff you'd like to share?",
        ],
      },
      {
        title: "Your Work",
        questions: [
          "What are you spending most of your time on? Is that the right thing?",
          "What's something you shipped this quarter you're proud of?",
          "Where have you felt stuck, blocked, or under-resourced?",
          "What's a project you'd love to lead but haven't been asked to?",
        ],
      },
      {
        title: "Cross-Company Impact",
        questions: [
          "Which of the SevenGen companies (M2.0, MMI, RDB, 7GEN) are you supporting most?",
          "Where do you see opportunities to help more than one company at once?",
          "Where do priorities clash between companies? How do we resolve them?",
          "Are stakeholders across companies treating you as a partner or a vendor?",
        ],
      },
      {
        title: "Technical & Tooling",
        questions: [
          "Are you using the best tools for the job? What's outdated?",
          "What technical debt is slowing you down?",
          "What new technology or skill would have the biggest impact on your work?",
          "Are you getting enough time for learning, R&D, and skill-building?",
        ],
      },
      {
        title: "Team & Collaboration",
        questions: [
          "How is the team dynamic? Who do you collaborate best with?",
          "Are roles and ownership clear? Where is there overlap or gaps?",
          "Are you getting the feedback you need from peers and leaders?",
          "What would improve how we work together?",
        ],
      },
      {
        title: "Us (Manager–Direct Report)",
        questions: [
          "Are my expectations clear? Where am I unclear?",
          "What am I doing that helps? What gets in your way?",
          "How can I better advocate for you across SevenGen leadership?",
        ],
      },
      {
        title: "Career & Growth",
        questions: [
          "Where do you want to be in 12 months? In 3 years?",
          "What's the next stretch role for you within SevenGen?",
          "Have you thought about leaving recently? What's triggered it?",
          "What learning, certification, or exposure would help you most?",
        ],
      },
      {
        title: "7GEN & SevenGen Strategy",
        questions: [
          "Do you have clarity on the SevenGen group strategy and 7GEN's role in it?",
          "What's one decision leadership is making that you'd push back on?",
          "Are benefits, compensation, and ways-of-working sustainable for you?",
          "What would make 7GEN a noticeably better place to work?",
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────
  // GENERIC — fallback for any user
  // ─────────────────────────────────────────────────────
  {
    id: "generic-monthly-2026",
    name: "Generic Monthly Check-In",
    description: "Lightweight 1:1 framework — usable for anyone, any company, any role.",
    sections: [
      {
        title: "Last Month",
        questions: [
          "What's the win from last month you're proud of?",
          "What didn't go well — and what would you do differently?",
          "Where did you feel blocked, frustrated, or under-supported?",
        ],
      },
      {
        title: "This Month",
        questions: [
          "What are your top 3 priorities for the next 30 days?",
          "What's the biggest risk to those priorities?",
          "What help do you need from me to make them happen?",
        ],
      },
      {
        title: "Growth",
        questions: [
          "What skill or experience are you working on?",
          "What's one thing you'd like to learn this quarter?",
          "Any career conversations you'd like to have?",
        ],
      },
      {
        title: "Feedback",
        questions: [
          "What's one thing I should keep doing as your manager?",
          "What's one thing I should start or stop doing?",
          "Anything else on your mind?",
        ],
      },
    ],
  },

  {
    id: "blank",
    name: "Blank (start from scratch)",
    description: "Empty agenda — write your own talking points.",
    sections: [],
  },
];

/**
 * Convert a template into a plain-text Agenda string that the manager
 * can edit inline. Format:
 *
 *   === Personal ===
 *   1. How are you doing outside of work?
 *      → [response]
 *   ...
 */
export function templateToAgenda(template: OneOnOneTemplate): string {
  if (template.sections.length === 0) return "";

  const lines: string[] = [];
  lines.push(`📋 ${template.name}`);
  lines.push("");

  let qNum = 0;
  template.sections.forEach((section) => {
    lines.push(`═══ ${section.title} ═══`);
    section.questions.forEach((q) => {
      qNum++;
      lines.push(`${qNum}. ${q}`);
      lines.push(`   → `);
      lines.push("");
    });
  });

  return lines.join("\n").trim();
}

/** Get templates relevant for a user, sorted by company match first. */
export function getTemplatesForUser(userCompany: string | null | undefined): OneOnOneTemplate[] {
  return [...ONE_ON_ONE_TEMPLATES].sort((a, b) => {
    const aMatch = a.company === userCompany ? 0 : 1;
    const bMatch = b.company === userCompany ? 0 : 1;
    return aMatch - bMatch;
  });
}
