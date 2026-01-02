"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type SentimentCounts = {
  negative: number;
  neutral: number;
  positive: number;
};

type SentimentBarChartProps = {
  counts: SentimentCounts;
};

export function SentimentBarChart({ counts }: SentimentBarChartProps) {
  const data = [
    { label: "Negative", value: counts.negative },
    { label: "Neutral", value: counts.neutral },
    { label: "Positive", value: counts.positive },
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
        <CartesianGrid stroke="rgba(15, 23, 42, 0.08)" strokeDasharray="4 4" />
        <XAxis
          dataKey="label"
          tick={{ fill: "#6b7280", fontSize: 11 }}
          axisLine={{ stroke: "rgba(15, 23, 42, 0.15)" }}
          tickLine={{ stroke: "rgba(15, 23, 42, 0.15)" }}
        />
        <YAxis
          tick={{ fill: "#6b7280", fontSize: 11 }}
          axisLine={{ stroke: "rgba(15, 23, 42, 0.15)" }}
          tickLine={{ stroke: "rgba(15, 23, 42, 0.15)" }}
        />
        <Tooltip
          formatter={(value: number) => value.toLocaleString()}
          labelStyle={{ color: "#111827" }}
          contentStyle={{
            borderRadius: "12px",
            borderColor: "rgba(15, 23, 42, 0.1)",
            boxShadow: "0 10px 30px rgba(15, 23, 42, 0.12)",
          }}
        />
        <Bar dataKey="value" radius={[8, 8, 4, 4]}>
          {data.map((entry) => {
            let fill = "#9ca3af";
            if (entry.label === "Negative") fill = "#ff5f56";
            if (entry.label === "Positive") fill = "#10b981";
            return <Cell key={entry.label} fill={fill} />;
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
