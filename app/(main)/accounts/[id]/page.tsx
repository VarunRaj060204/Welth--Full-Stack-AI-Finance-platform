import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AddTransactionDialog } from "@/components/transactions/add-transaction-dialog";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { SpendingChart } from "@/components/charts/spending-chart";

export default async function AccountDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) redirect("/sign-in");

  const account = await db.account.findFirst({
    where: { id: params.id, userId: user.id },
    include: {
      transactions: {
        include: { account: { select: { name: true, color: true, currency: true } } },
        orderBy: { date: "desc" },
        take: 20,
      },
      _count: { select: { transactions: true } },
    },
  });

  if (!account) notFound();

  const now = new Date();

  // Monthly chart data
  const chartData = await Promise.all(
    Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      return db.transaction
        .groupBy({
          by: ["type"],
          where: { accountId: account.id, date: { gte: d, lte: end }, status: "COMPLETED" },
          _sum: { amount: true },
        })
        .then((rows) => ({
          month: d.toLocaleDateString("en-US", { month: "short" }),
          income: Number(rows.find((r) => r.type === "INCOME")?._sum.amount ?? 0),
          expenses: Number(rows.find((r) => r.type === "EXPENSE")?._sum.amount ?? 0),
        }));
    })
  );

  // This month stats
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyStats = await db.transaction.groupBy({
    by: ["type"],
    where: { accountId: account.id, date: { gte: startOfMonth }, status: "COMPLETED" },
    _sum: { amount: true },
  });

  const monthlyIncome = Number(monthlyStats.find((s) => s.type === "INCOME")?._sum.amount ?? 0);
  const monthlyExpenses = Number(monthlyStats.find((s) => s.type === "EXPENSE")?._sum.amount ?? 0);

  const TYPE_LABELS: Record<string, string> = {
    CHECKING: "Checking", SAVINGS: "Savings", CREDIT_CARD: "Credit Card",
    INVESTMENT: "Investment", CRYPTO: "Crypto", CASH: "Cash", OTHER: "Other",
  };

  return (
    <div className="space-y-6 page-enter">
      {/* Back + Header */}
      <div className="flex items-center gap-4">
        <Link href="/accounts">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
              style={{ background: account.color }}
            >
              {account.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-bold">{account.name}</h1>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {TYPE_LABELS[account.type]}
                </Badge>
                <span className="text-xs text-muted-foreground">{account.currency}</span>
                {account.isDefault && (
                  <Badge className="text-[10px] bg-primary/15 text-primary border-0 h-4 px-1.5">
                    Default
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
        <AddTransactionDialog
          accounts={[account]}
          currency={user.currency}
        >
          <Button size="sm">+ Add Transaction</Button>
        </AddTransactionDialog>
      </div>

      {/* Balance + Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border rounded-2xl p-5 col-span-1" style={{ borderColor: account.color + "40", borderTopColor: account.color, borderTopWidth: 3 }}>
          <div className="text-xs text-muted-foreground mb-1">Current Balance</div>
          <div className="text-3xl font-bold">
            {formatCurrency(Number(account.balance), account.currency)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {account._count.transactions} transactions total
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span className="text-xs text-muted-foreground">Monthly Income</span>
          </div>
          <div className="text-xl font-bold text-emerald-500">
            {formatCurrency(monthlyIncome, account.currency)}
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-red-500" />
            <span className="text-xs text-muted-foreground">Monthly Expenses</span>
          </div>
          <div className="text-xl font-bold text-red-500">
            {formatCurrency(monthlyExpenses, account.currency)}
          </div>
        </div>
      </div>

      <SpendingChart data={chartData} currency={account.currency} />

      <RecentTransactions
        transactions={account.transactions as any}
        currency={account.currency}
      />
    </div>
  );
}
