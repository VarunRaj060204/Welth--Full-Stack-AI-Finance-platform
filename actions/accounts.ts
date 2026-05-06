"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { AccountType } from "@prisma/client";
import { z } from "zod";

const accountSchema = z.object({
  name: z.string().min(1).max(50),
  type: z.nativeEnum(AccountType),
  balance: z.number().min(0),
  currency: z.string().length(3),
  isDefault: z.boolean().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
});

export async function getAccounts() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) throw new Error("User not found");

  return db.account.findMany({
    where: { userId: user.id },
    include: {
      _count: { select: { transactions: true } },
    },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
}

export async function getAccountById(accountId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) throw new Error("User not found");

  return db.account.findFirst({
    where: { id: accountId, userId: user.id },
    include: {
      transactions: {
        orderBy: { date: "desc" },
        take: 50,
      },
    },
  });
}

export async function createAccount(data: z.infer<typeof accountSchema>) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const validated = accountSchema.parse(data);
  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) throw new Error("User not found");

  // If new account is default, unset others
  if (validated.isDefault) {
    await db.account.updateMany({
      where: { userId: user.id, isDefault: true },
      data: { isDefault: false },
    });
  }

  const account = await db.account.create({
    data: {
      ...validated,
      userId: user.id,
      color: validated.color ?? "#6366f1",
      icon: validated.icon ?? "wallet",
      isDefault: validated.isDefault ?? false,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/accounts");
  return { success: true };
}

export async function updateAccount(
  accountId: string,
  data: Partial<z.infer<typeof accountSchema>>
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) throw new Error("User not found");

  if (data.isDefault) {
    await db.account.updateMany({
      where: { userId: user.id, isDefault: true },
      data: { isDefault: false },
    });
  }

  const account = await db.account.update({
    where: { id: accountId, userId: user.id },
    data,
  });

  revalidatePath("/dashboard");
  revalidatePath("/accounts");
  return { success: true };
}

export async function deleteAccount(accountId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) throw new Error("User not found");

  await db.account.delete({
    where: { id: accountId, userId: user.id },
  });

  revalidatePath("/dashboard");
  revalidatePath("/accounts");
  return { success: true };
}
