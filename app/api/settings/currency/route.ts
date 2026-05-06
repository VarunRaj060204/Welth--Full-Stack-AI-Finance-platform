import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { currency } = await req.json();
  if (!currency || currency.length !== 3) {
    return NextResponse.json({ error: "Invalid currency" }, { status: 400 });
  }

  await db.user.update({
    where: { clerkUserId: userId },
    data: { currency },
  });

  return NextResponse.json({ success: true });
}
