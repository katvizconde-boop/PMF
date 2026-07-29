"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DataPrivacyContent } from "./DataPrivacyModal";
import { Icon } from "./Icons";

type Role = "HR_ADMIN" | "MANAGER" | "EMPLOYEE";
type IconComp = React.ComponentType<{ size?: number; className?: string }>;
type Step = { icon: IconComp; title: string; body: React.ReactNode; cta?: { label: string; href: string }; requireConsent?: boolean };

const STEPS: Record<Role, Step[]> = {
  HR_ADMIN: [
    {
      icon: Icon.Lock,
      title: "Data Privacy Policy",
      requireConsent: true,
      body: (
        <div style={{ maxHeight: 320, overflowY: "auto", paddingRight: 8 }}>
          <DataPrivacyContent />
        </div>
      ),
    },
    {
      icon: Icon.Sparkle,
      title: "Welcome to the PMF System",
      body: (
        <>
          <p>Hi! This is your central hub for managing performance evaluations across <b>all four companies</b>: M2.0 Communications, Media Meter Inc, 7GEN, and Rythmos DB Inc.</p>
          <p className="mt-2">This quick tour takes about <b>90 seconds</b>. We'll show you the most useful features for HR.</p>
        </>
      ),
    },
    {
      icon: Icon.BarChart,
      title: "Your Dashboard",
      body: (
        <>
          <p>The dashboard shows real-time analytics:</p>
          <ul className="list-disc ml-4 mt-2 space-y-1 text-sm">
            <li><b>KPI cards</b> — total users, evaluations, completion rate, team average</li>
            <li><b>Charts</b> — score distribution, performance trends, top performers</li>
            <li><b>Flight Risk</b> — auto-flags employees with declining scores</li>
            <li><b>Probation Alerts</b> — never miss a regularization deadline</li>
            <li><b>Anniversaries</b> — work anniversary reminders</li>
          </ul>
        </>
      ),
    },
    {
      icon: Icon.Users,
      title: "Employees",
      body: (
        <>
          <p>Manage your entire workforce here:</p>
          <ul className="list-disc ml-4 mt-2 space-y-1 text-sm">
            <li>Filter by company, department, or employment type</li>
            <li>Add or bulk-import via CSV</li>
            <li>Open any employee to see their PMFs, goals, 1:1 notes, documents, career path, and PIPs</li>
            <li>Move probationary employees to Regular when ready</li>
          </ul>
        </>
      ),
      cta: { label: "Go to Employees", href: "/employees" },
    },
    {
      icon: Icon.Clipboard,
      title: "Templates",
      body: (
        <>
          <p>Two evaluation forms come pre-built, matching your existing PDFs:</p>
          <ul className="list-disc ml-4 mt-2 space-y-1 text-sm">
            <li><b>Regular Employee</b> — 5-part quarterly evaluation</li>
            <li><b>Probationary / Contractual</b> — 4-part assessment with 9 core values</li>
          </ul>
          <p className="mt-2 text-sm">You can edit, clone, or import a new template from a PDF.</p>
        </>
      ),
    },
    {
      icon: Icon.LineChart,
      title: "Insights & Analytics",
      body: (
        <>
          <p>Three powerful views for HR analytics:</p>
          <ul className="list-disc ml-4 mt-2 space-y-1 text-sm">
            <li><b>Team Profile</b> — every employee's scores side-by-side</li>
            <li><b>Heat Map</b> — department × cycle color grid</li>
            <li><b>Compliance</b> — DOLE-friendly tenure, probation, training reports — exportable to CSV</li>
          </ul>
        </>
      ),
    },
    {
      icon: Icon.Trophy,
      title: "Engagement Tools",
      body: (
        <>
          <p>Keep employees engaged year-round, not just at review time:</p>
          <ul className="list-disc ml-4 mt-2 space-y-1 text-sm">
            <li><b>Kudos</b> — public recognition wall</li>
            <li><b>Career Paths</b> — define ladders so employees see their roadmap</li>
            <li><b>Notification bell</b> — top right corner, real-time alerts</li>
          </ul>
        </>
      ),
    },
    {
      icon: Icon.Settings,
      title: "Admin Power Tools",
      body: (
        <>
          <p>The Admin section gives you bulk-action superpowers:</p>
          <ul className="list-disc ml-4 mt-2 space-y-1 text-sm">
            <li><b>Bulk Assign Evaluations</b> — assign a template to a whole department in one click</li>
            <li><b>+ New Cycle</b> — create quarterly review periods with auto-assign rules</li>
            <li><b>Send Reminders Now</b> — chase pending evaluations</li>
            <li><b>Import Employees CSV</b> — bulk-add new hires</li>
            <li><b>Departments</b> — manage org structure</li>
          </ul>
        </>
      ),
    },
    {
      icon: Icon.Send,
      title: "You're all set!",
      body: (
        <>
          <p>Everything you need is in the left sidebar.</p>
          <p className="mt-2 text-sm">If you ever need to see this tour again, click <b>My Profile → Restart Tour</b>.</p>
          <p className="mt-2 text-sm">Questions? The audit log captures every action and is searchable from <b>Settings</b>.</p>
        </>
      ),
    },
  ],

  MANAGER: [
    {
      icon: Icon.Lock,
      title: "Data Privacy Policy",
      requireConsent: true,
      body: (
        <div style={{ maxHeight: 320, overflowY: "auto", paddingRight: 8 }}>
          <DataPrivacyContent />
        </div>
      ),
    },
    {
      icon: Icon.Sparkle,
      title: "Welcome to the PMF System",
      body: (
        <>
          <p>Hi! This is where you'll evaluate your direct reports and track their growth.</p>
          <p className="mt-2">This quick tour takes about <b>60 seconds</b>.</p>
        </>
      ),
    },
    {
      icon: Icon.BarChart,
      title: "Your Dashboard",
      body: (
        <>
          <p>Your dashboard shows:</p>
          <ul className="list-disc ml-4 mt-2 space-y-1 text-sm">
            <li><b>Pending evaluations</b> — team members waiting on your review</li>
            <li><b>Your own PMFs</b> — yes, managers get evaluated too!</li>
            <li><b>Team performance KPIs</b></li>
          </ul>
          <p className="text-sm mt-2 text-gray-500">A highlighted banner appears at the top if anything is overdue.</p>
        </>
      ),
    },
    {
      icon: Icon.LineChart,
      title: "Team Profile",
      body: (
        <>
          <p>See <b>all your direct reports side-by-side</b> — ratings per section, color-coded heat map.</p>
          <p className="mt-2 text-sm">Perfect for talent calibration meetings.</p>
        </>
      ),
      cta: { label: "Open Team Profile", href: "/team-compare" },
    },
    {
      icon: Icon.Sparkle,
      title: "AI Feedback Drafting",
      body: (
        <>
          <p>When evaluating a team member:</p>
          <ul className="list-disc ml-4 mt-2 space-y-1 text-sm">
            <li>Pick the rating</li>
            <li>Click the <b>AI Draft</b> button</li>
            <li>The AI generates a justification, summary, or development goals based on your ratings</li>
            <li>Edit anything you want — or use as-is</li>
          </ul>
          <p className="mt-2 text-sm font-semibold text-purple-700">Saves ~30 minutes per review.</p>
        </>
      ),
    },
    {
      icon: Icon.Trophy,
      title: "Kudos & Engagement",
      body: (
        <>
          <p>Recognize great work <b>any time</b>, not just at review:</p>
          <ul className="list-disc ml-4 mt-2 space-y-1 text-sm">
            <li><b>Kudos</b> — drop a quick shout-out, public or private</li>
            <li><b>1:1 Meeting Notes</b> — shared notepad with each direct report (on their profile)</li>
            <li><b>Career Paths</b> — set their current and target levels</li>
          </ul>
        </>
      ),
    },
    {
      icon: Icon.Send,
      title: "You're all set!",
      body: (
        <>
          <p>Everything you need is in the left sidebar.</p>
          <p className="mt-2 text-sm">To re-watch this tour, go to <b>My Profile → Restart Tour</b>.</p>
        </>
      ),
    },
  ],

  EMPLOYEE: [
    {
      icon: Icon.Lock,
      title: "Data Privacy Policy",
      requireConsent: true,
      body: (
        <div style={{ maxHeight: 320, overflowY: "auto", paddingRight: 8 }}>
          <DataPrivacyContent />
        </div>
      ),
    },
    {
      icon: Icon.Sparkle,
      title: "Welcome!",
      body: (
        <>
          <p>This is your personal performance space — where you complete self-assessments and see your growth over time.</p>
          <p className="mt-2">Quick 30-second tour.</p>
        </>
      ),
    },
    {
      icon: Icon.BarChart,
      title: "Your Dashboard",
      body: (
        <>
          <p>Your dashboard shows:</p>
          <ul className="list-disc ml-4 mt-2 space-y-1 text-sm">
            <li><b>Your PMFs</b> — past, current, and pending</li>
            <li><b>Alerts</b> — when a self-assessment is due</li>
            <li><b>Your latest score</b></li>
          </ul>
        </>
      ),
    },
    {
      icon: Icon.Pen,
      title: "Filling out a PMF",
      body: (
        <>
          <p>When a PMF is assigned to you:</p>
          <ul className="list-disc ml-4 mt-2 space-y-1 text-sm">
            <li>Rate yourself on each item (1–5 with descriptive labels)</li>
            <li>Add a justification — share specific examples</li>
            <li>Sign at the bottom (draw with mouse or finger)</li>
            <li>Click <b>Submit Self-Assessment</b></li>
          </ul>
          <p className="mt-2 text-sm">Your manager will then evaluate. After HR approval, you'll see the final feedback.</p>
        </>
      ),
    },
    {
      icon: Icon.Trophy,
      title: "Kudos",
      body: (
        <>
          <p>Recognize great work from anyone in the company. Send a quick kudos with a category like <i>Collaboration</i>, <i>Excellence</i>, or <i>Innovation</i>. It even shows up at review time as supporting evidence.</p>
        </>
      ),
      cta: { label: "Try Kudos", href: "/kudos" },
    },
    {
      icon: Icon.User,
      title: "Your Profile",
      body: (
        <>
          <p>From <b>My Profile</b> you can:</p>
          <ul className="list-disc ml-4 mt-2 space-y-1 text-sm">
            <li>Update your photo, name, contact info</li>
            <li><b>Change your password</b></li>
            <li>Re-watch this tour</li>
          </ul>
        </>
      ),
    },
    {
      icon: Icon.Send,
      title: "You're all set!",
      body: <p>That's it. Welcome to the team!</p>,
    },
  ],
};

