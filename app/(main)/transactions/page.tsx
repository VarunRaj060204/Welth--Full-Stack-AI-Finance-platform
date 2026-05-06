import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { TransactionsList } from "@/components/transactions/transactions-list";
import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { AddTransactionDialog } from "@/components/transactions/add-transaction-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function TransactionsPage(props: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: { accounts: true },
  });
  if (!user) redirect("/sign-in");

  const searchParams = await props.searchParams;

  const where: Record<string, unknown> = { userId: user.id };
  if (searchParams.accountId) where.accountId = searchParams.accountId;
  if (searchParams.type) where.type = searchParams.type;
  if (searchParams.category) where.category = searchParams.category;
  if (searchParams.search) {
    where.description = { contains: searchParams.search, mode: "insensitive" };
  }
  if (searchParams.from || searchParams.to) {
    where.date = {
      ...(searchParams.from && { gte: new Date(searchParams.from) }),
      ...(searchParams.to && { lte: new Date(searchParams.to) }),
    };
  }

  const [transactions, total, categories] = await Promise.all([
    db.transaction.findMany({
      where,
      include: { account: { select: { name: true, color: true, currency: true } } },
      orderBy: { date: "desc" },
      take: 50,
    }),
    db.transaction.count({ where }),
    db.transaction.groupBy({
      by: ["category"],
      where: { userId: user.id },
      orderBy: { _count: { category: "desc" } },
    }),
  ]);

  // ✅ Manual serialization - most reliable approach
  const safeAccounts = user.accounts.map((a) => ({
    id: a.id,
    name: a.name,
    type: a.type,
    balance: Number(a.balance),
    currency: a.currency,
    isDefault: a.isDefault,
    color: a.color,
    icon: a.icon,
    userId: a.userId,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }));

  const safeTransactions = transactions.map((t) => ({
    id: t.id,
    type: t.type,
    amount: Number(t.amount),
    description: t.description,
    date: t.date.toISOString(),
    category: t.category,
    subCategory: t.subCategory,
    currency: t.currency,
    exchangeRate: t.exchangeRate ? Number(t.exchangeRate) : null,
    isRecurring: t.isRecurring,
    recurringInterval: t.recurringInterval,
    nextRecurringDate: t.nextRecurringDate?.toISOString() ?? null,
    receiptUrl: t.receiptUrl,
    aiInsight: t.aiInsight,
    tags: t.tags,
    status: t.status,
    userId: t.userId,
    accountId: t.accountId,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    account: t.account,
  }));

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {total} transaction{total !== 1 ? "s" : ""} total
          </p>
        </div>
        <AddTransactionDialog
          accounts={safeAccounts as any}
          currency={user.currency}
        >
          <Button size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" /> Add Transaction
          </Button>
        </AddTransactionDialog>
      </div>

      <TransactionFilters
        accounts={safeAccounts as any}
        categories={categories.map((c) => c.category)}
      />

      <TransactionsList
        transactions={safeTransactions as any}
        currency={user.currency}
      />
    </div>
  );
}