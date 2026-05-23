"use client";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, LineElement, PointElement,
  Tooltip, Legend, Filler,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend, Filler);

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
            fill: true, tension: 0.35,
          }],
        }}
        options={{
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { min: 0, max: 5, ticks: { stepSize: 1 } } },
        }}
      />
    </div>
  );
}
