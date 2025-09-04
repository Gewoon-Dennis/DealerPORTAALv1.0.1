"use client";

import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Application = {
  id: string; // intern (cuid)
  appNumber?: number | null; // mooi nummer (bijv. 102001)
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
  status: string;
  uploads: any[];
};

export default function Dashboard() {
  const { data: session, status } = useSession();
  const role = (session?.user as any)?.role as "admin" | "dealer" | undefined;

  const [apps, setApps] = useState<Application[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Fetch aanvragen zodra je ingelogd bent
  useEffect(() => {
    if (status !== "authenticated") return;
    setLoading(true);
    setErr(null);

    const url =
      role === "admin"
        ? "/api/applications?mine=0"
        : "/api/applications?mine=1";

    fetch(url, { method: "GET" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return (await r.json()) as Application[];
      })
      .then((data) => setApps(data))
      .catch((e) => setErr(e.message || "Kon aanvragen niet laden"))
      .finally(() => setLoading(false));
  }, [status, role]);

  // Zoeken/filtreren in de lijst (nu ook op appNumber)
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return apps;
    return apps.filter((a) => {
      const num = (a.appNumber ?? a.id).toString();
      const hay = `${num} ${a.kvkNummer} ${a.merk ?? ""} ${a.model ?? ""} ${
        a.kenteken ?? ""
      }`.toLowerCase();
      return hay.includes(needle);
    });
  }, [apps, q]);

  if (status === "loading") {
    return <div className="p-6 text-sm text-gray-600">Sessiestatus laden…</div>;
  }

  if (status === "unauthenticated") {
    // Middleware zal normaal gesproken al naar /login sturen,
    // maar dit is een nette fallback.
    return (
      <div className="p-6">
        <p className="text-gray-700">Niet ingelogd.</p>
        <Link href="/login" className="text-teal-600 underline">
          Ga naar inloggen
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Dashboard</h1>
          <p className="text-sm text-gray-600">
            Ingelogd als <b>{session?.user?.name || session?.user?.email}</b> •
            rol: <span className="uppercase">{role}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {role !== "admin" && (
            <Link
              href="/applications/new"
              className="inline-flex items-center rounded-lg bg-teal-500 px-4 py-2 text-white font-semibold hover:bg-teal-600"
            >
              + Nieuwe aanvraag
            </Link>
          )}

          {role === "admin" && (
            <Link
              href="/admin"
              className="inline-flex items-center rounded-lg bg-gray-100 px-4 py-2 text-gray-900 font-semibold hover:bg-gray-200"
            >
              Beheer
            </Link>
          )}
        </div>
      </div>

      {/* Zoekbalk */}
      <div className="flex items-center justify-between gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op KvK, merk, model, nummer of kenteken…"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-400"
        />
      </div>

      {/* Status/Errors */}
      {loading && <div className="text-sm text-gray-600">Aanvragen laden…</div>}
      {err && (
        <div className="text-sm rounded-md border border-red-200 bg-red-50 text-red-700 px-3 py-2">
          Fout: {err}
        </div>
      )}

      {/* Lijst */}
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-gray-600">
            {q
              ? "Geen resultaten voor je zoekopdracht."
              : "Nog geen aanvragen ingediend."}
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filtered.map((a) => {
              const num = a.appNumber ?? a.id; // <- mooi nummer als beschikbaar
              return (
                <li key={a.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="font-semibold truncate">
                        #{num} • KvK {a.kvkNummer} • {a.merk ?? "—"}{" "}
                        {a.model ?? ""}
                      </div>
                      <div className="text-xs text-gray-600">
                        Kenteken: {a.kenteken || "—"} • Looptijd: {a.looptijd}{" "}
                        mnd • Staffel: {a.renteStaffel} • Status:{" "}
                        <span className="font-semibold">{a.status}</span>
                      </div>
                    </div>
                    <Link
                      href={`/applications/${num}`} // <- linkt ook met mooi nummer
                      className="shrink-0 rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-gray-100"
                    >
                      Openen
                    </Link>
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
