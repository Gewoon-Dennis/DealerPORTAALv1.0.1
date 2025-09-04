import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const me: any = session?.user;

  if (!me || me.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = params.id;

  // Vind target user
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, role: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Niet jezelf verwijderen
  if (user.email === me.email) {
    return NextResponse.json({ error: "Je kunt je eigen account niet verwijderen." }, { status: 400 });
  }

  // Nooit de laatste admin verwijderen
  if (user.role === "admin") {
    const adminCount = await prisma.user.count({ where: { role: "admin" } });
    if (adminCount <= 1) {
      return NextResponse.json({ error: "Kan de laatste admin niet verwijderen." }, { status: 409 });
    }
  }

  // Ontkoppel Applications van deze dealer om FK-conflict te voorkomen
  await prisma.application.updateMany({ where: { dealerId: user.id }, data: { dealerId: null } });

  // Verwijder user
  await prisma.user.delete({ where: { id: user.id } });

  return NextResponse.json({ ok: true });
}
