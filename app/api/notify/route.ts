// app/api/notify/route.ts
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sendNotification } from "@/lib/mailer";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await req.json();
  // Basic shape validation
  if (payload?.type !== "new_application") {
    return NextResponse.json({ error: "Unsupported type" }, { status: 400 });
  }
  const to = payload.to || "info@autoagent.nl";
  const subject = payload.subject || "Nieuwe lease-aanvraag";
  const message = payload.message || "";

  await sendNotification({ type: "new_application", to, subject, message });
  return NextResponse.json({ ok: true });
}
