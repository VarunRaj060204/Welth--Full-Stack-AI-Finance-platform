"use client";

import { ArrowDownRight, ArrowUpRight, DollarSign, Receipt } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface AnalyticsStatsProps {
  income: number;
  expenses: number;
  net: number;
  transactionCount: number;
  currency: string;
}

export function AnalyticsStats({ income, expenses, net, transactionCount, currency }: AnalyticsStatsProps) {
  const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;

  const stats = [
    {
      label: "Total Income",
      value: formatCurrency(income, currency),
      icon: ArrowUpRight,
      iconBg: "bg-emerald-500/15",
      iconColor: "text-emerald-500",
      sub: "Received this period",
    },
    {
      label: "Total Expenses",
      value: formatCurrency(expenses, currency),
      icon: ArrowDownRight,
      iconBg: "bg-red-500/15",
      iconColor: "text-red-500",
      sub: "Spent this period",
    },
    {
      label: "Net Savings",
      value: formatCurrency(net, currency),
      icon: DollarSign,
      iconBg: net >= 0 ? "bg-blue-500/15" : "bg-red-500/15",
      iconColor: net >= 0 ? "text-blue-500" : "text-red-500",
      sub: `${savingsRate.toFixed(1)}% savings rate`,
    },
    {
      label: "Transactions",
      value: transactionCount.toString(),
      icon: Receipt,
      iconBg: "bg-violet-500/15",
      iconColor: "text-violet-500",
      sub: "This period",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s) => (
        <div key={s.label} className="bg-card border border-border rounded-2xl p-5">
          <div className={`w-9 h-9 ${s.iconBg} rounded-xl flex items-center justify-center mb-4`}>
            <s.icon className={`w-4.5 h-4.5 ${s.iconColor}`} />
          </div>
          <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
          <div className="text-2xl font-bold tracking-tight">{s.value}</div>
          <div className="text-xs text-muted-foreground mt-1">{s.sub}</div>
        </div>
      ))}
    </div>
  );
}
