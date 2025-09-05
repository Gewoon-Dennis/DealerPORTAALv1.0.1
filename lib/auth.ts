// lib/auth.ts
import { PrismaClient } from "@prisma/client";
import NextAuth, { DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";

declare module "next-auth" {
  interface User {
    role: "DEALER" | "ADMIN" | "SUPERADMIN";
  }
  interface Session extends DefaultSession {
    user: DefaultSession["user"] & { role: User["role"] };
  }
}

const prisma = new PrismaClient();

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: { email: {}, password: {} },
      async authorize(creds) {
        if (!creds?.email || !creds.password) return null;
        const user = await prisma.user.findUnique({ where: { email: creds.email } });
        if (!user) return null;
        const ok = await compare(creds.password, user.password);
        if (!ok) return null;
        return { id: user.id, email: user.email, name: user.name ?? "", role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = (user as any).role;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.role) (session.user as any).role = token.role;
      return session;
    },
  },
});
