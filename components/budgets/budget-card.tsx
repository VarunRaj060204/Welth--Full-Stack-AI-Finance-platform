"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, MoreHorizontal, Trash2, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency, getCategoryColor } from "@/lib/utils";
import { deleteBudget } from "@/actions/budgets";

interface Budget {
  id: string;
  name: string;
  category: string;
  amount: number;
  spent: number;
  percentage: number;
  remaining: number;
  isAlert: boolean;
  isOverBudget: boolean;
  isActive: boolean;
  period: string;
  color: string;
}

interface BudgetCardProps {
  budget: Budget;
  currency: string;
}

export function BudgetCard({ budget, currency }: BudgetCardProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const color = getCategoryColor(budget.category);
  const pct = Math.min(budget.percentage, 100);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteBudget(budget.id);
      toast.success("Budget deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete budget");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-5 card-hover">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold"
            style={{ background: color }}
          >
            {budget.category.charAt(0)}
          </div>
          <div>
            <div className="font-semibold">{budget.name}</div>
            <div className="text-xs text-muted-foreground">{budget.category}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {budget.isOverBudget && (
            <Badge className="text-[10px] bg-red-500/15 text-red-500 border-0">
              Over budget
            </Badge>
          )}
          {!budget.isOverBudget && budget.isAlert && (
            <Badge className="text-[10px] bg-amber-500/15 text-amber-500 border-0">
              <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />
              Alert
            </Badge>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                <Trash2 className="w-3.5 h-3.5 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Spent</span>
          <span className="font-medium">
            {formatCurrency(Number(budget.spent), currency)} /{" "}
            {formatCurrency(Number(budget.amount), currency)}
          </span>
        </div>
        <Progress
          value={pct}
          className="h-2"
          style={
            {
              "--progress-color": budget.isOverBudget
                ? "hsl(var(--destructive))"
                : budget.isAlert
                ? "hsl(38, 92%, 50%)"
                : color,
            } as React.CSSProperties
          }
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{pct.toFixed(1)}% used</span>
          <span>
            {budget.isOverBudget ? (
              <span className="text-red-500">
                {formatCurrency(Math.abs(Number(budget.remaining)), currency)} over
              </span>
            ) : (
              <span>{formatCurrency(Number(budget.remaining), currency)} left</span>
            )}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <Badge variant="outline" className="text-[10px] h-5">
          {budget.period.toLowerCase()}
        </Badge>
        {budget.isActive && (
          <span className="flex items-center gap-1 text-emerald-500">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Active
          </span>
        )}
      </div>
    </div>
  );
}
