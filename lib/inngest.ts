import { Inngest } from "inngest";

export const inngest = new Inngest({ id: "welth" });

// ─── Recurring Transactions Job ───────────────────────────────────────────────
export const processRecurringTransactions = inngest.createFunction(
  { id: "process-recurring-transactions" },
  { cron: "0 0 * * *" }, // Daily at midnight
  async ({ step }) => {
    const { db } = await import("@/lib/db");

    const dueTransactions = await step.run("fetch-due-transactions", async () => {
      return db.transaction.findMany({
        where: {
          isRecurring: true,
          status: "COMPLETED",
          nextRecurringDate: { lte: new Date() },
        },
        include: { account: true },
      });
    });

    let processed = 0;
    for (const tx of dueTransactions) {
      await step.run(`process-tx-${tx.id}`, async () => {
        // Create new transaction
        await db.$transaction(async (prisma) => {
          const newTx = await prisma.transaction.create({
            data: {
              type: tx.type,
              amount: tx.amount,
              description: tx.description,
              date: new Date(),
              category: tx.category,
              subCategory: tx.subCategory,
              currency: tx.currency,
              accountId: tx.accountId,
              userId: tx.userId,
              isRecurring: true,
              recurringInterval: tx.recurringInterval,
              tags: tx.tags,
              status: "COMPLETED",
              nextRecurringDate: calculateNext(
                new Date(),
                tx.recurringInterval!
              ),
            },
          });

          // Update account balance
          const change = tx.type === "INCOME" ? Number(tx.amount) : -Number(tx.amount);
          await prisma.account.update({
            where: { id: tx.accountId },
            data: { balance: { increment: change } },
          });

          // Update parent next date
          await prisma.transaction.update({
            where: { id: tx.id },
            data: { nextRecurringDate: calculateNext(new Date(), tx.recurringInterval!) },
          });
        });
        processed++;
      });
    }

    return { processed };
  }
);

// ─── Budget Alert Job ─────────────────────────────────────────────────────────
export const checkBudgetAlerts = inngest.createFunction(
  { id: "check-budget-alerts" },
  { cron: "0 */6 * * *" }, // Every 6 hours
  async ({ step }) => {
    const { db } = await import("@/lib/db");
    const now = new Date();

    const budgets = await step.run("fetch-budgets", () =>
      db.budget.findMany({
        where: {
          startDate: { lte: now },
          endDate: { gte: now },
        },
        include: { user: true },
      })
    );

    for (const budget of budgets) {
      const spent = Number(budget.spent);
      const amount = Number(budget.amount);
      const pct = amount > 0 ? (spent / amount) * 100 : 0;

      if (pct >= budget.alertAt) {
        await step.run(`alert-budget-${budget.id}`, async () => {
          // In production: send email notification
          console.log(
            `Budget alert: ${budget.name} is ${pct.toFixed(0)}% used for user ${budget.userId}`
          );
        });
      }
    }

    return { checked: budgets.length };
  }
);

function calculateNext(date: Date, interval: string): Date {
  const next = new Date(date);
  switch (interval) {
    case "DAILY": next.setDate(next.getDate() + 1); break;
    case "WEEKLY": next.setDate(next.getDate() + 7); break;
    case "MONTHLY": next.setMonth(next.getMonth() + 1); break;
    case "YEARLY": next.setFullYear(next.getFullYear() + 1); break;
  }
  return next;
}
