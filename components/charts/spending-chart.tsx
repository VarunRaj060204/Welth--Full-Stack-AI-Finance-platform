"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCompactCurrency } from "@/lib/utils";

interface SpendingChartProps {
  data: Array<{ month: string; income: number; expenses: number }>;
  currency: string;
}

const CustomTooltip = ({ active, payload, label, currency }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-xl p-3 shadow-lg text-sm">
        <p className="font-medium mb-2">{label}</p>
        {payload.map((p: any) => (
          <div key={p.name} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-muted-foreground capitalize">{p.name}:</span>
            <span className="font-medium">{formatCompactCurrency(p.value, currency)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function SpendingChart({ data, currency }: SpendingChartProps) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold">Income vs Expenses</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Last 6 months overview</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barCategoryGap="30%" barGap={4}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            vertical={false}
          />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => formatCompactCurrency(v, currency)}
            width={60}
          />
          <Tooltip content={<CustomTooltip currency={currency} />} cursor={{ fill: "hsl(var(--muted)/0.3)" }} />
          <Bar
            dataKey="income"
            fill="hsl(var(--primary))"
            radius={[4, 4, 0, 0]}
            name="income"
          />
          <Bar
            dataKey="expenses"
            fill="hsl(var(--destructive)/0.7)"
            radius={[4, 4, 0, 0]}
            name="expenses"
          />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span style={{ color: "hsl(var(--muted-foreground))", fontSize: 12 }}>
                {value.charAt(0).toUpperCase() + value.slice(1)}
              </span>
            )}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
