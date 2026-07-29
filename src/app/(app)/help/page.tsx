import { requireUser } from "@/lib/rbac";
import { HelpdeskForm } from "@/components/HelpdeskForm";

export default async function HelpPage() {
  const u = await requireUser();
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Help & Support</h1>
        <p className="text-sm text-gray-500 mt-1">Find quick answers below, or send us a message — we'll get back within 1 business day.</p>
      </div>

      {/* FAQ */}
      <div className="card">
        <h2 className="section-header">Frequently Asked Questions</h2>
        <div className="space-y-2">
          {FAQ.map((q, i) => (
            <details key={i} className="group border border-gray-200 rounded-lg p-3 open:bg-gray-50 transition">
              <summary className="cursor-pointer font-semibold text-sm text-gray-800 list-none flex justify-between items-center">
                <span>{q.q}</span>
                <span className="text-gray-400 group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <div className="text-sm text-gray-600 mt-3 leading-relaxed whitespace-pre-line">{q.a}</div>
            </details>
          ))}
        </div>
      </div>

      {/* Contact form */}
      <div className="card">
        <h2 className="section-header">Still need help? Send us a message</h2>
        <HelpdeskForm user={{ name: u.name, email: u.email, role: u.role }} />
      </div>

      {/* Direct contacts */}
      <div className="card bg-primary-50/40 border-primary-100">
        <h2 className="section-header">Direct contacts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <ContactCard label="PMF Support (Kat)" email="kat.vizconde@seven-gen.com" />
          <ContactCard label="General HR" email="hr@sevengen.com" />
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Response time: <strong>within 1 business day</strong>. For urgent issues, contact your direct supervisor or HR.
        </p>
      </div>
    </div>
  );
}

function ContactCard({ label, email }: { label: string; email: string }) {
  return (
    <a href={`mailto:${email}`} className="block bg-white border border-gray-200 rounded-lg p-3 hover:border-primary-300 hover:shadow-sm transition">
      <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
      <div className="text-sm font-semibold text-primary-700 truncate">{email}</div>
    </a>
  );
}

const FAQ = [
  {
    q: "Where are my answers saved when I leave the page?",
    a: "Auto-save runs every few seconds. You'll see a green dot and 'Saved Xs ago' at the bottom of the form. A backup is also kept in your browser, so if your session ends unexpectedly, your draft is restored next time you open the PMF.",
  },
  {
    q: "How do I add my signature?",
    a: "On the signature pad, you can either:\n• Draw your signature with mouse/finger, then click 'Confirm signature'.\n• Switch to 'Upload Image' tab and upload a JPEG/PNG photo of your handwritten signature (up to 10 MB).\n\nIf you make a mistake, click '✏️ Edit / re-sign / upload image' to redo it.",
  },
  {
    q: "Why can't I edit my responses after submitting?",
    a: "Once submitted, your responses are locked to preserve the integrity of the evaluation. If you need to make a correction, contact your manager or HR — they can request HR to reopen the PMF for edits (HR can do this on finalized PMFs as well).",
  },
  {
    q: "How do I link to my evidence (trackers, Drive files)?",
    a: "Paste any URL into your justification text — it automatically becomes clickable for your reviewer. Supported: http://, https://, and www.* links open in a new tab.",
  },
  {
    q: "I forgot my password. What do I do?",
    a: "Click 'Forgot password?' on the sign-in screen, enter your email, and HR will be notified. For security, HR will verify your identity through a separate channel (e.g. Viber/call) and issue a temporary password within 1 business day.",
  },
  {
    q: "Do notifications come to my email?",
    a: "Yes. You'll receive an email when:\n• A PMF is assigned to you\n• Your manager needs to review your self-assessment\n• HR has finalized your evaluation\n• You receive Kudos\n• Your probation period is approaching its end\n\nNotifications also appear in the bell icon at the top-right of the app.",
  },
  {
    q: "How is my data protected?",
    a: "All data is encrypted in transit (HTTPS) and at rest. Only HR can see all evaluations company-wide; managers see only their direct reports; employees see only their own. All actions are recorded in an audit log. Read the full Privacy Notice in your Profile.",
  },
  {
    q: "Can I use this on my phone?",
    a: "Yes — the app is mobile-responsive. Use the bottom navigation bar to switch between Home, Team, Kudos, and Profile. Tap-and-hold isn't required anywhere; everything works with single taps.",
  },
];
