import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { scanReceipt } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { imageBase64, mimeType } = await req.json();
    if (!imageBase64 || !mimeType) {
      return NextResponse.json({ error: "Missing image data" }, { status: 400 });
    }

    const result = await scanReceipt(imageBase64, mimeType);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Receipt scan error:", error);
    return NextResponse.json(
      { error: "Failed to scan receipt" },
      { status: 500 }
    );
  }
}
