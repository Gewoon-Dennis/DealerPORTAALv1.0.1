// app/api/applications/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session?.user?.email) {
    // Geen redirect; altijd JSON 401 geven.
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = (session.user as any).role === "admin";
  const key = String(params.id || "");
  const isNumeric = /^\d+$/.test(key);

  // Zoek op appNumber (als numeriek) of op id (cuid)
  const app = await prisma.application.findFirst({
    where: {
      OR: [
        ...(isNumeric ? [{ appNumber: parseInt(key, 10) }] : []),
        { id: key },
      ],
    },
  });

  if (!app)
    return NextResponse.json(
      { error: "Not found", debug: { key } },
      { status: 404 }
    );

  // Dealer mag alleen eigen aanvragen zien
  if (!isAdmin && app.dealerEmail !== session.user.email) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(app);
}
