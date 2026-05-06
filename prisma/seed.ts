import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create demo user (matches a test Clerk user)
  const user = await db.user.upsert({
    where: { clerkUserId: "demo_user_id" },
    update: {},
    create: {
      clerkUserId: "demo_user_id",
      email: "demo@welth.app",
      name: "Demo User",
      currency: "USD",
    },
  });

  // Create accounts
  const [checking, savings, creditCard, investment] = await Promise.all([
    db.account.upsert({
      where: { id: "acc_checking" },
      update: {},
      create: {
        id: "acc_checking",
        name: "Chase Checking",
        type: "CHECKING",
        balance: 8450.23,
        currency: "USD",
        isDefault: true,
        color: "#6366f1",
        userId: user.id,
      },
    }),
    db.account.upsert({
      where: { id: "acc_savings" },
      update: {},
      create: {
        id: "acc_savings",
        name: "High-Yield Savings",
        type: "SAVINGS",
        balance: 24000.0,
        currency: "USD",
        color: "#22c55e",
        userId: user.id,
      },
    }),
    db.account.upsert({
      where: { id: "acc_credit" },
      update: {},
      create: {
        id: "acc_credit",
        name: "Amex Platinum",
        type: "CREDIT_CARD",
        balance: -2340.5,
        currency: "USD",
        color: "#f59e0b",
        userId: user.id,
      },
    }),
    db.account.upsert({
      where: { id: "acc_invest" },
      update: {},
      create: {
        id: "acc_invest",
        name: "Fidelity Investments",
        type: "INVESTMENT",
        balance: 45231.88,
        currency: "USD",
        color: "#06b6d4",
        userId: user.id,
      },
    }),
  ]);

  console.log("✅ Created accounts");

  // Create transactions for the last 3 months
  const now = new Date();
  const transactions = [];

  for (let month = 2; month >= 0; month--) {
    const baseDate = new Date(now.getFullYear(), now.getMonth() - month, 1);

    // Income
    transactions.push({
      type: "INCOME" as const,
      amount: 6200,
      description: "Monthly Salary",
      date: new Date(baseDate.getFullYear(), baseDate.getMonth(), 1),
      category: "Income",
      accountId: checking.id,
      isRecurring: true,
      recurringInterval: "MONTHLY" as const,
    });

    // Expenses
    const expenses = [
      { amount: 1850, description: "Monthly Rent", category: "Housing", day: 1 },
      { amount: 127.5, description: "Whole Foods", category: "Food & Dining", day: 3 },
      { amount: 89.99, description: "Netflix, Spotify, etc", category: "Entertainment", day: 5 },
      { amount: 67.3, description: "Shell Gas Station", category: "Transportation", day: 7 },
      { amount: 234.2, description: "Amazon Shopping", category: "Shopping", day: 10 },
      { amount: 45.0, description: "Uber Rides", category: "Transportation", day: 12 },
      { amount: 156.4, description: "Grocery Store", category: "Food & Dining", day: 14 },
      { amount: 120.0, description: "Internet Bill", category: "Utilities", day: 15 },
      { amount: 89.0, description: "Electric Bill", category: "Utilities", day: 16 },
      { amount: 320.0, description: "Date Night + Dinner", category: "Entertainment", day: 18 },
      { amount: 78.5, description: "Pharmacy", category: "Healthcare", day: 20 },
      { amount: 198.0, description: "Clothing Shopping", category: "Shopping", day: 22 },
      { amount: 55.0, description: "Coffee Shops", category: "Food & Dining", day: 25 },
    ];

    for (const expense of expenses) {
      transactions.push({
        type: "EXPENSE" as const,
        amount: expense.amount,
        description: expense.description,
        date: new Date(baseDate.getFullYear(), baseDate.getMonth(), expense.day),
        category: expense.category,
        accountId: month === 0 && expense.category === "Shopping" ? creditCard.id : checking.id,
        isRecurring: expense.description.includes("Rent") || expense.description.includes("Bill"),
        recurringInterval: expense.description.includes("Rent") || expense.description.includes("Bill")
          ? ("MONTHLY" as const)
          : undefined,
      });
    }
  }

  // Insert transactions in batches
  for (const tx of transactions) {
    await db.transaction.create({
      data: {
        ...tx,
        userId: user.id,
        status: "COMPLETED",
        currency: "USD",
      },
    });
  }

  console.log(`✅ Created ${transactions.length} transactions`);

  // Create budgets
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const budgets = [
    { name: "Groceries", category: "Food & Dining", amount: 600, color: "#f59e0b" },
    { name: "Transportation", category: "Transportation", amount: 300, color: "#3b82f6" },
    { name: "Entertainment", category: "Entertainment", amount: 400, color: "#ec4899" },
    { name: "Shopping", category: "Shopping", amount: 500, color: "#8b5cf6" },
    { name: "Utilities", category: "Utilities", amount: 250, color: "#6b7280" },
  ];

  for (const budget of budgets) {
    await db.budget.create({
      data: {
        ...budget,
        period: "MONTHLY",
        startDate: startOfMonth,
        endDate: endOfMonth,
        alertAt: 80,
        userId: user.id,
      },
    });
  }

  console.log("✅ Created budgets");
  console.log("🎉 Seeding complete!");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
