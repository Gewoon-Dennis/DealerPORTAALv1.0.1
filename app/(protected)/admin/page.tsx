"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

type Application = {
  id: string;
  appNumber?: number | null;
  createdAt: string;
  dealerEmail: string;
  kvkNummer: string;
  kvkJong: boolean;

  contactNaam: string;
  contactEmail: string;
  contactTel: string;

  kenteken?: string | null;
  merk?: string | null;
  model?: string | null;
  brandstof?: string | null;
  bouwjaar?: string | null;
  kmStand?: string | null;

  aanschafprijs: number;
  aanbetaling: number;
  slottermijn: number;
  looptijd: number;
  renteStaffel: string;

  opmerkingen?: string | null;
  status: "Ingediend" | "In behandeling" | "Goedgekeurd" | "Afgewezen";
  uploads: any[];
};

const STATUS_OPTIONS: Application["status"][] = [
  "Ingediend",
  "In behandeling",
  "Goedgekeurd",
  "Afgewezen",
];

function StatusPill({ status }: { status: Application["status"] }) {
  const map: Record<string, { bg: string; text: string; ring: string }> = {
    Ingediend: { bg: "bg-teal-50", text: "text-teal-700", ring: "ring-teal-200" },
    "In behandeling": { bg: "bg-indigo-50", text: "text-indigo-700", ring: "ring-indigo-200" },
    Goedgekeurd: { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200" },
    Afgewezen: { bg: "bg-rose-50", text: "text-rose-700", ring: "ring-rose-200" },
  };
  const c = map[status] || { bg: "bg-gray-100", text: "text-gray-700", ring: "ring-gray-200" };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text} ring-1 ${c.ring}`}>
      {status}
    </span>
  );
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const role = (session?.user as any)?.role as "admin" | "dealer" | undefined;

  const [apps, setApps] = useState<Application[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Haal ALLE aanvragen op (admin)
  useEffect(() => {
    if (status !== "authenticated") return;
    if (role !== "admin") return;

    setLoading(true);
    setErr(null);

    fetch("/api/applications?mine=0")
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return (await r.json()) as Application[];
      })
      .then((data) => setApps(data))
      .catch((e) => setErr(e.message || "Kon aanvragen niet laden"))
      .finally(() => setLoading(false));
  }, [status, role]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return apps;
    return apps.filter((a) => {
      const hay = `${a.id} ${a.appNumber ?? ""} ${a.kvkNummer} ${a.merk ?? ""} ${a.model ?? ""} ${a.kenteken ?? ""}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [apps, q]);

  async function updateStatus(appId: string, next: Application["status"]) {
    try {
      const res = await fetch(`/api/applications/${appId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // Update lokaal
      setApps((prev) => prev.map((a) => (a.id === appId ? { ...a, status: next } as Application : a)));
    } catch (e: any) {
      alert("Kon status niet wijzigen: " + (e?.message || "onbekende fout"));
    }
  }

  if (status === "loading") {
    return <div className="p-6 text-sm text-gray-600">Sessiestatus laden…</div>;
  }

  if (status === "unauthenticated") {
    return (
      <div className="p-6">
        <p className="text-gray-700">Niet ingelogd.</p>
        <Link href="/login" className="text-teal-600 underline">
          Ga naar inloggen
        </Link>
      </div>
    );
  }

  if (role !== "admin") {
    return (
      <div className="p-6">
        <p className="text-gray-700">Alleen beheerders mogen deze pagina bekijken.</p>
        <Link href="/" className="text-teal-600 underline">
          Naar dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Beheer – binnengekomen aanvragen</h1>
          <p className="text-sm text-gray-600">
            Ingelogd als <b>{session?.user?.name || session?.user?.email}</b> • rol: <span className="uppercase">{role}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/users"
            className="inline-flex items-center rounded-lg bg-gray-100 px-4 py-2 text-gray-900 font-semibold hover:bg-gray-200"
          >
            Accountbeheer
          </Link>
          
        </div>
      </div>

      {/* Zoeken */}
      <div className="flex items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op appnummer/ID, KvK, merk, model of kenteken…"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-400"
        />
      </div>

      {/* Status / Errors */}
      {loading && <div className="text-sm text-gray-600">Aanvragen laden…</div>}
      {err && (
        <div className="text-sm rounded-md border border-rose-200 bg-rose-50 text-rose-700 px-3 py-2">
          Fout: {err}
        </div>
      )}

      {/* Lijst */}
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-gray-600">
            {q ? "Geen resultaten voor je zoekopdracht." : "Nog geen aanvragen ingediend."}
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filtered.map((a) => (
              <li key={a.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between gap-4">
                  {/* Linkerblok met kerninfo */}
                  <div className="min-w-0">
                    <div className="font-semibold truncate">
                      #{a.appNumber ?? a.id} • KvK {a.kvkNummer} • {a.merk ?? "—"} {a.model ?? ""}
                    </div>
                    <div className="text-xs text-gray-600">
                      Kenteken: {a.kenteken || "—"} • Looptijd: {a.looptijd} mnd • Staffel: {a.renteStaffel}
                    </div>
                  </div>

                  {/* Rechterblok met acties */}
                  <div className="shrink-0 flex items-center gap-2">
                    <StatusPill status={a.status} />

                    <select
                      value={a.status}
                      onChange={(e) => updateStatus(a.id, e.target.value as Application["status"])}
                      className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>

                    <Link
                      href={`/applications/${a.id}`}
                      className="rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-gray-100"
                    >
                      Openen
                    </Link>
                    <Link
                      href={`/applications/${a.id}`}
                      className="rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-gray-100"
                    >
                      Verwijderen
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
