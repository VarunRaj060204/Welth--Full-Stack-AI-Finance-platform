import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Sparkles, TrendingUp, AlertTriangle, CheckCircle2, Info, Zap } from "lucide-react";
import { getAIInsights } from "@/actions/budgets";
import { formatCurrency, getCategoryColor } from "@/lib/utils";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export const dynamic = "force-dynamic";

const INSIGHT_ICONS: Record<string, any> = {
  warning: AlertTriangle,
  tip: Zap,
  achievement: CheckCircle2,
  alert: AlertTriangle,
};

const INSIGHT_COLORS: Record<string, string> = {
  warning: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  tip: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  achievement: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  alert: "text-red-500 bg-red-500/10 border-red-500/20",
};

const IMPACT_BADGE: Record<string, string> = {
  high: "bg-red-500/15 text-red-500",
  medium: "bg-amber-500/15 text-amber-500",
  low: "bg-blue-500/15 text-blue-500",
};

export default async function InsightsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) redirect("/sign-in");

  let insights: any = null;
  let error: string | null = null;

  try {
    insights = await getAIInsights("month");
  } catch (e: any) {
    console.error("🔴 Insights error:", e?.message ?? e);
    error = e?.message ?? "Failed to generate insights.";
  }

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/15 rounded-xl flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Insights</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Powered by Gemini AI · Updated every 6 hours
          </p>
        </div>
      </div>

      {error ? (
        <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-2" />
          <p className="font-medium">{error}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Add your <code className="text-xs bg-muted px-1 py-0.5 rounded">GEMINI_API_KEY</code> to enable AI insights.
          </p>
        </div>
      ) : insights ? (
        <>
          {/* Financial Health Score */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold">Financial Health Score</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{insights.summary}</p>
              </div>
              <div className="text-right">
                <div
                  className={`text-4xl font-bold ${
                    insights.score >= 75
                      ? "text-emerald-500"
                      : insights.score >= 50
                      ? "text-amber-500"
                      : "text-red-500"
                  }`}
                >
                  {insights.score}
                </div>
                <div className="text-xs text-muted-foreground">/ 100</div>
              </div>
            </div>
            <Progress
              value={insights.score}
              className="h-2.5"
              style={
                {
                  "--progress-color":
                    insights.score >= 75
                      ? "hsl(142, 76%, 36%)"
                      : insights.score >= 50
                      ? "hsl(38, 92%, 50%)"
                      : "hsl(0, 84%, 60%)",
                } as React.CSSProperties
              }
            />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>Poor</span>
              <span>Fair</span>
              <span>Good</span>
              <span>Excellent</span>
            </div>
          </div>

          {/* Insights Grid */}
          <div>
            <h2 className="font-semibold mb-3">Personalized Insights</h2>
            <div className="grid md:grid-cols-2 gap-3">
              {insights.insights?.map((insight: any, i: number) => {
                const Icon = INSIGHT_ICONS[insight.type] ?? Info;
                const colorClass = INSIGHT_COLORS[insight.type] ?? INSIGHT_COLORS.tip;

                return (
                  <div
                    key={i}
                    className={`rounded-2xl p-5 border ${colorClass}`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className="w-5 h-5 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="font-semibold text-sm">{insight.title}</span>
                          <Badge
                            className={`text-[10px] h-4 px-1.5 border-0 ${IMPACT_BADGE[insight.impact] ?? IMPACT_BADGE.low}`}
                          >
                            {insight.impact}
                          </Badge>
                        </div>
                        <p className="text-sm opacity-80">{insight.description}</p>
                        {insight.action && (
                          <div className="mt-2 flex items-center gap-1.5 text-xs font-medium opacity-90">
                            <span>→</span>
                            <span>{insight.action}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Spending Categories */}
          {insights.topSpendingCategories?.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-semibold mb-4">Top Spending Categories</h2>
              <div className="space-y-3">
                {insights.topSpendingCategories.slice(0, 5).map((cat: any) => (
                  <div key={cat.category}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ background: getCategoryColor(cat.category) }}
                        />
                        <span className="text-sm font-medium">{cat.category}</span>
                        <Badge
                          className={`text-[10px] h-4 px-1.5 border-0 ${
                            cat.trend === "up"
                              ? "bg-red-500/15 text-red-500"
                              : cat.trend === "down"
                              ? "bg-emerald-500/15 text-emerald-500"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {cat.trend === "up" ? "↑" : cat.trend === "down" ? "↓" : "→"}
                          {" "}{cat.trend}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold">
                          {formatCurrency(cat.amount, user.currency)}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {cat.percentage?.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <Progress
                      value={cat.percentage}
                      className="h-1.5"
                      style={
                        {
                          "--progress-color": getCategoryColor(cat.category),
                        } as React.CSSProperties
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {insights.recommendations?.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Savings Recommendations
              </h2>
              <div className="space-y-3">
                {insights.recommendations.map((rec: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-muted/40 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-primary/20 rounded-lg flex items-center justify-center text-xs font-bold text-primary">
                        {i + 1}
                      </div>
                      <span className="text-sm">{rec.title}</span>
                    </div>
                    {rec.potentialSaving > 0 && (
                      <Badge className="bg-emerald-500/15 text-emerald-500 border-0 text-xs">
                        Save {formatCurrency(rec.potentialSaving, user.currency)}/mo
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-card border border-border rounded-2xl p-16 text-center">
          <Sparkles className="w-8 h-8 text-primary mx-auto mb-3 animate-pulse" />
          <p className="font-medium">Generating your insights...</p>
          <p className="text-sm text-muted-foreground mt-1">
            Gemini AI is analyzing your financial data
          </p>
        </div>
      )}
    </div>
  );
}
