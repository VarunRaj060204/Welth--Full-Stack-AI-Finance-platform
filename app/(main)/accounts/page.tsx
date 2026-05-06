import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { CreditCard, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { AccountCard } from "@/components/accounts/account-card";
import { CreateAccountDialog } from "@/components/accounts/create-account-dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: {
      accounts: {
        include: {
          _count: { select: { transactions: true } },
          transactions: {
            orderBy: { date: "desc" },
            take: 1,
            select: { date: true, amount: true, type: true, description: true },
          },
        },
        orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!user) redirect("/sign-in");

  // ✅ Serialize all Decimal and Date fields
  const serializedAccounts = user.accounts.map((account) => ({
    ...account,
    balance: Number(account.balance),
    createdAt: account.createdAt.toISOString(),
    updatedAt: account.updatedAt.toISOString(),
    transactions: account.transactions.map((t) => ({
      ...t,
      amount: Number(t.amount),
      date: t.date.toISOString(),
    })),
  }));

  const totalBalance = serializedAccounts.reduce((s, a) => s + a.balance, 0);
  const totalAccounts = serializedAccounts.length;

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-violet-500/15 rounded-xl flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-violet-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Accounts</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {totalAccounts} account{totalAccounts !== 1 ? "s" : ""} ·{" "}
              <span className="text-foreground font-medium">
                {formatCurrency(totalBalance, user.currency)}
              </span>{" "}
              total
            </p>
          </div>
        </div>
        <CreateAccountDialog currency={user.currency}>
          <Button size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" /> Add Account
          </Button>
        </CreateAccountDialog>
      </div>

      {serializedAccounts.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-16 text-center">
          <CreditCard className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
          <h3 className="font-semibold mb-1">No accounts yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add your bank accounts, credit cards, and investments to get started.
          </p>
          <CreateAccountDialog currency={user.currency}>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" /> Add your first account
            </Button>
          </CreateAccountDialog>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {serializedAccounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account as any}
              currency={user.currency}
            />
          ))}

          <CreateAccountDialog currency={user.currency}>
            <button className="bg-card border border-dashed border-border rounded-2xl p-6 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-border/80 transition-all min-h-[180px] group">
              <div className="w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center group-hover:bg-muted transition-colors">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium">Add Account</span>
            </button>
          </CreateAccountDialog>
        </div>
      )}
    </div>
  );
}