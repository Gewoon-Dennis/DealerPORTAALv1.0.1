"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

type Role = "admin" | "dealer";
type UserRow = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  createdAt: string;
};

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const myEmail = (session?.user as any)?.email as string | undefined;
  const myRole = (session?.user as any)?.role as Role | undefined;

  const [users, setUsers] = useState<UserRow[]>([]);
  const [filter, setFilter] = useState<Role | "all">("all");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Form state (aanmaken)
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [newRole, setNewRole] = useState<Role>("dealer");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const canSubmit = email && password.length >= 8;

  const loadUsers = async (roleFilter: typeof filter = filter) => {
    if (status !== "authenticated" || myRole !== "admin") return;
    const q = roleFilter === "all" ? "" : `?role=${roleFilter}`;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/users${q}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as UserRow[];
      setUsers(data);
    } catch (e: any) {
      setErr(e.message || "Kon gebruikers niet laden");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, myRole, filter]);

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setMsg(null);
    setErr(null);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, role: newRole }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${res.status}`);
      }
      setEmail("");
      setName("");
      setPassword("");
      setNewRole("dealer");
      setMsg("Gebruiker succesvol aangemaakt");
      await loadUsers();
    } catch (e: any) {
      setErr(e.message || "Aanmaken mislukt");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteUser = async (id: string, email: string) => {
    if (!confirm(`Weet je zeker dat je ${email} wilt verwijderen?`)) return;
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
      setMsg("Gebruiker verwijderd");
      await loadUsers();
    } catch (e: any) {
      setErr(e.message || "Verwijderen mislukt");
    }
  };

  if (status === "loading")
    return <div className="p-6 text-gray-600">Sessiestatus laden…</div>;
  if (status === "unauthenticated" || myRole !== "admin")
    return (
      <div className="p-6">
        <p className="text-gray-700">Geen toegang.</p>
        <Link href="/login" className="text-teal-600 underline">
          Inloggen
        </Link>
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Accounts beheren</h1>
          <p className="text-sm text-gray-600">
            Maak nieuwe accounts aan en verwijder bestaande accounts.
          </p>
        </div>
        <Link
          href="/admin"
          className="rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-gray-100"
        >
          ← Terug naar Beheer
        </Link>
      </div>

      {/* Nieuw account */}
      <form onSubmit={createUser} className="rounded-xl border p-4 space-y-4">
        <h2 className="font-bold">Nieuw account</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              E-mailadres
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-400"
              placeholder="dealer@bedrijf.nl"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Naam (optioneel)
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-400"
              placeholder="Voornaam Achternaam"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Wachtwoord (min. 8 tekens)
            </label>
            <input
              type="password"
              value={password}
              minLength={8}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-400"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Rol</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as Role)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-400"
            >
              <option value="dealer">Dealer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="inline-flex items-center rounded-lg bg-teal-500 px-4 py-2 text-white font-semibold hover:bg-teal-600 disabled:opacity-50"
          >
            {submitting ? "Aanmaken…" : "Account aanmaken"}
          </button>
          {msg && <span className="text-sm text-green-700">{msg}</span>}
          {err && <span className="text-sm text-red-700">Fout: {err}</span>}
        </div>
      </form>

      {/* Filter + lijst */}
      <div className="rounded-xl border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">Filter:</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-400"
            >
              <option value="all">Alle</option>
              <option value="dealer">Dealers</option>
              <option value="admin">Admins</option>
            </select>
          </div>
          {loading && <div className="text-sm text-gray-600">Laden…</div>}
        </div>

        {users.length === 0 ? (
          <div className="p-6 text-center text-gray-600">
            Geen gebruikers gevonden.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {users.map((u) => {
              const isMe =
                myEmail && u.email.toLowerCase() === myEmail.toLowerCase();
              return (
                <li
                  key={u.id}
                  className="p-4 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="font-semibold truncate">
                      {u.name ? `${u.name} — ` : ""}
                      {u.email}
                    </div>
                    <div className="text-xs text-gray-600">
                      Rol: <b className="uppercase">{u.role}</b> • Aangemaakt:{" "}
                      {new Date(u.createdAt).toLocaleString("nl-NL")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => deleteUser(u.id, u.email)}
                      disabled={!!isMe}
                      className="rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-red-50 disabled:opacity-40"
                      title={
                        isMe ? "Je kunt jezelf niet verwijderen" : "Verwijderen"
                      }
                    >
                      Verwijderen
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
