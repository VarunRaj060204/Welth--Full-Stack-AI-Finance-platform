import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { CategoryPieChart } from "@/components/charts/category-pie-chart";
import { CashFlowChart } from "@/components/charts/cash-flow-chart";
import { AnalyticsHeader } from "@/components/analytics/analytics-header";
import { AnalyticsStats } from "@/components/analytics/analytics-stats";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: { period?: string };
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) redirect("/sign-in");

  const period = (searchParams.period as "month" | "quarter" | "year") ?? "month";

  const now = new Date();
  let startDate: Date;
  switch (period) {
    case "quarter":
      startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      break;
    case "year":
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const rawTransactions = await db.transaction.findMany({
    where: {
      userId: user.id,
      date: { gte: startDate },
      status: "COMPLETED",
    },
    orderBy: { date: "asc" },
  });

  // ✅ Serialize all Decimal and Date fields
  const transactions = rawTransactions.map((t) => ({
    ...t,
    amount: Number(t.amount),
    exchangeRate: t.exchangeRate ? Number(t.exchangeRate) : null,
    date: t.date.toISOString(),
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    nextRecurringDate: t.nextRecurringDate?.toISOString() ?? null,
  }));

  const income = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((s, t) => s + t.amount, 0);

  const expenses = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((s, t) => s + t.amount, 0);

  // Category breakdown
  const categoryData = Object.entries(
    transactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] ?? 0) + t.amount;
        return acc;
      }, {} as Record<string, number>)
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // Daily cash flow
  const dailyData: Record<string, { income: number; expenses: number }> = {};
  transactions.forEach((t) => {
    const key = new Date(t.date).toISOString().split("T")[0];
    if (!dailyData[key]) dailyData[key] = { income: 0, expenses: 0 };
    if (t.type === "INCOME") dailyData[key].income += t.amount;
    if (t.type === "EXPENSE") dailyData[key].expenses += t.amount;
  });

  const cashFlowData = Object.entries(dailyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, values]) => ({
      date: new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      ...values,
      net: values.income - values.expenses,
    }));

  return (
    <div className="space-y-6 page-enter">
      <AnalyticsHeader period={period} />
      <AnalyticsStats
        income={income}
        expenses={expenses}
        net={income - expenses}
        transactionCount={transactions.length}
        currency={user.currency}
      />
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <CashFlowChart data={cashFlowData} currency={user.currency} />
        </div>
        <div className="lg:col-span-2">
          <CategoryPieChart data={categoryData} currency={user.currency} />
        </div>
      </div>
    </div>
  );
}