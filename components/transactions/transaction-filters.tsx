"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface TransactionFiltersProps {
  accounts: Array<{ id: string; name: string }>;
  categories: string[];
}

export function TransactionFilters({ accounts, categories }: TransactionFiltersProps) {
  const router = useRouter();
  const params = useSearchParams();

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const p = new URLSearchParams(params.toString());
      if (value && value !== "all") {
        p.set(key, value);
      } else {
        p.delete(key);
      }
      router.push(`/transactions?${p.toString()}`);
    },
    [params, router]
  );

  const clearFilters = () => router.push("/transactions");
  const hasFilters = params.toString().length > 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search transactions..."
          defaultValue={params.get("search") ?? ""}
          onChange={(e) => updateFilter("search", e.target.value)}
          className="pl-9 h-9"
        />
      </div>

      <Select
        value={params.get("type") ?? "all"}
        onValueChange={(v) => updateFilter("type", v)}
      >
        <SelectTrigger className="w-36 h-9">
          <SelectValue placeholder="All types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          <SelectItem value="INCOME">Income</SelectItem>
          <SelectItem value="EXPENSE">Expense</SelectItem>
          <SelectItem value="TRANSFER">Transfer</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={params.get("accountId") ?? "all"}
        onValueChange={(v) => updateFilter("accountId", v)}
      >
        <SelectTrigger className="w-36 h-9">
          <SelectValue placeholder="All accounts" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All accounts</SelectItem>
          {accounts.map((a) => (
            <SelectItem key={a.id} value={a.id}>
              {a.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={params.get("category") ?? "all"}
        onValueChange={(v) => updateFilter("category", v)}
      >
        <SelectTrigger className="w-40 h-9">
          <SelectValue placeholder="All categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-9 gap-1.5 text-muted-foreground"
        >
          <X className="w-3.5 h-3.5" />
          Clear
        </Button>
      )}
    </div>
  );
}
