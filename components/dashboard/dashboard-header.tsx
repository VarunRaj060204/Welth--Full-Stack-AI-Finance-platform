"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface DashboardHeaderProps {
  userName?: string | null;
}

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {greeting}
          {userName ? `, ${userName.split(" ")[0]}` : ""} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Here&apos;s what&apos;s happening with your finances today.
        </p>
      </div>
      <Link href="/insights">
        <Button variant="outline" size="sm" className="gap-2 border-primary/30 text-primary hover:bg-primary/10">
          <Sparkles className="w-3.5 h-3.5" />
          AI Insights
        </Button>
      </Link>
    </div>
  );
}
