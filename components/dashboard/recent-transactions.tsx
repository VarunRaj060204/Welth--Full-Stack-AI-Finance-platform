"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, getCategoryColor } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amount: number;
  description: string;
  date: Date;
  category: string;
  account: { name: string; color: string; currency: string };
}

interface RecentTransactionsProps {
  transactions: Transaction[];
  currency: string;
}

export function RecentTransactions({ transactions, currency }: RecentTransactionsProps) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold">Recent Transactions</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Your latest activity</p>
        </div>
        <Link href="/transactions">
          <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground h-7">
            View all <ArrowRight className="w-3 h-3" />
          </Button>
        </Link>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-sm">
          No transactions yet. Add one to get started.
        </div>
      ) : (
        <div className="space-y-1">
          {transactions.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/40 transition-colors group"
            >
              {/* Category dot */}
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold text-white"
                style={{ background: getCategoryColor(t.category) }}
              >
                {t.category.charAt(0)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{t.description}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs text-muted-foreground">
                    {formatDate(t.date, "relative")}
                  </span>
                  <span className="text-muted-foreground/40">·</span>
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: t.account.color }}
                  />
                  <span className="text-xs text-muted-foreground truncate">
                    {t.account.name}
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div
                  className={cn(
                    "text-sm font-semibold",
                    t.type === "INCOME" ? "text-emerald-500" : "text-foreground"
                  )}
                >
                  {t.type === "INCOME" ? "+" : "-"}
                  {formatCurrency(Number(t.amount), t.account.currency || currency)}
                </div>
                <Badge
                  variant="secondary"
                  className="text-[10px] h-4 px-1.5 mt-0.5"
                  style={{
                    background: getCategoryColor(t.category) + "20",
                    color: getCategoryColor(t.category),
                    border: "none",
                  }}
                >
                  {t.category}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
