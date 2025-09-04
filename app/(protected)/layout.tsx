"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role as "admin" | "dealer" | undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-20 w-full border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="AutoAgent" className="h-11 w-21" />
            <Link href="/dashboard" className="font-extrabold text-teal-500">
              Dealer Portaal
            </Link>
            <nav className="ml-4 hidden gap-3 text-sm text-gray-700 md:flex">
              <Link href="/dashboard" className="hover:text-teal-600">
                Dashboard
              </Link>
              <Link href="/applications/new" className="hover:text-teal-600">
                Nieuwe aanvraag
              </Link>
              {role === "admin" && (
                <>
                  <Link href="/admin" className="hover:text-teal-600">
                    Beheer
                  </Link>
                  <Link href="/admin/users" className="hover:text-teal-600">
                    Accounts
                  </Link>
                </>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {session?.user && (
              <span className="hidden text-sm text-gray-600 md:inline">
                Ingelogd als <b>{session.user.name || session.user.email}</b>
              </span>
            )}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-200"
            >
              Uitloggen
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
