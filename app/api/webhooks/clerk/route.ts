import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { WebhookEvent } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    throw new Error("Missing CLERK_WEBHOOK_SECRET");
  }

  const svix_id = req.headers.get("svix-id");
  const svix_timestamp = req.headers.get("svix-timestamp");
  const svix_signature = req.headers.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: "Missing headers" }, { status: 400 });
  }

  const body = await req.text();
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const { type, data } = evt;

  switch (type) {
    case "user.created": {
      const { id, email_addresses, first_name, last_name, image_url } = data;
      const email = email_addresses[0]?.email_address ?? "";
      const name = [first_name, last_name].filter(Boolean).join(" ") || null;

      await db.user.upsert({
        where: { clerkUserId: id },
        update: { email, name, imageUrl: image_url },
        create: {
          clerkUserId: id,
          email,
          name,
          imageUrl: image_url,
        },
      });
      break;
    }

    case "user.updated": {
      const { id, email_addresses, first_name, last_name, image_url } = data;
      const email = email_addresses[0]?.email_address ?? "";
      const name = [first_name, last_name].filter(Boolean).join(" ") || null;

      await db.user.update({
        where: { clerkUserId: id },
        data: { email, name, imageUrl: image_url },
      });
      break;
    }

    case "user.deleted": {
      const { id } = data;
      if (id) {
        await db.user.delete({ where: { clerkUserId: id } }).catch(() => {});
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
