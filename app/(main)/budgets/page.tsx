import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Plus, Target } from "lucide-react";
import { getBudgets, getBudgetSuggestions } from "@/actions/budgets";
import { BudgetCard } from "@/components/budgets/budget-card";
import { CreateBudgetDialog } from "@/components/budgets/create-budget-dialog";
import { BudgetSuggestions } from "@/components/budgets/budget-suggestions";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { auth as getAuth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export default async function BudgetsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) redirect("/sign-in");

  const budgets = await getBudgets();

  const totalBudgeted = budgets.reduce((s, b) => s + Number(b.amount), 0);
  const totalSpent = budgets.reduce((s, b) => s + Number(b.spent), 0);
  const alertBudgets = budgets.filter((b: any) => b.isAlert).length;

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-500/15 rounded-xl flex items-center justify-center">
            <Target className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Budgets</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {budgets.length} budget{budgets.length !== 1 ? "s" : ""} ·{" "}
              {alertBudgets > 0 && (
                <span className="text-amber-500">{alertBudgets} nearing limit</span>
              )}
            </p>
          </div>
        </div>
        <CreateBudgetDialog currency={user.currency}>
          <Button size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" /> New Budget
          </Button>
        </CreateBudgetDialog>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Budgeted", value: totalBudgeted, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Total Spent", value: totalSpent, color: "text-amber-500", bg: "bg-amber-500/10" },
          { label: "Remaining", value: totalBudgeted - totalSpent, color: totalBudgeted - totalSpent >= 0 ? "text-emerald-500" : "text-red-500", bg: totalBudgeted - totalSpent >= 0 ? "bg-emerald-500/10" : "bg-red-500/10" },
        ].map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-2xl p-4">
            <div className="text-xs text-muted-foreground mb-1">{stat.label}</div>
            <div className={`text-xl font-bold ${stat.color}`}>
              {new Intl.NumberFormat("en-US", { style: "currency", currency: user.currency }).format(stat.value)}
            </div>
          </div>
        ))}
      </div>

      {/* Budget cards */}
      {budgets.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-16 text-center">
          <Target className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
          <h3 className="font-semibold mb-1">No budgets yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create a budget to start tracking your spending goals.
          </p>
          <CreateBudgetDialog currency={user.currency}>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" /> Create your first budget
            </Button>
          </CreateBudgetDialog>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {budgets.map((budget: any) => (
            <BudgetCard key={budget.id} budget={budget} currency={user.currency} />
          ))}
        </div>
      )}

      {/* AI Suggestions */}
      <BudgetSuggestions currency={user.currency} />
    </div>
  );
}
