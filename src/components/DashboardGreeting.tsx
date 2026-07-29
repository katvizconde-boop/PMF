"use client";
import { useEffect, useState } from "react";

function greetingFor(d: Date) {
  const h = d.getHours();
  if (h < 12) return "Good Morning";
  if (h < 18) return "Good Afternoon";
  return "Good Evening";
}
function greetingWord(d: Date) {
  const h = d.getHours();
  if (h < 12) return "Hi";
  if (h < 18) return "Hello";
  return "Hey";
}

export function DashboardGreeting({ firstName }: { firstName: string }) {
  const [now, setNow] = useState<Date | null>(null);
  // Avoid hydration mismatch — render only after mount
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const serif = { fontFamily: "'Fraunces', 'Plus Jakarta Sans', Georgia, serif", fontFeatureSettings: '"ss01", "ss02"' };

  if (!now) {
    return (
      <div className="mb-5">
        <div className="text-[11px] uppercase tracking-[0.18em] text-primary-700 font-bold">&nbsp;</div>
        <h1 className="text-3xl md:text-4xl mt-1" style={serif}>&nbsp;</h1>
      </div>
    );
  }

  return (
    <div className="mb-5 animate-slide-up">
      <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-primary-700 font-bold">{greetingFor(now)}</div>
      <h1
        className="text-2xl sm:text-3xl md:text-4xl mt-1 text-navy-800 leading-tight"
        style={{ ...serif, fontWeight: 600 }}
      >
        {greetingWord(now)},{" "}
        <span className="text-primary-700" style={{ fontStyle: "italic", fontWeight: 500 }}>
          {firstName || "there"}
        </span>
        <span className="text-primary-700">.</span>
      </h1>
    </div>
  );
}
