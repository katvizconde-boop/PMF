"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) setError("Invalid email or password");
    else router.push("/dashboard");
  }
  const quick = (e: string) => { setEmail(e); setPassword("password123"); };

  return (
    <div className="min-h-screen flex items-stretch bg-canvas">
      {/* ── LEFT: Hero ─────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between flex-1 p-10 xl:p-14 bg-gradient-to-br from-primary-50 via-white to-primary-50/40 border-r border-gray-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-gray-200 text-xs font-semibold text-gray-700 mb-6 shadow-soft">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-600" />
            Performance Management Form
          </div>
          <h1 className="text-5xl xl:text-6xl font-bold text-navy-800 tracking-tight mb-3" style={{ fontFamily: "'Plus Jakarta Sans', Inter, sans-serif" }}>
            Welcome Back!
          </h1>
          <p className="text-base xl:text-lg text-gray-600 max-w-lg">
            Sign in to continue to your PMF System — your team's performance, in one place.
          </p>
        </div>

        <div className="flex-1 flex items-center justify-center my-6">
          <DashboardPreview />
        </div>

        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: ListIcon,    title: "Structured", desc: "Clear rubrics" },
            { icon: ConnectIcon, title: "Connected",  desc: "Unified data" },
            { icon: ChatIcon,    title: "Continuous", desc: "Always-on feedback" },
            { icon: ChartIcon,   title: "Measurable", desc: "Real outcomes" },
          ].map((f) => (
            <div key={f.title} className="text-center flex flex-col items-center min-h-[6rem]">
              <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center mb-2 text-primary-600 shadow-soft">
                <f.icon />
              </div>
              <div className="text-sm font-semibold text-gray-800">{f.title}</div>
              <div className="text-xs text-gray-500 mt-0.5">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT: Sign-in card ─────────────────── */}
      <div className="flex-1 lg:max-w-[520px] flex items-center justify-center p-6 lg:p-10 xl:p-14">
        <div className="w-full max-w-md">
          {/* Logo + name */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center" style={{ boxShadow: "0 4px 12px rgba(37,99,235,0.25)" }}>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="white">
                <path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zM8 11c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
              </svg>
            </div>
            <div>
              <div className="text-xl font-bold text-navy-800 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', Inter, sans-serif" }}>PMF SYSTEM</div>
              <div className="text-xs text-gray-500">Performance Management Form</div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Sign in to your account</h2>
          <p className="text-sm text-gray-500 mb-6">Welcome — enter your details to continue.</p>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
                  </svg>
                </span>
                <input
                  className="input pl-10"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="11" width="16" height="10" rx="2" />
                    <path d="M8 11V7a4 4 0 1 1 8 0v4" />
                  </svg>
                </span>
                <input
                  className="input pl-10 pr-10"
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-sm" aria-label="Toggle password">
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center text-sm pt-1">
              <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="rounded text-primary-600 focus:ring-primary-400" />
                Remember me
              </label>
              <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">Forgot password?</a>
            </div>

            {error && <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg p-2.5">{error}</div>}

            <button className="btn btn-primary w-full py-2.5" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-gray-400">
            <div className="flex-1 border-t border-gray-200" />
            <span>OR</span>
            <div className="flex-1 border-t border-gray-200" />
          </div>

          <button type="button" className="btn btn-secondary w-full py-2.5 flex items-center justify-center gap-2.5">
            <svg width="16" height="16" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg">
              <rect x="1"  y="1"  width="10" height="10" fill="#f25022"/>
              <rect x="12" y="1"  width="10" height="10" fill="#7fba00"/>
              <rect x="1"  y="12" width="10" height="10" fill="#00a4ef"/>
              <rect x="12" y="12" width="10" height="10" fill="#ffb900"/>
            </svg>
            <span>Sign in with Microsoft</span>
          </button>

          <p className="text-center text-xs text-gray-500 mt-6">
            Need help? <a href="mailto:hr@sevengen.com" className="text-primary-600 font-medium hover:underline">Contact Support</a>
          </p>

          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-[11px] text-gray-400 mb-2 text-center uppercase tracking-wide">Demo logins · password: <code>password123</code></p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              <button type="button" className="text-xs px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium" onClick={() => quick("hr@company.com")}>HR</button>
              <button type="button" className="text-xs px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium" onClick={() => quick("manager@company.com")}>Manager</button>
              <button type="button" className="text-xs px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium" onClick={() => quick("employee@company.com")}>Employee</button>
              <button type="button" className="text-xs px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium" onClick={() => quick("probationary@company.com")}>Probationary</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Outline icons ────────────────────────────────────────
const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

function ListIcon()    { return <svg width="20" height="20" viewBox="0 0 24 24" {...stroke}><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>; }
function ConnectIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" {...stroke}><circle cx="12" cy="12" r="3"/><circle cx="5" cy="6" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="19" cy="18" r="2"/><path d="M7 7l3 3M17 7l-3 3M7 17l3-3M17 17l-3-3"/></svg>; }
function ChatIcon()    { return <svg width="20" height="20" viewBox="0 0 24 24" {...stroke}><path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8l-4 4v-4H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/><path d="M8 10h8M8 13h5"/></svg>; }
function ChartIcon()   { return <svg width="20" height="20" viewBox="0 0 24 24" {...stroke}><path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/></svg>; }

/** Minimalist dashboard preview — original composition */
function DashboardPreview() {
  return (
    <div className="relative w-full max-w-[560px]" style={{ aspectRatio: "560 / 360" }}>
      {/* Main browser window */}
      <div className="absolute inset-x-0 inset-y-4 bg-white rounded-xl border border-gray-200 overflow-hidden"
           style={{ boxShadow: "0 12px 32px rgba(15,23,42,0.08)" }}>
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-4 h-8 bg-gray-50 border-b border-gray-100">
          <span className="w-2 h-2 rounded-full bg-gray-300" />
          <span className="w-2 h-2 rounded-full bg-gray-300" />
          <span className="w-2 h-2 rounded-full bg-gray-300" />
          <div className="ml-3 px-3 py-0.5 bg-white rounded border border-gray-100 text-[10px] text-gray-400 font-mono">
            pmf.sevengen.com / dashboard
          </div>
        </div>

        {/* KPI tiles */}
        <div className="grid grid-cols-3 gap-3 p-4">
          {[
            { label: "REVIEWS",     value: "128", trend: "+18", up: true },
            { label: "GOALS MET",   value: "86%", trend: "+4.2%", up: true },
            { label: "PENDING",     value: "14",  trend: "−6",   up: false },
          ].map((k) => (
            <div key={k.label} className="rounded-lg bg-gray-50 border border-gray-100 p-2.5">
              <div className="text-[9px] tracking-widest font-bold text-gray-500">{k.label}</div>
              <div className="text-xl font-bold text-gray-900 mt-0.5">{k.value}</div>
              <div className={`text-[10px] font-semibold mt-1 ${k.up ? "text-emerald-600" : "text-gray-500"}`}>{k.up ? "↗ " : ""}{k.trend}</div>
            </div>
          ))}
        </div>

        {/* Line chart */}
        <div className="px-4 pb-4">
          <svg viewBox="0 0 360 110" width="100%" height="110">
            {[0, 1, 2, 3].map((i) => (
              <line key={i} x1="8" y1={8 + i * 30} x2="352" y2={8 + i * 30} stroke="#f1f5f9" strokeWidth="1" />
            ))}
            <defs>
              <linearGradient id="lcA" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#3b82f6" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"    />
              </linearGradient>
            </defs>
            <path d="M 8 70 L 56 64 L 104 68 L 152 52 L 200 48 L 248 36 L 296 28 L 344 18 L 344 102 L 8 102 Z" fill="url(#lcA)" />
            <path d="M 8 70 L 56 64 L 104 68 L 152 52 L 200 48 L 248 36 L 296 28 L 344 18" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {[8, 56, 104, 152, 200, 248, 296, 344].map((x, i) => {
              const ys = [70, 64, 68, 52, 48, 36, 28, 18];
              return <circle key={i} cx={x} cy={ys[i]} r="2.5" fill="white" stroke="#2563eb" strokeWidth="2" />;
            })}
          </svg>
        </div>
      </div>

      {/* Floating completion card */}
      <div className="absolute -left-2 top-0 bg-white rounded-lg border border-gray-200 p-3 w-44"
           style={{ boxShadow: "0 8px 24px rgba(15,23,42,0.10)" }}>
        <div className="text-[10px] tracking-widest font-bold text-gray-500">COMPLETION</div>
        <div className="text-2xl font-bold text-gray-900 mt-0.5">82%</div>
        <div className="h-1.5 rounded-full bg-gray-100 mt-2 overflow-hidden">
          <div className="h-full rounded-full bg-primary-600" style={{ width: "82%" }} />
        </div>
        <div className="text-[10px] text-gray-500 mt-1">Reviews done this cycle</div>
      </div>

      {/* Floating avg score card */}
      <div className="absolute -right-2 -bottom-2 bg-white rounded-lg border border-gray-200 p-3 w-48"
           style={{ boxShadow: "0 8px 24px rgba(15,23,42,0.10)" }}>
        <div className="flex items-center justify-between">
          <div className="text-[10px] tracking-widest font-bold text-gray-500">AVG SCORE</div>
          <span className="text-[10px] text-emerald-600 font-bold">↑ 0.3</span>
        </div>
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className="text-2xl font-bold text-gray-900">4.6</span>
          <span className="text-xs text-gray-400">/ 5.0</span>
        </div>
        <div className="text-[10px] text-gray-500 mt-1">Goal: 4.5 · On track</div>
      </div>
    </div>
  );
}
