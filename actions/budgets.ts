"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { BudgetPeriod } from "@prisma/client";
import { z } from "zod";
import { generateInsights, generateBudgetSuggestions } from "@/lib/gemini";

// ─── Budget Actions ─────────────────────────────────────────────────────────
const budgetSchema = z.object({
  name: z.string().min(1).max(50),
  amount: z.number().positive(),
  category: z.string(),
  period: z.nativeEnum(BudgetPeriod),
  startDate: z.string(),
  endDate: z.string(),
  alertAt: z.number().min(1).max(100).default(80),
  color: z.string().default("#6366f1"),
});

export async function getBudgets() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) throw new Error("User not found");

  const budgets = await db.budget.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  // Recalculate spent for each budget
  const now = new Date();
  const enriched = await Promise.all(
    budgets.map(async (budget) => {
      const spent = await db.transaction.aggregate({
        where: {
          userId: user.id,
          category: budget.category,
          type: "EXPENSE",
          status: "COMPLETED",
          date: {
            gte: budget.startDate,
            lte: budget.endDate,
          },
        },
        _sum: { amount: true },
      });

      const spentAmount = Number(spent._sum.amount ?? 0);
      const percentage = Number(budget.amount) > 0 
        ? (spentAmount / Number(budget.amount)) * 100 
        : 0;

      return {
        ...budget,
        spent: spentAmount,
        percentage,
        remaining: Number(budget.amount) - spentAmount,
        isAlert: percentage >= budget.alertAt,
        isOverBudget: percentage >= 100,
        isActive: budget.startDate <= now && budget.endDate >= now,
      };
    })
  );

  return enriched;
}

export async function createBudget(data: z.infer<typeof budgetSchema>) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const validated = budgetSchema.parse(data);
  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) throw new Error("User not found");

  const budget = await db.budget.create({
    data: {
      ...validated,
      userId: user.id,
      startDate: new Date(validated.startDate),
      endDate: new Date(validated.endDate),
    },
  });

  revalidatePath("/budgets");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateBudget(budgetId: string, data: Partial<z.infer<typeof budgetSchema>>) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) throw new Error("User not found");

  const budget = await db.budget.update({
    where: { id: budgetId, userId: user.id },
    data: {
      ...data,
      ...(data.startDate && { startDate: new Date(data.startDate) }),
      ...(data.endDate && { endDate: new Date(data.endDate) }),
    },
  });

  revalidatePath("/budgets");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteBudget(budgetId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) throw new Error("User not found");

  await db.budget.delete({ where: { id: budgetId, userId: user.id } });

  revalidatePath("/budgets");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function getBudgetSuggestions() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) throw new Error("User not found");

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [incomeAgg, expensesByCategory] = await Promise.all([
    db.transaction.aggregate({
      where: { userId: user.id, type: "INCOME", date: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    db.transaction.groupBy({
      by: ["category"],
      where: { userId: user.id, type: "EXPENSE", date: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
  ]);

  const income = Number(incomeAgg._sum.amount ?? 0);
  const expenses = expensesByCategory.map((e) => ({
    category: e.category,
    amount: Number(e._sum.amount ?? 0),
  }));

  return generateBudgetSuggestions({ income, expenses, currency: user.currency });
}

// ─── AI Insights Actions ─────────────────────────────────────────────────────
export async function getAIInsights(period: "month" | "quarter" | "year" = "month") {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) throw new Error("User not found");

  // Check cache
  const cached = await db.insightCache.findFirst({
    where: {
      userId: user.id,
      type: `insights_${period}`,
      expiresAt: { gt: new Date() },
    },
  });

  if (cached) return cached.data;

  // Gather data
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

  const [transactions, budgets, accounts] = await Promise.all([
    db.transaction.findMany({
      where: { userId: user.id, date: { gte: startDate }, status: "COMPLETED" },
      select: { type: true, amount: true, category: true, date: true, description: true },
      orderBy: { date: "desc" },
      take: 50,
    }),
    db.budget.findMany({
      where: { userId: user.id },
      select: { category: true, amount: true, spent: true },
    }),
    db.account.findMany({
      where: { userId: user.id },
      select: { type: true, balance: true, currency: true },
    }),
  ]);

  const insights = await generateInsights({
    transactions: transactions.map((t) => ({
      type: t.type,
      amount: Number(t.amount),
      category: t.category,
      date: t.date.toISOString(),
      description: t.description,
    })),
    budgets: budgets.map((b) => ({
      category: b.category,
      amount: Number(b.amount),
      spent: Number(b.spent),
    })),
    accounts: accounts.map((a) => ({
      type: a.type,
      balance: Number(a.balance),
      currency: a.currency,
    })),
    period,
  });

  // Cache for 6 hours
  await db.insightCache.create({
    data: {
      userId: user.id,
      type: `insights_${period}`,
      data: insights,
      expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
    },
  });

  return insights;
}
