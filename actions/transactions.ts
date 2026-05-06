"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { TransactionType, TransactionStatus, RecurringInterval } from "@prisma/client";
import { z } from "zod";
import { categorizeTransaction } from "@/lib/gemini";

const transactionSchema = z.object({
  type: z.nativeEnum(TransactionType),
  amount: z.number().positive(),
  description: z.string().min(1).max(200),
  date: z.string(),
  category: z.string(),
  subCategory: z.string().optional(),
  currency: z.string().length(3).default("USD"),
  accountId: z.string(),
  isRecurring: z.boolean().default(false),
  recurringInterval: z.nativeEnum(RecurringInterval).optional(),
  receiptUrl: z.string().optional(),
  tags: z.array(z.string()).default([]),
  status: z.nativeEnum(TransactionStatus).default("COMPLETED"),
});

export async function getTransactions(filters?: {
  accountId?: string;
  type?: TransactionType;
  category?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) throw new Error("User not found");

  const where: Record<string, unknown> = { userId: user.id };

  if (filters?.accountId) where.accountId = filters.accountId;
  if (filters?.type) where.type = filters.type;
  if (filters?.category) where.category = filters.category;
  if (filters?.search) {
    where.description = { contains: filters.search, mode: "insensitive" };
  }
  if (filters?.startDate || filters?.endDate) {
    where.date = {
      ...(filters.startDate && { gte: new Date(filters.startDate) }),
      ...(filters.endDate && { lte: new Date(filters.endDate) }),
    };
  }

  const [transactions, total] = await Promise.all([
    db.transaction.findMany({
      where,
      include: { account: { select: { name: true, currency: true, color: true } } },
      orderBy: { date: "desc" },
      take: filters?.limit ?? 50,
      skip: filters?.offset ?? 0,
    }),
    db.transaction.count({ where }),
  ]);

  return { transactions, total };
}

export async function createTransaction(data: z.infer<typeof transactionSchema>) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const validated = transactionSchema.parse(data);
  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) throw new Error("User not found");

  // Verify account belongs to user
  const account = await db.account.findFirst({
    where: { id: validated.accountId, userId: user.id },
  });
  if (!account) throw new Error("Account not found");

  // Auto-categorize with AI if no category
  let category = validated.category;
  let subCategory = validated.subCategory;
  let tags = validated.tags;

  if (!category || category === "Other") {
    try {
      const aiResult = await categorizeTransaction(validated.description, validated.amount);
      category = aiResult.category;
      subCategory = aiResult.subCategory;
      tags = aiResult.tags;
    } catch {
      // fallback to provided category
    }
  }

  // Calculate next recurring date
  let nextRecurringDate: Date | undefined;
  if (validated.isRecurring && validated.recurringInterval) {
    nextRecurringDate = calculateNextRecurringDate(
      new Date(validated.date),
      validated.recurringInterval
    );
  }

  const transaction = await db.$transaction(async (tx) => {
    const t = await tx.transaction.create({
      data: {
        ...validated,
        category,
        subCategory,
        tags,
        userId: user.id,
        date: new Date(validated.date),
        nextRecurringDate,
      },
    });

    // Update account balance
    const balanceChange =
      validated.type === "INCOME" ? validated.amount : -validated.amount;

    await tx.account.update({
      where: { id: validated.accountId },
      data: { balance: { increment: balanceChange } },
    });

    // Update budget spent
    if (validated.type === "EXPENSE") {
      await tx.budget.updateMany({
        where: {
          userId: user.id,
          category,
          startDate: { lte: new Date(validated.date) },
          endDate: { gte: new Date(validated.date) },
        },
        data: { spent: { increment: validated.amount } },
      });
    }

    return t;
  });

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath(`/accounts/${validated.accountId}`);
  return { success: true };
}

export async function deleteTransaction(transactionId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) throw new Error("User not found");

  const transaction = await db.transaction.findFirst({
    where: { id: transactionId, userId: user.id },
  });
  if (!transaction) throw new Error("Transaction not found");

  await db.$transaction(async (tx) => {
    await tx.transaction.delete({ where: { id: transactionId } });

    // Reverse balance
    const balanceChange =
      transaction.type === "INCOME"
        ? -Number(transaction.amount)
        : Number(transaction.amount);

    await tx.account.update({
      where: { id: transaction.accountId },
      data: { balance: { increment: balanceChange } },
    });
  });

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  return { success: true };
}

export async function getTransactionStats(period: "week" | "month" | "year" = "month") {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) throw new Error("User not found");

  const now = new Date();
  let startDate: Date;

  switch (period) {
    case "week":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "year":
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const transactions = await db.transaction.findMany({
    where: {
      userId: user.id,
      date: { gte: startDate },
      status: "COMPLETED",
    },
  });

  const income = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const expenses = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const byCategory = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce(
      (acc, t) => {
        const cat = t.category;
        acc[cat] = (acc[cat] ?? 0) + Number(t.amount);
        return acc;
      },
      {} as Record<string, number>
    );

  return {
    income,
    expenses,
    net: income - expenses,
    savingsRate: income > 0 ? ((income - expenses) / income) * 100 : 0,
    transactionCount: transactions.length,
    byCategory,
  };
}

function calculateNextRecurringDate(date: Date, interval: RecurringInterval): Date {
  const next = new Date(date);
  switch (interval) {
    case "DAILY":
      next.setDate(next.getDate() + 1);
      break;
    case "WEEKLY":
      next.setDate(next.getDate() + 7);
      break;
    case "MONTHLY":
      next.setMonth(next.getMonth() + 1);
      break;
    case "YEARLY":
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}
