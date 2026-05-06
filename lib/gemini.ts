import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("❌ GEMINI_API_KEY is not set in .env file");
}

const genAI = new GoogleGenerativeAI(apiKey ?? "");

export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-flash-latest",
});

export const geminiProModel = genAI.getGenerativeModel({
  model: "gemini-flash-latest",
});

// ─── Receipt Scanner ────────────────────────────────────────────────────────
export async function scanReceipt(imageBase64: string, mimeType: string) {
  const prompt = `Analyze this receipt image and extract the following information in JSON format:
  {
    "merchant": "store name",
    "date": "YYYY-MM-DD",
    "total": 0.00,
    "currency": "USD",
    "items": [
      { "name": "item name", "amount": 0.00, "quantity": 1 }
    ],
    "category": "one of: Food & Dining, Shopping, Transportation, Entertainment, Healthcare, Utilities, Other",
    "taxAmount": 0.00,
    "confidence": 0.0
  }
  Return ONLY valid JSON, no markdown.`;

  const result = await geminiModel.generateContent([
    {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType as "image/jpeg" | "image/png" | "image/webp",
      },
    },
    prompt,
  ]);
  const text = result.response.text();
  try {
    return JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
  } catch {
    throw new Error("Failed to parse receipt data from AI response");
  }
}

// ─── Financial Insights ──────────────────────────────────────────────────────
export async function generateInsights(data: {
  transactions: Array<{
    type: string;
    amount: number;
    category: string;
    date: string;
    description: string;
  }>;
  budgets: Array<{
    category: string;
    amount: number;
    spent: number;
  }>;
  accounts: Array<{
    type: string;
    balance: number;
    currency: string;
  }>;
  period: string;
}) {
  const prompt = `As a financial advisor AI, analyze this user's financial data and provide actionable insights.
Financial Data:
${JSON.stringify(data, null, 2)}
Provide insights in this JSON format:
{
  "summary": "2-3 sentence overview of financial health",
  "score": 75,
  "insights": [
    {
      "type": "warning|tip|achievement|alert",
      "title": "short title",
      "description": "detailed insight",
      "impact": "high|medium|low",
      "action": "specific action to take"
    }
  ],
  "topSpendingCategories": [
    { "category": "name", "amount": 0.00, "percentage": 0.0, "trend": "up|down|stable" }
  ],
  "monthlyTrend": "up|down|stable",
  "savingsRate": 0.0,
  "recommendations": [
    { "title": "recommendation", "potentialSaving": 0.00 }
  ]
}
Return ONLY valid JSON.`;

  let result;
  let retries = 3;
  let delay = 2000;

  while (retries > 0) {
    try {
      result = await geminiProModel.generateContent(prompt);
      break;
    } catch (error: any) {
      if (error?.message?.includes("429") && retries > 1) {
        console.log(`⚠️ Rate limited. Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        retries--;
        delay *= 2;
      } else {
        throw error;
      }
    }
  }

  if (!result) throw new Error("Failed to generate content after retries");

  const text = result.response.text();
  try {
    return JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
  } catch {
    throw new Error("Failed to parse insights from AI response");
  }
}

// ─── Smart Categorization ────────────────────────────────────────────────────
export async function categorizeTransaction(description: string, amount: number) {
  const prompt = `Categorize this financial transaction:
Description: "${description}"
Amount: ${amount}
Return JSON:
{
  "category": "one of: Food & Dining, Shopping, Transportation, Entertainment, Healthcare, Utilities, Housing, Travel, Education, Business, Investment, Income, Transfer, Other",
  "subCategory": "more specific category",
  "confidence": 0.0,
  "isRecurring": false,
  "tags": ["tag1", "tag2"]
}
Return ONLY valid JSON.`;

  const result = await geminiModel.generateContent(prompt);
  const text = result.response.text();
  try {
    return JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
  } catch {
    return {
      category: "Other",
      subCategory: null,
      confidence: 0.5,
      isRecurring: false,
      tags: [],
    };
  }
}

// ─── Budget Suggestions ──────────────────────────────────────────────────────
export async function generateBudgetSuggestions(data: {
  income: number;
  expenses: Array<{ category: string; amount: number }>;
  currency: string;
}) {
  const prompt = `Based on this user's income and expenses, suggest optimal budget allocations.
Income: ${data.income} ${data.currency}
Current Expenses: ${JSON.stringify(data.expenses)}
Apply the 50/30/20 rule and provide personalized suggestions:
{
  "suggestions": [
    {
      "category": "category name",
      "suggestedAmount": 0.00,
      "currentAmount": 0.00,
      "reasoning": "why this amount",
      "priority": "essential|want|savings"
    }
  ],
  "savingsGoal": 0.00,
  "summary": "brief explanation"
}
Return ONLY valid JSON.`;

  const result = await geminiModel.generateContent(prompt);
  const text = result.response.text();
  try {
    return JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
  } catch {
    throw new Error("Failed to generate budget suggestions");
  }
}