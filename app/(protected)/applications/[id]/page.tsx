// app/(protected)/applications/[id]/page.tsx
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import React from "react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function prettyCurrency(n: any) {
  const v = Number(String(n ?? 0).replace(/[^\d.-]/g, ""));
  try {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(v);
  } catch {
    return String(v);
  }
}

function StatusPill({ status }: { status?: string | null }) {
  const s = String(status || "").toLowerCase();
  const base =
    "inline-flex items-center rounded-lg px-3 py-1 text-xs font-semibold border";
  const map: Record<string, string> = {
    ingediend: "bg-teal-50 text-teal-700 border-teal-200",
    "in behandeling": "bg-indigo-50 text-indigo-700 border-indigo-200",
    goedgekeurd: "bg-green-50 text-green-700 border-green-200",
    afgewezen: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span
      className={`${base} ${
        map[s] || "bg-gray-100 text-gray-700 border-gray-200"
      }`}
    >
      {status || "Onbekend"}
    </span>
  );
}

export default async function ApplicationDetail({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();
  if (!session?.user?.email)
    redirect(`/login?next=/applications/${encodeURIComponent(params.id)}`);
  const isAdmin = (session.user as any).role === "admin";

  const key = String(params.id || "");
  const isNumeric = /^\d+$/.test(key);

  const app = await prisma.application.findFirst({
    where: {
      OR: [
        ...(isNumeric ? [{ appNumber: parseInt(key, 10) }] : []),
        { id: key },
      ],
    },
  });

  if (!app) notFound();
  if (!isAdmin && app.dealerEmail !== session.user.email) notFound();

  const num = app.appNumber ?? app.id;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Aanvraag #{num}</h1>
          <p className="text-sm text-gray-600">
            KvK {app.kvkNummer} • {app.merk || "—"} {app.model || ""} (
            {app.brandstof || "—"})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill status={app.status} />
          <a
            href="/dashboard"
            className="rounded-lg border px-3 py-2 font-semibold hover:bg-gray-100"
          >
            ← Terug
          </a>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border p-4 space-y-2">
          <h3 className="font-bold">Klant & KvK</h3>
          <div className="text-sm">
            <b>KvK-nummer:</b> {app.kvkNummer}
          </div>
          <div className="text-sm">
            <b>KvK &lt; 6 mnd:</b> {app.kvkJong ? "Ja" : "Nee"}
          </div>
          <div className="text-sm">
            <b>Contact:</b> {app.contactNaam} • {app.contactEmail} •{" "}
            {app.contactTel}
          </div>
          {app.opmerkingen && (
            <div className="text-sm">
              <b>Opmerkingen:</b> {app.opmerkingen}
            </div>
          )}
        </div>

        <div className="rounded-xl border p-4 space-y-2">
          <h3 className="font-bold">Voertuig gegevens</h3>
          <div className="text-sm">
            <b>Kenteken:</b> {app.kenteken || "—"}
          </div>
          <div className="text-sm">
            <b>KM-stand:</b> {app.kmStand || "—"}
          </div>
          <div className="text-sm">
            <b>Merk/Model:</b> {app.merk || "—"} {app.model || ""}
          </div>
          <div className="text-sm">
            <b>Bouwjaar/Brandstof:</b> {app.bouwjaar || "—"} /{" "}
            {app.brandstof || "—"}
          </div>
        </div>

        <div className="rounded-xl border p-4 space-y-2 md:col-span-2">
          <h3 className="font-bold">Leasecondities</h3>
          <div className="grid md:grid-cols-2 gap-2 text-sm">
            <div>
              <b>Aanschafprijs:</b> {prettyCurrency(app.aanschafprijs)}
            </div>
            <div>
              <b>Aanbetaling:</b> {prettyCurrency(app.aanbetaling)}
            </div>
            <div>
              <b>Slottermijn:</b> {prettyCurrency(app.slottermijn)}
            </div>
            <div>
              <b>Looptijd:</b> {app.looptijd} maanden
            </div>
            <div>
              <b>Rente staffel:</b> {app.renteStaffel}
            </div>
            <div>
              <b>Status:</b> <StatusPill status={app.status} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border p-4 space-y-2 md:col-span-2">
          <h3 className="font-bold">Uploads</h3>
          {Array.isArray(app.uploads) && app.uploads.length > 0 ? (
            <ul className="list-disc pl-6 text-sm">
              {app.uploads.map((f: any, i: number) => {
                const href = f?.dataBase64
                  ? `data:${f.type || "application/octet-stream"};base64,${
                      f.dataBase64
                    }`
                  : "#";
                return (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-2"
                  >
                    <span>
                      {f?.name || `bestand-${i + 1}`}{" "}
                      <span className="text-gray-500">
                        ({Math.round((f?.size || 0) / 1024)} kB)
                      </span>
                    </span>
                    {f?.dataBase64 ? (
                      <a
                        href={href}
                        download={f?.name || `upload-${i + 1}`}
                        className="text-teal-600 hover:underline"
                      >
                        Download
                      </a>
                    ) : (
                      <span className="text-gray-500">Geen inhoud</span>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="text-sm text-gray-600">
              Geen bestanden geüpload.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
