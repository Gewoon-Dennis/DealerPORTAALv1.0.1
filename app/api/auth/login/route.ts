// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

export async function POST(req: Request) {
  const { email, password } = await req.json();
  const user = await prisma.user.findUnique({
    where: { email: String(email).toLowerCase() },
  });
  if (!user)
    return NextResponse.json(
      { ok: false, error: "Invalid credentials" },
      { status: 401 }
    );
  const ok = await bcrypt.compare(String(password), user.passwordHash);
  if (!ok)
    return NextResponse.json(
      { ok: false, error: "Invalid credentials" },
      { status: 401 }
    );

  const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
  const token = await new SignJWT({ email: user.email, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1d")
    .sign(secret);

  return NextResponse.json({ ok: true, jwt: token, role: user.role });
}
