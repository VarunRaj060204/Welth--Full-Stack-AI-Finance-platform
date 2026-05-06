"use client";

import { useRouter } from "next/navigation";
import { BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PERIODS = [
  { value: "month", label: "This Month" },
  { value: "quarter", label: "This Quarter" },
  { value: "year", label: "This Year" },
] as const;

export function AnalyticsHeader({ period }: { period: string }) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-blue-500/15 rounded-xl flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Deep-dive into your financial data
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 bg-muted/50 rounded-xl p-1">
        {PERIODS.map((p) => (
          <Button
            key={p.value}
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/analytics?period=${p.value}`)}
            className={cn(
              "h-7 px-3 text-xs font-medium",
              period === p.value
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {p.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
