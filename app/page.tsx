import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Brain,
  CreditCard,
  Globe,
  Receipt,
  Shield,
  Sparkles,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function LandingPage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Insights",
      description:
        "Gemini AI analyzes your spending patterns and delivers personalized financial recommendations in real-time.",
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
    {
      icon: Receipt,
      title: "Smart Receipt Scanner",
      description:
        "Snap a photo of any receipt and our AI instantly extracts merchant, items, and amounts — zero manual entry.",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description:
        "Interactive charts and deep-dive analytics reveal where your money goes and how to optimize it.",
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      icon: CreditCard,
      title: "Multi-Account Support",
      description:
        "Connect checking, savings, credit cards, investments, and crypto — all in one unified dashboard.",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      icon: Globe,
      title: "Multi-Currency",
      description:
        "Track finances across 15+ currencies with live exchange rates and automatic conversion.",
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
    },
    {
      icon: Zap,
      title: "Budget Planning",
      description:
        "Set smart budgets with AI-suggested allocations. Get alerts before you overspend.",
      color: "text-orange-400",
      bg: "bg-orange-500/10",
    },
  ];

  const stats = [
    { value: "15+", label: "Currencies" },
    { value: "AI", label: "Powered" },
    { value: "∞", label: "Accounts" },
    { value: "100%", label: "Secure" },
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Background mesh */}
      <div className="fixed inset-0 bg-gradient-mesh opacity-40 pointer-events-none" />
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Wallet className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            Wel<span className="gradient-text">th</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/sign-in">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button size="sm" className="gap-1.5">
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 pt-20 pb-32 px-6 max-w-7xl mx-auto text-center">
        <Badge
          variant="outline"
          className="mb-6 gap-1.5 text-primary border-primary/30 bg-primary/5"
        >
          <Sparkles className="w-3 h-3" />
          Powered by Gemini AI
        </Badge>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-none">
          Your money,{" "}
          <span className="gradient-text">intelligently</span>
          <br />
          managed.
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Welth combines AI-powered insights with beautiful analytics to give
          you complete control over your finances. Track, analyze, and grow —
          all in one place.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/sign-up">
            <Button size="lg" className="gap-2 h-12 px-8 text-base">
              Start for free
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/sign-in">
            <Button variant="outline" size="lg" className="h-12 px-8 text-base">
              View Demo
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-4 gap-8 max-w-lg mx-auto">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-bold gradient-text">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="relative z-10 px-6 max-w-6xl mx-auto mb-32">
        <div className="glass rounded-2xl border border-white/10 p-1 shadow-2xl shadow-primary/10">
          <div className="bg-card rounded-xl p-6">
            {/* Mock dashboard */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: "Total Balance", value: "$24,531.40", change: "+2.4%", color: "text-primary" },
                { label: "Monthly Income", value: "$6,200.00", change: "+8.1%", color: "text-emerald-400" },
                { label: "Monthly Expenses", value: "$3,847.20", change: "-3.2%", color: "text-red-400" },
              ].map((card) => (
                <div key={card.label} className="bg-muted/50 rounded-xl p-4">
                  <div className="text-xs text-muted-foreground mb-1">{card.label}</div>
                  <div className={`text-xl font-bold ${card.color}`}>{card.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{card.change} this month</div>
                </div>
              ))}
            </div>
            {/* Mock chart bars */}
            <div className="bg-muted/30 rounded-xl p-4 flex items-end gap-2 h-32">
              {[65, 45, 80, 55, 90, 70, 85, 60, 75, 95, 50, 88].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm bg-primary/60 transition-all"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-6 max-w-7xl mx-auto mb-32">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything you need to{" "}
            <span className="gradient-text">build wealth</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            A complete financial operating system with AI at its core.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="glass rounded-2xl p-6 card-hover group"
            >
              <div className={`w-10 h-10 ${feature.bg} rounded-xl flex items-center justify-center mb-4`}>
                <feature.icon className={`w-5 h-5 ${feature.color}`} />
              </div>
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 max-w-3xl mx-auto mb-32 text-center">
        <div className="glass rounded-3xl p-12 border border-primary/20">
          <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-3xl font-bold mb-4">
            Ready to take control of your finances?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of users who have transformed their financial life
            with Welth.
          </p>
          <Link href="/sign-up">
            <Button size="lg" className="gap-2 h-12 px-10">
              Create free account
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-3 h-3" />
            Bank-grade security · No credit card required
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border px-6 py-8 max-w-7xl mx-auto flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-primary" />
          <span className="font-semibold text-foreground">Welth</span>
        </div>
        <div>© 2025 Welth. AI-powered finance.</div>
      </footer>
    </div>
  );
}
