"use client";

import { ArrowDownRight, ArrowUpRight, DollarSign, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { formatCurrency, calculatePercentageChange } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface StatCardsProps {
  totalBalance: number;
  income: number;
  expenses: number;
  lastMonthIncome: number;
  lastMonthExpenses: number;
  currency: string;
}

export function StatCards({
  totalBalance,
  income,
  expenses,
  lastMonthIncome,
  lastMonthExpenses,
  currency,
}: StatCardsProps) {
  const incomeChange = calculatePercentageChange(income, lastMonthIncome);
  const expenseChange = calculatePercentageChange(expenses, lastMonthExpenses);
  const netSavings = income - expenses;
  const savingsRate = income > 0 ? (netSavings / income) * 100 : 0;

  const cards = [
    {
      label: "Total Balance",
      value: formatCurrency(totalBalance, currency),
      subLabel: "Across all accounts",
      icon: Wallet,
      iconBg: "bg-primary/15",
      iconColor: "text-primary",
      trend: null,
    },
    {
      label: "Monthly Income",
      value: formatCurrency(income, currency),
      subLabel: `${incomeChange >= 0 ? "+" : ""}${incomeChange.toFixed(1)}% vs last month`,
      icon: TrendingUp,
      iconBg: "bg-emerald-500/15",
      iconColor: "text-emerald-500",
      trend: incomeChange,
      trendPositiveIsGood: true,
    },
    {
      label: "Monthly Expenses",
      value: formatCurrency(expenses, currency),
      subLabel: `${expenseChange >= 0 ? "+" : ""}${expenseChange.toFixed(1)}% vs last month`,
      icon: TrendingDown,
      iconBg: "bg-red-500/15",
      iconColor: "text-red-500",
      trend: expenseChange,
      trendPositiveIsGood: false,
    },
    {
      label: "Net Savings",
      value: formatCurrency(netSavings, currency),
      subLabel: `${savingsRate.toFixed(1)}% savings rate`,
      icon: DollarSign,
      iconBg: netSavings >= 0 ? "bg-blue-500/15" : "bg-red-500/15",
      iconColor: netSavings >= 0 ? "text-blue-500" : "text-red-500",
      trend: null,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-card border border-border rounded-2xl p-5 card-hover"
        >
          <div className="flex items-start justify-between mb-4">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", card.iconBg)}>
              <card.icon className={cn("w-5 h-5", card.iconColor)} />
            </div>
            {card.trend !== null && (
              <div
                className={cn(
                  "flex items-center gap-0.5 text-xs font-medium",
                  card.trendPositiveIsGood
                    ? card.trend >= 0 ? "text-emerald-500" : "text-red-500"
                    : card.trend >= 0 ? "text-red-500" : "text-emerald-500"
                )}
              >
                {card.trend >= 0 ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {Math.abs(card.trend).toFixed(1)}%
              </div>
            )}
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">{card.label}</div>
            <div className="text-2xl font-bold tracking-tight">{card.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{card.subLabel}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
