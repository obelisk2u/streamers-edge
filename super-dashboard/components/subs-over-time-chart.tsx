"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type SubsOverTimePoint = {
  date: string;
  subs: number;
};

type SubsOverTimeChartProps = {
  data: SubsOverTimePoint[];
};

export function SubsOverTimeChart({ data }: SubsOverTimeChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ left: 8, right: 8 }}>
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11 }}
          minTickGap={16}
        />
        <YAxis
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11 }}
          width={28}
        />
        <Tooltip
          cursor={{ stroke: "#0f172a", strokeOpacity: 0.1 }}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid rgba(15, 23, 42, 0.08)",
          }}
          labelStyle={{ fontWeight: 600 }}
        />
        <Line
          type="monotone"
          dataKey="subs"
          stroke="#16a34a"
          strokeWidth={2}
          dot={{ r: 3, fill: "#16a34a" }}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
