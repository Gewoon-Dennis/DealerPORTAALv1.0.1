import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

// GET /api/users  ?role=dealer|admin   (admin-only)
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const me: any = session?.user;
  if (!me || me.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const role = url.searchParams.get("role") as "admin" | "dealer" | null;

  const users = await prisma.user.findMany({
    where: role ? { role } : undefined,
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  return NextResponse.json(users);
}

// POST /api/users   body: { email, password, name?, role? }  (admin-only)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const me: any = session?.user;
  if (!me || me.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = String(body?.email || "").trim().toLowerCase();
  const password = String(body?.password || "");
  const name = body?.name ? String(body.name).trim() : "";
  const role: "admin" | "dealer" = body?.role === "admin" ? "admin" : "dealer";

  if (!isEmail(email)) return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: "Email already exists" }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 10);
  const created = await prisma.user.create({
    data: { email, name: name || null, role, passwordHash },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  return NextResponse.json(created, { status: 201 });
}
