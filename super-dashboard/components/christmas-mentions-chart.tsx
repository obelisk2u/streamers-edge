"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ChristmasMention = {
  date: string;
  christmas: number;
  new_years: number;
  super: number;
  blizzard: number;
};

type ChristmasMentionsChartProps = {
  data: ChristmasMention[];
};

export function ChristmasMentionsChart({ data }: ChristmasMentionsChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
        <CartesianGrid stroke="rgba(15, 23, 42, 0.08)" strokeDasharray="4 4" />
        <XAxis
          dataKey="date"
          tick={{ fill: "#6b7280", fontSize: 11 }}
          interval={4}
          angle={-30}
          textAnchor="end"
          height={40}
          axisLine={{ stroke: "rgba(15, 23, 42, 0.15)" }}
          tickLine={{ stroke: "rgba(15, 23, 42, 0.15)" }}
        />
        <YAxis
          tick={{ fill: "#6b7280", fontSize: 11 }}
          axisLine={{ stroke: "rgba(15, 23, 42, 0.15)" }}
          tickLine={{ stroke: "rgba(15, 23, 42, 0.15)" }}
          width={36}
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
        <Legend
          verticalAlign="top"
          align="right"
          iconType="circle"
          wrapperStyle={{ fontSize: "0.75rem", color: "#6b7280" }}
        />
        <Line
          type="monotone"
          dataKey="christmas"
          name="Christmas"
          stroke="#f97316"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="new_years"
          name="New Years"
          stroke="#0ea5e9"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="super"
          name="super"
          stroke="#10b981"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