export function OnboardingTour({ role, alreadyCompleted, forceOpen = false, onClose }: {
  role: Role;
  alreadyCompleted: boolean;
  forceOpen?: boolean;
  onClose?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(forceOpen || !alreadyCompleted);
  const [stepIdx, setStepIdx] = useState(0);
  const [consents, setConsents] = useState<Record<number, boolean>>({});
  const steps = STEPS[role];

  // Re-open if forceOpen toggles
  useEffect(() => { if (forceOpen) { setOpen(true); setStepIdx(0); setConsents({}); } }, [forceOpen]);

  if (!open) return null;
  const step = steps[stepIdx];
  const isLast = stepIdx === steps.length - 1;

  async function complete() {
    setOpen(false);
    onClose?.();
    try {
      await fetch("/api/profile/onboarding", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: true }),
      });
    } catch {}
    router.refresh();
  }

  function next() {
    if (isLast) complete();
    else setStepIdx((i) => i + 1);
  }
  function prev() { setStepIdx((i) => Math.max(0, i - 1)); }
  function skip() { complete(); }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={skip}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Gradient header */}
        <div className="relative bg-gradient-to-br from-primary-600 via-primary-500 to-blue-400 p-6 text-white">
          <button onClick={skip} className="absolute top-3 right-3 text-white/80 hover:text-white text-sm">Skip tour</button>
          <div className="mb-2">{(() => { const IC = step.icon; return <IC size={48} />; })()}</div>
          <h2 className="text-2xl font-bold">{step.title}</h2>
        </div>

        {/* Body */}
        <div className="p-6 text-gray-700">
          <div className="prose-sm">{step.body}</div>
          {step.cta && (
            <a
              href={step.cta.href}
              onClick={(e) => { e.preventDefault(); router.push(step.cta!.href); complete(); }}
              className="inline-block mt-4 btn btn-secondary text-sm"
            >
              {step.cta.label} →
            </a>
          )}
          {step.requireConsent && (
            <label className="flex items-start gap-2 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={!!consents[stepIdx]}
                onChange={(e) => setConsents({ ...consents, [stepIdx]: e.target.checked })}
                className="mt-0.5"
              />
              <span className="text-sm text-gray-700">
                <strong>I have read and agree</strong> to the Data Privacy Policy. I understand how my data is collected, stored, and shared.
              </span>
            </label>
          )}
        </div>

        {/* Progress + nav */}
        <div className="px-6 pb-6">
          <div className="flex items-center gap-1.5 mb-4">
            {steps.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i === stepIdx ? "bg-primary-600 flex-1" : i < stepIdx ? "bg-primary-300 w-6" : "bg-gray-200 w-6"}`} />
            ))}
          </div>
          <div className="flex justify-between items-center">
            <button onClick={prev} disabled={stepIdx === 0} className="btn btn-ghost text-sm disabled:opacity-30">← Back</button>
            <span className="text-xs text-gray-500">{stepIdx + 1} of {steps.length}</span>
            <button
              onClick={next}
              disabled={!!step.requireConsent && !consents[stepIdx]}
              className="btn btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLast ? <span className="inline-flex items-center gap-1">Get Started <Icon.Send size={14} /></span> : "Next →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
