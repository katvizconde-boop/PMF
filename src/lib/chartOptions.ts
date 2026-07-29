/**
 * Shared Chart.js option fragments — rich hover, smooth transitions,
 * branded tooltips. Spread into chart `options` to apply consistently.
 */
import type { ChartOptions } from "chart.js";

/** Hover-interactive tooltip + animations applicable to all chart types. */
export const chartHoverDefaults: Partial<ChartOptions<any>> = {
  interaction: { mode: "nearest", intersect: false, axis: "x" },
  animation: { duration: 600, easing: "easeOutQuart" },
  transitions: {
    active: { animation: { duration: 250 } },
  },
  plugins: {
    tooltip: {
      enabled: true,
      backgroundColor: "rgba(15,23,42,0.92)",
      titleColor: "#fff",
      bodyColor: "#fff",
      titleFont: { size: 12, weight: "bold", family: "'Plus Jakarta Sans', Inter, sans-serif" },
      bodyFont:  { size: 13, weight: "bold", family: "'Plus Jakarta Sans', Inter, sans-serif" },
      padding: 12,
      cornerRadius: 10,
      displayColors: true,
      boxPadding: 6,
      caretSize: 6,
      borderColor: "rgba(37,99,235,0.4)",
      borderWidth: 1,
    },
  },
};

/** Bar chart — grow hover bar, lighten others. */
export const barHoverOptions: Partial<ChartOptions<"bar">> = {
  ...(chartHoverDefaults as any),
  hover: { mode: "nearest", intersect: true },
  onHover: (e: any) => {
    if (e?.native?.target) e.native.target.style.cursor = "pointer";
  },
};

/** Line chart — bigger active point, smooth trail. */
export const lineHoverOptions: Partial<ChartOptions<"line">> = {
  ...(chartHoverDefaults as any),
  hover: { mode: "nearest", intersect: false },
  elements: {
    point: { hoverRadius: 9, hoverBorderWidth: 3, hoverBackgroundColor: "#fff" },
    line:  { borderJoinStyle: "round" },
  },
  onHover: (e: any) => {
    if (e?.native?.target) e.native.target.style.cursor = "pointer";
  },
};

/** Doughnut chart — pop hovered slice outward. */
export const doughnutHoverOptions: Partial<ChartOptions<"doughnut">> = {
  ...(chartHoverDefaults as any),
  hover: { mode: "nearest" },
  elements: {
    arc: {
      borderWidth: 0,
      hoverOffset: 14,
      hoverBorderWidth: 0,
    } as any,
  },
  onHover: (e: any) => {
    if (e?.native?.target) e.native.target.style.cursor = "pointer";
  },
};
