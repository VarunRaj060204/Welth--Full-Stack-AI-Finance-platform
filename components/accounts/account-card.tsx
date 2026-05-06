"use client";

import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, MoreHorizontal, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency, formatDate } from "@/lib/utils";
import { deleteAccount, updateAccount } from "@/actions/accounts";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";

const TYPE_LABELS: Record<string, string> = {
  CHECKING: "Checking",
  SAVINGS: "Savings",
  CREDIT_CARD: "Credit Card",
  INVESTMENT: "Investment",
  CRYPTO: "Crypto",
  CASH: "Cash",
  OTHER: "Other",
};

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  color: string;
  isDefault: boolean;
  _count: { transactions: number };
  transactions: Array<{
    date: Date;
    amount: number;
    type: string;
    description: string;
  }>;
}

export function AccountCard({
  account,
  currency,
}: {
  account: Account;
  currency: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const lastTx = account.transactions[0];

  async function handleDelete() {
    if (!confirm("Delete this account? All transactions will be deleted.")) return;
    setLoading(true);
    try {
      await deleteAccount(account.id);
      toast.success("Account deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete account");
    } finally {
      setLoading(false);
    }
  }

  async function handleSetDefault() {
    try {
      await updateAccount(account.id, { isDefault: true });
      toast.success("Default account updated");
      router.refresh();
    } catch {
      toast.error("Failed to update account");
    }
  }

  return (
    <div
      className="bg-card border border-border rounded-2xl p-5 card-hover relative overflow-hidden"
      style={{ borderTop: `3px solid ${account.color}` }}
    >
      {/* Background accent */}
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-5 pointer-events-none"
        style={{ background: account.color, transform: "translate(30%, -30%)" }}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm"
            style={{ background: account.color }}
          >
            {account.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold flex items-center gap-1.5">
              {account.name}
              {account.isDefault && (
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {TYPE_LABELS[account.type] ?? account.type}
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/accounts/${account.id}`}>View details</Link>
            </DropdownMenuItem>
            {!account.isDefault && (
              <DropdownMenuItem onClick={handleSetDefault}>
                Set as default
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" />
              Delete account
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Balance */}
      <div className="mb-4">
        <div className="text-xs text-muted-foreground mb-0.5">Current Balance</div>
        <div className="text-2xl font-bold tracking-tight">
          {formatCurrency(Number(account.balance), account.currency || currency)}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="text-[10px] h-5 px-2">
          {account._count.transactions} transactions
        </Badge>

        {lastTx ? (
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            {lastTx.type === "INCOME" ? (
              <ArrowUpRight className="w-3 h-3 text-emerald-500" />
            ) : (
              <ArrowDownRight className="w-3 h-3 text-red-500" />
            )}
            {formatDate(lastTx.date, "relative")}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">No transactions</div>
        )}
      </div>
    </div>
  );
}
