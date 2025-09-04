// app/api/applications/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET /api/applications?mine=1  (dealer: eigen, admin: alles)
export async function GET(req: Request) {
  const session = await getSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const isAdmin = (session.user as any).role === "admin";
  const url = new URL(req.url);
  const mine = url.searchParams.get("mine") === "1";

  const where = isAdmin && !mine ? {} : { dealerEmail: session.user.email };
  const apps = await prisma.application.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(apps);
}

// POST /api/applications  (alleen ingelogd; dealer = eigenaar)
export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // body → flatten naar DB velden
  const data: any = {
    dealerEmail: session.user.email,
    kvkNummer: String(body.kvkNummer || ""),
    kvkJong: !!body.kvkJong,

    contactNaam: String(body?.contact?.naam || ""),
    contactEmail: String(body?.contact?.email || ""),
    contactTel: String(body?.contact?.telefoon || ""),

    kenteken: body?.voertuig?.kenteken || null,
    merk: body?.voertuig?.merk || null,
    model: body?.voertuig?.model || null,
    brandstof: body?.voertuig?.brandstof || null,
    bouwjaar: body?.voertuig?.bouwjaar || null,
    kmStand: body?.voertuig?.kmStand || null,

    aanschafprijs: body?.condities?.aanschafprijs
      ? String(body?.condities?.aanschafprijs).replace(/[^\d.-]/g, "")
      : "0",
    aanbetaling: body?.condities?.aanbetaling
      ? String(body?.condities?.aanbetaling).replace(/[^\d.-]/g, "")
      : "0",
    slottermijn: body?.condities?.slottermijn
      ? String(body?.condities?.slottermijn).replace(/[^\d.-]/g, "")
      : "0",
    looptijd: Number(body?.condities?.looptijd || 0),
    renteStaffel: String(body?.condities?.renteStaffel || "A"),

    opmerkingen: body?.opmerkingen || null,
    uploads: Array.isArray(body?.uploads) ? body.uploads : [],
  };

  // Optioneel: dealerId koppelen
  const dealer = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  const created = await prisma.application.create({
    data: { ...data, dealerId: dealer?.id },
    // Geef appNumber mee zodat frontend mooi nummer kan tonen
    select: {
      id: true,
      appNumber: true,
      dealerEmail: true,
      kvkNummer: true,
      status: true,
    },
  });

  return NextResponse.json(created, { status: 201 });
}
