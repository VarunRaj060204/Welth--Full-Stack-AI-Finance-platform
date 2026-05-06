"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, MoreHorizontal, RefreshCcw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, getCategoryColor } from "@/lib/utils";
import { deleteTransaction } from "@/actions/transactions";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amount: number;
  description: string;
  date: Date;
  category: string;
  isRecurring: boolean;
  status: string;
  account: { name: string; color: string; currency: string };
}

interface TransactionsListProps {
  transactions: Transaction[];
  currency: string;
}

export function TransactionsList({ transactions, currency }: TransactionsListProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await deleteTransaction(id);
      toast.success("Transaction deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete transaction");
    } finally {
      setDeleting(null);
    }
  }

  // Group by date
  const grouped = transactions.reduce(
    (acc, t) => {
      const key = new Date(t.date).toDateString();
      if (!acc[key]) acc[key] = [];
      acc[key].push(t);
      return acc;
    },
    {} as Record<string, Transaction[]>
  );

  if (transactions.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl p-16 text-center">
        <div className="text-3xl mb-3">💸</div>
        <h3 className="font-semibold mb-1">No transactions found</h3>
        <p className="text-sm text-muted-foreground">
          Add your first transaction to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {Object.entries(grouped).map(([dateKey, txns]) => (
        <div key={dateKey}>
          {/* Date separator */}
          <div className="px-5 py-2.5 bg-muted/30 border-b border-border">
            <span className="text-xs font-medium text-muted-foreground">
              {formatDate(new Date(dateKey), "long")}
            </span>
            <span className="text-xs text-muted-foreground ml-2">
              ·{" "}
              {txns
                .reduce(
                  (s, t) =>
                    s +
                    (t.type === "INCOME" ? Number(t.amount) : -Number(t.amount)),
                  0
                )
                .toLocaleString("en-US", {
                  style: "currency",
                  currency,
                  signDisplay: "always",
                })}
            </span>
          </div>

          {/* Transactions */}
          {txns.map((t, i) => (
            <div
              key={t.id}
              className={cn(
                "flex items-center gap-4 px-5 py-3.5 hover:bg-muted/20 transition-colors",
                i < txns.length - 1 && "border-b border-border/50"
              )}
            >
              {/* Category icon */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold text-white"
                style={{ background: getCategoryColor(t.category) }}
              >
                {t.category.charAt(0)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{t.description}</span>
                  {t.isRecurring && (
                    <RefreshCcw className="w-3 h-3 text-muted-foreground shrink-0" />
                  )}
                  {t.status === "PENDING" && (
                    <Badge variant="outline" className="text-[10px] h-4 px-1">
                      Pending
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge
                    variant="secondary"
                    className="text-[10px] h-4 px-1.5"
                    style={{
                      background: getCategoryColor(t.category) + "20",
                      color: getCategoryColor(t.category),
                      border: "none",
                    }}
                  >
                    {t.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground">·</span>
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: t.account.color }}
                  />
                  <span className="text-xs text-muted-foreground">{t.account.name}</span>
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
                <div className="text-xs text-muted-foreground">
                  {new Date(t.date).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 text-muted-foreground"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => handleDelete(t.id)}
                    disabled={deleting === t.id}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
