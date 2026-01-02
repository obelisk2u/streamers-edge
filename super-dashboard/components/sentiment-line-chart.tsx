"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type SentimentBin = {
  label: string;
  avg_sentiment: number;
  count: number;
};

type SentimentLineChartProps = {
  bins: SentimentBin[];
};

export function SentimentLineChart({ bins }: SentimentLineChartProps) {
  const data = bins.map((bin) => ({
    label: bin.label,
    avg_sentiment: bin.avg_sentiment,
  }));
  const min = -0.21;
  const max = -0.11;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
        <CartesianGrid stroke="rgba(15, 23, 42, 0.08)" strokeDasharray="4 4" />
        <XAxis
          dataKey="label"
          tick={{ fill: "#6b7280", fontSize: 11 }}
          interval={1}
          angle={-45}
          textAnchor="end"
          height={40}
          axisLine={{ stroke: "rgba(15, 23, 42, 0.15)" }}
          tickLine={{ stroke: "rgba(15, 23, 42, 0.15)" }}
        />
        <YAxis
          domain={[min, max]}
          tick={{ fill: "#6b7280", fontSize: 11 }}
          tickFormatter={(value) => value.toFixed(2)}
          axisLine={{ stroke: "rgba(15, 23, 42, 0.15)" }}
          tickLine={{ stroke: "rgba(15, 23, 42, 0.15)" }}
          width={36}
        />
        <Tooltip
          formatter={(value: number) =>
            `Avg sentiment: ${value.toFixed(3)}`
          }
          labelStyle={{ color: "#111827" }}
          contentStyle={{
            borderRadius: "12px",
            borderColor: "rgba(15, 23, 42, 0.1)",
            boxShadow: "0 10px 30px rgba(15, 23, 42, 0.12)",
          }}
        />
        <Line
          type="monotone"
          dataKey="avg_sentiment"
          stroke="#1f4f8f"
          strokeWidth={2.5}
          dot={{ r: 3, fill: "#1f4f8f" }}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
