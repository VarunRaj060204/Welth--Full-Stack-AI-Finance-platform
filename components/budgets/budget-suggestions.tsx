"use client";

import { useEffect, useState } from "react";
import { Loader2, Sparkles, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { getBudgetSuggestions } from "@/actions/budgets";

interface BudgetSuggestionsProps {
  currency: string;
}

export function BudgetSuggestions({ currency }: BudgetSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState(false);

  async function loadSuggestions() {
    setLoading(true);
    try {
      const data = await getBudgetSuggestions();
      setSuggestions(data);
      setRevealed(true);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }

  const PRIORITY_COLOR: Record<string, string> = {
    essential: "bg-red-500/15 text-red-500",
    want: "bg-blue-500/15 text-blue-500",
    savings: "bg-emerald-500/15 text-emerald-500",
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="font-semibold">AI Budget Suggestions</h3>
          <Badge className="h-4 px-1.5 text-[10px] bg-primary/20 text-primary border-0">
            Gemini
          </Badge>
        </div>
        {!revealed && (
          <Button
            variant="outline"
            size="sm"
            onClick={loadSuggestions}
            disabled={loading}
            className="gap-1.5 h-8 text-xs"
          >
            {loading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            {loading ? "Analyzing..." : "Generate suggestions"}
          </Button>
        )}
      </div>

      {!revealed && !loading && (
        <p className="text-sm text-muted-foreground">
          Let Gemini AI analyze your income and spending patterns to suggest optimal budget
          allocations based on the 50/30/20 rule.
        </p>
      )}

      {loading && (
        <div className="flex items-center gap-3 text-sm text-muted-foreground py-4">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          Gemini is analyzing your financial data...
        </div>
      )}

      {suggestions && (
        <>
          {suggestions.summary && (
            <p className="text-sm text-muted-foreground mb-4">{suggestions.summary}</p>
          )}
          <div className="grid md:grid-cols-2 gap-3">
            {suggestions.suggestions?.map((s: any, i: number) => (
              <div
                key={i}
                className="flex items-start justify-between p-3 bg-muted/40 rounded-xl"
              >
                <div className="flex-1 min-w-0 mr-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{s.category}</span>
                    <Badge
                      className={`text-[10px] h-4 px-1.5 border-0 ${
                        PRIORITY_COLOR[s.priority] ?? "bg-muted text-muted-foreground"
                      }`}
                    >
                      {s.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {s.reasoning}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-semibold">
                    {formatCurrency(s.suggestedAmount, currency)}
                  </div>
                  {s.currentAmount > 0 && s.currentAmount !== s.suggestedAmount && (
                    <div
                      className={`text-[10px] mt-0.5 ${
                        s.suggestedAmount > s.currentAmount
                          ? "text-red-500"
                          : "text-emerald-500"
                      }`}
                    >
                      {s.suggestedAmount > s.currentAmount ? "↑" : "↓"}{" "}
                      {formatCurrency(Math.abs(s.suggestedAmount - s.currentAmount), currency)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {suggestions.savingsGoal > 0 && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-primary/10 rounded-xl border border-primary/20">
              <TrendingUp className="w-4 h-4 text-primary shrink-0" />
              <span className="text-sm">
                Suggested monthly savings goal:{" "}
                <strong className="text-primary">
                  {formatCurrency(suggestions.savingsGoal, currency)}
                </strong>
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
