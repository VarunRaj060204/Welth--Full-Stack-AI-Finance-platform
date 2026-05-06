import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { StatCards } from "@/components/dashboard/stat-cards";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { BudgetOverview } from "@/components/dashboard/budget-overview";
import { AccountsOverview } from "@/components/dashboard/accounts-overview";
import { SpendingChart } from "@/components/charts/spending-chart";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: {
      accounts: {
        orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!user) redirect("/sign-in");

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [thisMonthStats, lastMonthStats, recentTransactions, budgets] =
    await Promise.all([
      db.transaction.groupBy({
        by: ["type"],
        where: { userId: user.id, date: { gte: startOfMonth }, status: "COMPLETED" },
        _sum: { amount: true },
      }),
      db.transaction.groupBy({
        by: ["type"],
        where: { userId: user.id, date: { gte: startOfLastMonth, lte: endOfLastMonth }, status: "COMPLETED" },
        _sum: { amount: true },
      }),
      db.transaction.findMany({
        where: { userId: user.id },
        include: { account: { select: { name: true, color: true, currency: true } } },
        orderBy: { date: "desc" },
        take: 8,
      }),
      db.budget.findMany({
        where: { userId: user.id, startDate: { lte: now }, endDate: { gte: now } },
        take: 4,
        orderBy: { createdAt: "desc" },
      }),
    ]);

  const chartData = await Promise.all(
    Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      return db.transaction
        .groupBy({
          by: ["type"],
          where: { userId: user.id, date: { gte: d, lte: end }, status: "COMPLETED" },
          _sum: { amount: true },
        })
        .then((rows) => ({
          month: d.toLocaleDateString("en-US", { month: "short" }),
          income: Number(rows.find((r) => r.type === "INCOME")?._sum.amount ?? 0),
          expenses: Number(rows.find((r) => r.type === "EXPENSE")?._sum.amount ?? 0),
        }));
    })
  );

  const thisIncome = Number(thisMonthStats.find((s) => s.type === "INCOME")?._sum.amount ?? 0);
  const thisExpenses = Number(thisMonthStats.find((s) => s.type === "EXPENSE")?._sum.amount ?? 0);
  const lastIncome = Number(lastMonthStats.find((s) => s.type === "INCOME")?._sum.amount ?? 0);
  const lastExpenses = Number(lastMonthStats.find((s) => s.type === "EXPENSE")?._sum.amount ?? 0);

  const totalBalance = user.accounts.reduce((sum, a) => sum + Number(a.balance), 0);

  // ✅ Serialize all Decimal and Date fields
  const serializedAccounts = user.accounts.map((a) => ({
    ...a,
    balance: Number(a.balance),
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }));

  const serializedTransactions = recentTransactions.map((t) => ({
    ...t,
    amount: Number(t.amount),
    exchangeRate: t.exchangeRate ? Number(t.exchangeRate) : null,
    date: t.date.toISOString(),
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    nextRecurringDate: t.nextRecurringDate?.toISOString() ?? null,
  }));

  const serializedBudgets = budgets.map((b) => ({
    ...b,
    amount: Number(b.amount),
    spent: Number(b.spent),
    startDate: b.startDate.toISOString(),
    endDate: b.endDate.toISOString(),
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-6 page-enter">
      <DashboardHeader userName={user.name} />
      <StatCards
        totalBalance={totalBalance}
        income={thisIncome}
        expenses={thisExpenses}
        lastMonthIncome={lastIncome}
        lastMonthExpenses={lastExpenses}
        currency={user.currency}
      />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SpendingChart data={chartData} currency={user.currency} />
          <RecentTransactions
            transactions={serializedTransactions as any}
            currency={user.currency}
          />
        </div>
        <div className="space-y-6">
          <AccountsOverview accounts={serializedAccounts as any} currency={user.currency} />
          <BudgetOverview budgets={serializedBudgets as any} currency={user.currency} />
        </div>
      </div>
    </div>
  );
}