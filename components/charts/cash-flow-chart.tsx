"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCompactCurrency } from "@/lib/utils";

interface CashFlowChartProps {
  data: Array<{ date: string; income: number; expenses: number; net: number }>;
  currency: string;
}

export function CashFlowChart({ data, currency }: CashFlowChartProps) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <h3 className="font-semibold mb-1">Cash Flow</h3>
      <p className="text-xs text-muted-foreground mb-5">Daily income vs expenses</p>

      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.25} />
              <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => formatCompactCurrency(v, currency)}
            width={55}
          />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "12px",
              fontSize: 12,
            }}
            formatter={(v: number, name: string) => [
              formatCompactCurrency(v, currency),
              name.charAt(0).toUpperCase() + name.slice(1),
            ]}
          />
          <Area
            type="monotone"
            dataKey="income"
            stroke="hsl(var(--primary))"
            fill="url(#incomeGrad)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="expenses"
            stroke="hsl(var(--destructive))"
            fill="url(#expenseGrad)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
