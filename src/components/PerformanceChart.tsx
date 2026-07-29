"use client";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, LineElement, PointElement,
  Tooltip, Legend, Filler,
} from "chart.js";
import { lineHoverOptions } from "@/lib/chartOptions";

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend, Filler);

function ratingLabel(score: number) {
  if (score >= 4.5) return "Significantly Exceeds";
  if (score >= 4)   return "Exceeds Expectations";
  if (score >= 3)   return "Meets Expectations";
  if (score >= 2)   return "Partially Meets";
  return "Unsatisfactory";
}

export function PerformanceChart({ history }: { history: { cycle: string; score: number }[] }) {
  if (history.length === 0) {
    return <p className="text-gray-400 text-sm text-center py-8">No finalized evaluations yet — no history to chart.</p>;
  }
  return (
    <div style={{ height: 260 }}>
      <Line
        data={{
          labels: history.map((h) => h.cycle),
          datasets: [{
            label: "Overall Score",
            data: history.map((h) => h.score),
            borderColor: "#2563eb",
            backgroundColor: "rgba(37,99,235,0.1)",
            borderWidth: 3, pointRadius: 6, pointBackgroundColor: "#2563eb",
            pointHoverRadius: 10, pointHoverBackgroundColor: "#fff", pointHoverBorderColor: "#1d4ed8", pointHoverBorderWidth: 3,
            fill: true, tension: 0.35,
          }],
        }}
        options={{
          ...lineHoverOptions,
          responsive: true, maintainAspectRatio: false,
          plugins: {
            ...(lineHoverOptions.plugins ?? {}),
            legend: { display: false },
            tooltip: {
              ...(lineHoverOptions.plugins?.tooltip ?? {}),
              callbacks: {
                title: (items: any) => items[0].label,
                label: (ctx: any) => [`  Score: ${ctx.parsed.y.toFixed(2)} / 5`, `  ${ratingLabel(ctx.parsed.y)}`],
              },
            },
          },
          scales: { y: { min: 0, max: 5, ticks: { stepSize: 1 } } },
        } as any}
      />
    </div>
  );
}
