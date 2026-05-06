"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { formatCompactCurrency } from "@/lib/utils";

interface TrendChartProps {
  data: Array<{ date: string; value: number; label?: string }>;
  currency: string;
  title?: string;
  color?: string;
  showZeroLine?: boolean;
}

export function TrendChart({
  data,
  currency,
  title = "Trend",
  color = "hsl(var(--primary))",
  showZeroLine = true,
}: TrendChartProps) {
  const min = Math.min(...data.map((d) => d.value));
  const max = Math.max(...data.map((d) => d.value));

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <h3 className="font-semibold mb-5">{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.2} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => formatCompactCurrency(v, currency)}
            width={55}
            domain={[min * 0.95, max * 1.05]}
          />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "12px",
              fontSize: 12,
            }}
            formatter={(v: number) => [formatCompactCurrency(v, currency), "Value"]}
          />
          {showZeroLine && <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={1.5} />}
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, fill: color }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
