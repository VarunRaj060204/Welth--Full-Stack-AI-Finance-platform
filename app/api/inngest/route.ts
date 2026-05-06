import { serve } from "inngest/next";
import { inngest, processRecurringTransactions, checkBudgetAlerts } from "@/lib/inngest";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processRecurringTransactions, checkBudgetAlerts],
});
