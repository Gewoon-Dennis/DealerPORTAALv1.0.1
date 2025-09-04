"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "";

  const [email, setEmail] = useState("");
  const [password, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });
      if (!res || !res.ok) {
        setErr("E-mail of wachtwoord klopt niet.");
        return;
      }
      const s = await fetch("/api/auth/session", { cache: "no-store" });
      const j = await s.json().catch(() => ({}));
      const role = (j?.user as any)?.role || "dealer";
      if (next) router.push(next);
      else if (role === "admin") router.push("/admin");
      else router.push("/dashboard");
    } catch {
      setErr("Er ging iets mis. Probeer opnieuw.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
        <div className="text-center mb-4">
          <img
            src="/logo.png"
            alt="AutoAgent"
            className="h-16 mx-auto mb-2"
            onError={(e: any) => e.currentTarget.remove()}
          />
          <h1 className="text-xl font-extrabold text-teal-500">
            Inloggen Dealerportaal
          </h1>
          <p className="text-sm text-gray-600">
            Vul je gegevens in om verder te gaan.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="block text-sm mb-1">E-mailadres</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-400"
              placeholder="dealer@example.com"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Wachtwoord</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPw(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-400"
              placeholder="••••••••"
            />
          </div>

          {err && (
            <div className="text-sm rounded-md border border-red-200 bg-red-50 text-red-700 px-3 py-2">
              {err}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-teal-500 px-4 py-2 text-white font-semibold hover:bg-teal-600 disabled:opacity-60"
          >
            {busy ? "Bezig…" : "Inloggen"}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between text-sm">
          {/* Later kun je /auth/forgot-password terugzetten */}
          <span className="text-gray-500">Wachtwoord vergeten? (later)</span>
          <a href="/" className="text-gray-600 hover:underline">
            ← Terug
          </a>
        </div>

        <p className="text-[11px] text-gray-500 text-center mt-4">
          © {new Date().getFullYear()} AutoAgent.nl – Alle rechten voorbehouden
        </p>
      </div>
    </div>
  );
}
