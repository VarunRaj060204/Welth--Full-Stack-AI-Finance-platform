"use client";

import Link from "next/link";
import { ArrowRight, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  color: string;
  isDefault: boolean;
}

interface AccountsOverviewProps {
  accounts: Account[];
  currency: string;
}

const TYPE_LABELS: Record<string, string> = {
  CHECKING: "Checking",
  SAVINGS: "Savings",
  CREDIT_CARD: "Credit Card",
  INVESTMENT: "Investment",
  CRYPTO: "Crypto",
  CASH: "Cash",
  OTHER: "Other",
};

export function AccountsOverview({ accounts, currency }: AccountsOverviewProps) {
  const totalBalance = accounts.reduce((s, a) => s + Number(a.balance), 0);

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold">Accounts</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatCurrency(totalBalance, currency)} total
          </p>
        </div>
        <Link href="/accounts">
          <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground h-7">
            View all <ArrowRight className="w-3 h-3" />
          </Button>
        </Link>
      </div>

      <div className="space-y-2">
        {accounts.slice(0, 4).map((account) => (
          <Link key={account.id} href={`/accounts/${account.id}`}>
            <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/40 transition-colors cursor-pointer">
              <div
                className="w-9 h-9 rounded-xl shrink-0"
                style={{ background: account.color + "30", border: `2px solid ${account.color}40` }}
              >
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: account.color }} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate flex items-center gap-1.5">
                  {account.name}
                  {account.isDefault && (
                    <span className="text-[9px] bg-primary/15 text-primary px-1 rounded">DEFAULT</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {TYPE_LABELS[account.type] ?? account.type}
                </div>
              </div>
              <div className="text-sm font-semibold shrink-0">
                {formatCurrency(Number(account.balance), account.currency)}
              </div>
            </div>
          </Link>
        ))}

        <Link href="/accounts?new=1">
          <Button
            variant="ghost"
            className="w-full h-10 border border-dashed border-border text-muted-foreground hover:text-foreground gap-2 mt-1"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Add Account
          </Button>
        </Link>
      </div>
    </div>
  );
}
