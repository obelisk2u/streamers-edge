"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler
);

type SentimentBin = {
  label: string;
  avg_sentiment: number;
  count: number;
};

type SentimentLineChartProps = {
  bins: SentimentBin[];
};

export function SentimentLineChart({ bins }: SentimentLineChartProps) {
  const labels = bins.map((bin) => bin.label);
  const values = bins.map((bin) => bin.avg_sentiment);
  const min = -0.12;
  const max = -0.04;

  return (
    <Line
      data={{
        labels,
        datasets: [
          {
            data: values,
            borderColor: "#1f4f8f",
            backgroundColor: "rgba(31, 79, 143, 0.12)",
            pointBackgroundColor: "#1f4f8f",
            tension: 0.35,
            fill: true,
            pointRadius: 3,
            pointHoverRadius: 4,
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) =>
                `Avg sentiment: ${context.parsed.y.toFixed(3)}`,
            },
          },
        },
        scales: {
          x: {
            ticks: { color: "#6b7280", maxRotation: 45, minRotation: 45 },
            grid: { color: "rgba(15, 23, 42, 0.06)" },
          },
          y: {
            ticks: {
              color: "#6b7280",
              callback: (value) => Number(value).toFixed(2),
            },
            grid: { color: "rgba(15, 23, 42, 0.08)" },
            min,
            max,
          },
        },
      }}
    />
  );
}
