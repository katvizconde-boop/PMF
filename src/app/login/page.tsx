"use client";
import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
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
    if (res?.error) setError("Invalid email or password.");
    else router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-stretch bg-canvas">
      {/* ── LEFT: Hero ─────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between flex-1 p-10 xl:p-14 bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500 text-white relative overflow-hidden">
        {/* subtle deco grid lines */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }} />
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-16 w-[28rem] h-[28rem] rounded-full bg-primary-300/20 blur-3xl" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur border border-white/20 text-xs font-semibold mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            Performance Management Form
          </div>
          <h1 className="text-5xl xl:text-6xl font-bold tracking-tight mb-3" style={{ fontFamily: "'Plus Jakarta Sans', Inter, sans-serif" }}>
            Welcome Back
          </h1>
          <p className="text-base xl:text-lg text-white/85 max-w-lg">
            Sign in to continue to your PMF System — your team's performance, in one place.
          </p>
        </div>

        <div className="flex-1 flex items-center justify-center my-6 relative z-10">
          <DashboardPreview />
        </div>

        <div className="grid grid-cols-4 gap-3 relative z-10">
          {[
            { icon: LineIcon,     title: "Structured",  desc: "Clear rubrics" },
            { icon: BarIcon,      title: "Connected",   desc: "Unified data" },
            { icon: GrowthIcon,   title: "Continuous",  desc: "Always-on feedback" },
            { icon: PieIcon,      title: "Measurable",  desc: "Real outcomes" },
          ].map((f, i) => (
            <div
              key={f.title}
              className="hero-feature group text-center flex flex-col items-center min-h-[6rem] bg-white/10 backdrop-blur rounded-xl p-3 border border-white/15 cursor-default transition-all duration-300 hover:bg-white/20 hover:border-white/40 hover:-translate-y-1 hover:shadow-xl"
              style={{ animationDelay: `${0.4 + i * 0.1}s` }}
            >
              <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center mb-2 text-white transition-all duration-300 group-hover:bg-white/30 group-hover:rotate-6 group-hover:scale-110">
                <f.icon />
              </div>
              <div className="text-sm font-semibold">{f.title}</div>
              <div className="text-xs text-white/70 mt-0.5 transition-colors group-hover:text-white">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT: Sign-in card ─────────────────── */}
      <div className="flex-1 lg:max-w-[520px] flex items-center justify-center p-6 lg:p-10 xl:p-14 bg-white">
        <div className="w-full max-w-md">
          {/* Logo + name */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center text-white" style={{ boxShadow: "0 6px 16px rgba(37,99,235,0.30)" }}>
              <BriefcaseIcon />
            </div>
            <div>
              <div className="text-xl font-bold text-navy-800 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', Inter, sans-serif" }}>PMF System</div>
              <div className="text-xs text-gray-500">Performance Management Form</div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-6">Sign in</h2>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  className="input pr-12"
                  type={showPw ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center rounded-md text-gray-500 hover:text-primary-700 hover:bg-primary-50 active:scale-90 transition cursor-pointer"
                  aria-label={showPw ? "Hide password" : "Show password"}
                  title={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center text-sm pt-1">
              <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="rounded text-primary-600 focus:ring-primary-400" />
                Remember me
              </label>
              <a href="/forgot-password" className="text-primary-600 hover:text-primary-700 font-medium">Forgot password?</a>
            </div>

            {error && <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg p-2.5">{error}</div>}

            <button className="w-full py-2.5 rounded-lg font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 shadow-md hover:shadow-lg transition active:scale-[0.98] disabled:opacity-50" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Outline icons (line-style, matching reference) ──────────────────
const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

function LineIcon()      { return <svg width="20" height="20" viewBox="0 0 24 24" {...stroke}><path d="M3 17l6-6 4 4 8-8"/><circle cx="3" cy="17" r="1.2"/><circle cx="9" cy="11" r="1.2"/><circle cx="13" cy="15" r="1.2"/><circle cx="21" cy="7" r="1.2"/></svg>; }
function BarIcon()       { return <svg width="20" height="20" viewBox="0 0 24 24" {...stroke}><path d="M4 20V12M9 20V8M14 20V14M19 20V4"/><path d="M3 20h18"/></svg>; }
function GrowthIcon()    { return <svg width="20" height="20" viewBox="0 0 24 24" {...stroke}><path d="M4 20V13M9 20V9M14 20V11M19 20V5"/><path d="M3 20h18"/><path d="M4 8l5-3 5 2 5-4"/><path d="M19 3v3h-3"/></svg>; }
function PieIcon()       { return <svg width="20" height="20" viewBox="0 0 24 24" {...stroke}><circle cx="12" cy="12" r="9"/><path d="M12 3v9l7 4"/></svg>; }
function GlobeIcon()     { return <svg width="20" height="20" viewBox="0 0 24 24" {...stroke}><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></svg>; }
function BuildingIcon()  { return <svg width="20" height="20" viewBox="0 0 24 24" {...stroke}><rect x="4" y="3" width="16" height="18" rx="1"/><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2"/><path d="M10 21v-3h4v3"/></svg>; }
function BriefcaseIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" {...stroke}><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/></svg>; }
function DocIcon()       { return <svg width="20" height="20" viewBox="0 0 24 24" {...stroke}><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M8 13h8M8 17h5"/></svg>; }
function MailIcon()      { return <svg width="16" height="16" viewBox="0 0 24 24" {...stroke}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>; }
function LockIcon()      { return <svg width="16" height="16" viewBox="0 0 24 24" {...stroke}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 1 1 8 0v4"/></svg>; }

/** Dashboard preview — corporate blue, minimal */
/** Animated count-up for numbers in the dashboard preview. */
function useCountUp(target: number, duration = 1400, start = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf = 0; const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setVal(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, start]);
  return val;
}

function DashboardPreview() {
  const [mounted, setMounted] = useState(false);
  const [hoverPoint, setHoverPoint] = useState<number | null>(null);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 200); return () => clearTimeout(t); }, []);

  // Count-up values
  const reviews    = useCountUp(128, 1400, mounted);
  const goals      = useCountUp(86,  1400, mounted);
  const pending    = useCountUp(14,  1400, mounted);
  const completion = useCountUp(82,  1600, mounted);
  const avgScore   = useCountUp(4.6, 1600, mounted);

  // Line chart points
  const xs = [8, 56, 104, 152, 200, 248, 296, 344];
  const ys = [70, 64, 68, 52, 48, 36, 28, 18];
  const labels = ["Q3 '24", "Q4 '24", "Q1 '25", "Q2 '25", "Q3 '25", "Q4 '25", "Q1 '26", "Q2 '26"];
  const points = xs.map((x, i) => ({ x, y: ys[i], label: labels[i], score: (5 - (ys[i] - 18) / 20).toFixed(1) }));
  const linePath  = `M 8 70 L 56 64 L 104 68 L 152 52 L 200 48 L 248 36 L 296 28 L 344 18`;
  const fillPath  = `${linePath} L 344 102 L 8 102 Z`;

  return (
    <div className="relative w-full max-w-[560px] group/hero" style={{ aspectRatio: "560 / 360" }}>
      {/* Main browser window */}
      <div className="absolute inset-x-0 inset-y-4 bg-white rounded-xl overflow-hidden transition-transform duration-500 hover:scale-[1.02]"
           style={{ boxShadow: "0 24px 60px rgba(15,23,42,0.25)" }}>
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-4 h-8 bg-gray-50 border-b border-gray-100">
          <span className="w-2 h-2 rounded-full bg-red-400/70" />
          <span className="w-2 h-2 rounded-full bg-amber-400/70" />
          <span className="w-2 h-2 rounded-full bg-emerald-400/70" />
          <div className="ml-3 px-3 py-0.5 bg-white rounded border border-gray-100 text-[10px] text-gray-400 font-mono">
            pmf.sevengen.com / dashboard
          </div>
          {/* Tiny live indicator */}
          <span className="ml-auto inline-flex items-center gap-1 text-[8px] font-bold text-emerald-600">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            LIVE
          </span>
        </div>

        {/* KPI tiles */}
        <div className="grid grid-cols-3 gap-3 p-4">
          {[
            { label: "REVIEWS",   value: Math.round(reviews).toString(),        trend: "+18",   up: true },
            { label: "GOALS MET", value: `${Math.round(goals)}%`,                trend: "+4.2%", up: true },
            { label: "PENDING",   value: Math.round(pending).toString(),         trend: "−6",    up: false },
          ].map((k) => (
            <div key={k.label} className="rounded-lg bg-gray-50 border border-gray-100 p-2.5 transition-all hover:bg-primary-50 hover:border-primary-200 hover:-translate-y-0.5 cursor-pointer">
              <div className="text-[9px] tracking-widest font-bold text-gray-500">{k.label}</div>
              <div className="text-xl font-bold text-gray-900 mt-0.5 tabular-nums">{k.value}</div>
              <div className={`text-[10px] font-semibold mt-1 ${k.up ? "text-emerald-600" : "text-gray-500"}`}>{k.up ? "↗ " : ""}{k.trend}</div>
            </div>
          ))}
        </div>

        {/* Line chart with interactive points */}
        <div className="px-4 pb-4">
          <svg viewBox="0 0 360 110" width="100%" height="110" className="overflow-visible">
            {[0, 1, 2, 3].map((i) => (
              <line key={i} x1="8" y1={8 + i * 30} x2="352" y2={8 + i * 30} stroke="#f1f5f9" strokeWidth="1" />
            ))}
            <defs>
              <linearGradient id="lcA" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#3b82f6" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Animated fill that fades in */}
            <path d={fillPath} fill="url(#lcA)" style={{ opacity: mounted ? 1 : 0, transition: "opacity 1.2s ease-out 0.6s" }} />
            {/* Animated stroke that draws itself */}
            <path
              d={linePath}
              fill="none"
              stroke="#2563eb"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="500"
              strokeDashoffset={mounted ? 0 : 500}
              style={{ transition: "stroke-dashoffset 1.4s ease-out" }}
            />
            {/* Interactive points */}
            {points.map((pt, i) => (
              <g key={i}
                 onMouseEnter={() => setHoverPoint(i)}
                 onMouseLeave={() => setHoverPoint(null)}
                 style={{ cursor: "pointer" }}>
                {/* Larger transparent hit target */}
                <circle cx={pt.x} cy={pt.y} r="12" fill="transparent" />
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={hoverPoint === i ? 5 : 2.5}
                  fill={hoverPoint === i ? "#2563eb" : "white"}
                  stroke="#2563eb"
                  strokeWidth="2"
                  style={{ transition: "r 0.2s, fill 0.2s, opacity 0.5s", opacity: mounted ? 1 : 0, transitionDelay: `${0.6 + i * 0.1}s` }}
                />
                {hoverPoint === i && (
                  <g>
                    {/* Vertical guide line */}
                    <line x1={pt.x} y1={pt.y + 8} x2={pt.x} y2="102" stroke="#2563eb" strokeWidth="1" strokeDasharray="2 2" opacity="0.4" />
                    {/* Tooltip */}
                    <rect x={pt.x - 32} y={pt.y - 32} width="64" height="24" rx="4" fill="#0f172a" />
                    <text x={pt.x} y={pt.y - 20} textAnchor="middle" fontSize="8" fill="#fff" fontFamily="Plus Jakarta Sans, Inter, sans-serif">{pt.label}</text>
                    <text x={pt.x} y={pt.y - 12} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#fbbf24">{pt.score} / 5</text>
                  </g>
                )}
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* Floating completion card — gently floats + hover lifts */}
      <div className="hero-float-card absolute -left-2 top-0 bg-white rounded-lg border border-gray-200 p-3 w-44 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl cursor-pointer"
           style={{ boxShadow: "0 8px 24px rgba(15,23,42,0.10)", animation: "heroFloat 6s ease-in-out infinite" }}>
        <div className="flex items-center gap-2">
          <div className="text-primary-600"><PieIcon /></div>
          <div className="text-[10px] tracking-widest font-bold text-gray-500">COMPLETION</div>
        </div>
        <div className="text-2xl font-bold text-gray-900 mt-0.5 tabular-nums">{Math.round(completion)}%</div>
        <div className="h-1.5 rounded-full bg-gray-100 mt-2 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-primary-600 to-primary-400 transition-all duration-1000 ease-out" style={{ width: `${completion}%` }} />
        </div>
        <div className="text-[10px] text-gray-500 mt-1">Reviews done this cycle</div>
      </div>

      {/* Floating avg score card — opposite float phase */}
      <div className="hero-float-card absolute -right-2 -bottom-2 bg-white rounded-lg border border-gray-200 p-3 w-48 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl cursor-pointer"
           style={{ boxShadow: "0 8px 24px rgba(15,23,42,0.10)", animation: "heroFloat 7s ease-in-out -3.5s infinite" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-primary-600"><BarIcon /></div>
            <div className="text-[10px] tracking-widest font-bold text-gray-500">AVG SCORE</div>
          </div>
          <span className="text-[10px] text-emerald-600 font-bold">↑ 0.3</span>
        </div>
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className="text-2xl font-bold text-gray-900 tabular-nums">{avgScore.toFixed(1)}</span>
          <span className="text-xs text-gray-400">/ 5.0</span>
        </div>
        <div className="text-[10px] text-gray-500 mt-1">Goal: 4.5 · On track</div>
      </div>

      {/* Local keyframes — scoped via global style tag */}
      <style jsx global>{`
        @keyframes heroFloat {
          0%, 100% { transform: translateY(0px); }
          50%      { transform: translateY(-8px); }
        }
        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hero-feature {
          opacity: 0;
          animation: heroFadeUp 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
