# 💰 Welth — AI Finance Platform

> A full-stack AI-powered personal finance platform built with Next.js 14, Gemini AI, Prisma, Tailwind CSS, and shadcn/ui.

![Welth Dashboard](https://via.placeholder.com/1200x630/0a0f1e/22c55e?text=Welth+AI+Finance+Platform)

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 **AI Insights** | Gemini AI analyzes spending patterns and delivers personalized financial recommendations |
| 📷 **Receipt Scanner** | Snap a receipt photo — AI extracts merchant, items, amounts automatically |
| 📊 **Advanced Analytics** | Interactive charts: cash flow, category breakdown, income vs expenses |
| 🏦 **Multi-Account** | Checking, savings, credit cards, investments, crypto — all in one place |
| 🌍 **Multi-Currency** | 15+ currencies with live exchange rates |
| 🎯 **Budget Planning** | AI-suggested budget allocations with real-time alerts |
| 🔄 **Recurring Transactions** | Automated recurring payments tracked via Inngest cron jobs |
| 🔐 **Auth** | Clerk authentication with webhooks for user sync |

---

## 🛠 Tech Stack

```
Frontend:     Next.js 14 (App Router) · TypeScript · Tailwind CSS · shadcn/ui
AI:           Google Gemini 1.5 Flash & Pro (insights, receipt scanning, categorization)
Database:     PostgreSQL · Prisma ORM
Auth:         Clerk (auth + webhooks)
Background:   Inngest (cron jobs for recurring transactions)
Charts:       Recharts
Forms:        React Hook Form + Zod
```

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/welth.git
cd welth
npm install
```

### 2. Set Environment Variables

Copy `.env.example` to `.env` and fill in:

```bash
cp .env.example .env
```

Required keys:
- **DATABASE_URL** — PostgreSQL connection string (Neon, Supabase, Railway, or local)
- **NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY** + **CLERK_SECRET_KEY** — From [clerk.com](https://clerk.com)
- **CLERK_WEBHOOK_SECRET** — From Clerk Dashboard → Webhooks
- **GEMINI_API_KEY** — From [Google AI Studio](https://aistudio.google.com)
- **INNGEST_EVENT_KEY** + **INNGEST_SIGNING_KEY** — From [inngest.com](https://inngest.com)

### 3. Setup Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# (Optional) Seed with demo data
npm run db:seed

# (Optional) Open Prisma Studio
npm run db:studio
```

### 4. Setup shadcn/ui Components

```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input label select switch dialog badge progress tabs toast scroll-area separator avatar dropdown-menu tooltip
```

### 5. Setup Clerk Webhook

In Clerk Dashboard → Webhooks → Add Endpoint:
- URL: `https://your-domain.com/api/webhooks/clerk`
- Events: `user.created`, `user.updated`, `user.deleted`

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
welth/
├── app/
│   ├── (main)/              # Authenticated app routes
│   │   ├── dashboard/       # Main dashboard
│   │   ├── accounts/        # Multi-account management
│   │   ├── transactions/    # Transaction list + filters
│   │   ├── budgets/         # Budget planning
│   │   ├── analytics/       # Advanced charts
│   │   ├── insights/        # AI-powered insights
│   │   └── settings/        # User settings
│   ├── api/
│   │   ├── receipts/scan/   # AI receipt scanning endpoint
│   │   ├── webhooks/clerk/  # Clerk user sync
│   │   ├── inngest/         # Background job handler
│   │   └── settings/        # Settings API
│   └── auth/                # Sign-in / Sign-up pages
├── components/
│   ├── dashboard/           # Dashboard widgets
│   ├── transactions/        # Transaction components
│   ├── accounts/            # Account components
│   ├── budgets/             # Budget components
│   ├── analytics/           # Analytics components
│   ├── charts/              # Recharts wrappers
│   └── ui/                  # shadcn/ui components
├── actions/                 # Server Actions
│   ├── accounts.ts          # Account CRUD
│   ├── transactions.ts      # Transaction CRUD + stats
│   └── budgets.ts           # Budget CRUD + AI insights
├── lib/
│   ├── db.ts                # Prisma client singleton
│   ├── gemini.ts            # Gemini AI utilities
│   ├── inngest.ts           # Background jobs
│   └── utils.ts             # Helpers + constants
└── prisma/
    ├── schema.prisma        # Database schema
    └── seed.ts              # Demo data seed
```

---

## 🤖 AI Features (Gemini)

### Receipt Scanner
Snap or upload any receipt → Gemini extracts:
- Merchant name, date, total
- Individual line items
- Auto-categorization
- Confidence score

### Financial Insights
Runs every 6 hours → generates:
- Financial health score (0–100)
- Personalized insights (warnings, tips, achievements)
- Top spending categories with trends
- Savings recommendations

### Smart Categorization
Every new transaction is auto-categorized with:
- Primary + sub-category
- Recurring detection
- Auto-tags

### Budget Suggestions
Based on your income and spending → AI suggests:
- 50/30/20 rule allocations
- Category-specific amounts
- Monthly savings goal

---

## 📦 Deployment

### Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
```

Add all environment variables in Vercel Dashboard.

### Database Options
- **[Neon](https://neon.tech)** — Serverless PostgreSQL (recommended)
- **[Supabase](https://supabase.com)** — PostgreSQL with extras
- **[Railway](https://railway.app)** — Simple PostgreSQL hosting

---

## 🎨 Design System

- **Theme**: Dark-first with emerald/green primary accent
- **Typography**: Geist Sans + Geist Mono
- **Glass morphism**: `glass` utility class
- **Animations**: CSS keyframes + Tailwind animate
- **Charts**: Recharts with custom tooltips

---



---

Built with ❤️ by Varun Raj
