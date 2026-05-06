"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, getCategoryColor } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Budget {
  id: string;
  name: string;
  category: string;
  amount: number;
  spent: number;
  color: string;
}

interface BudgetOverviewProps {
  budgets: Budget[];
  currency: string;
}

export function BudgetOverview({ budgets, currency }: BudgetOverviewProps) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold">Budgets</h3>
          <p className="text-xs text-muted-foreground mt-0.5">This month</p>
        </div>
        <Link href="/budgets">
          <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground h-7">
            Manage <ArrowRight className="w-3 h-3" />
          </Button>
        </Link>
      </div>

      {budgets.length === 0 ? (
        <Link href="/budgets?new=1">
          <Button
            variant="ghost"
            className="w-full h-10 border border-dashed border-border text-muted-foreground hover:text-foreground gap-2"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Create Budget
          </Button>
        </Link>
      ) : (
        <div className="space-y-4">
          {budgets.map((budget) => {
            const spent = Number(budget.spent);
            const amount = Number(budget.amount);
            const pct = amount > 0 ? Math.min((spent / amount) * 100, 100) : 0;
            const isOver = spent > amount;
            const color = getCategoryColor(budget.category);

            return (
              <div key={budget.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: color }}
                    />
                    <span className="text-sm font-medium">{budget.name}</span>
                    {isOver && (
                      <AlertTriangle className="w-3 h-3 text-red-500" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatCurrency(spent, currency)} /{" "}
                    {formatCurrency(amount, currency)}
                  </span>
                </div>
                <Progress
                  value={pct}
                  className="h-1.5"
                  style={
                    {
                      "--progress-color": isOver ? "hsl(var(--destructive))" : color,
                    } as React.CSSProperties
                  }
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {isOver ? (
                    <span className="text-red-500">
                      {formatCurrency(spent - amount, currency)} over budget
                    </span>
                  ) : (
                    <span>{formatCurrency(amount - spent, currency)} remaining</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
