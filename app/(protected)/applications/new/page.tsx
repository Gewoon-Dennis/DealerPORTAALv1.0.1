"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

/* ====== Helpers (ongewijzigd op functionaliteit) ====== */
const monthsOptions = ["12", "24", "36", "48", "60", "72"];
const STAFFEL_LETTERS = Array.from({ length: 17 }, (_, i) =>
  String.fromCharCode("A".charCodeAt(0) + i)
);
const BASE_RATES: Record<string, number> = STAFFEL_LETTERS.reduce(
  (acc, L, idx) => {
    const rate = 16.49 - idx * 0.5; // A=16.49 .. Q=8.49
    acc[L] = Number(rate.toFixed(2));
    return acc;
  },
  {} as Record<string, number>
);

// Provisiepercentages per staffel
const PROVISIE_PCT: Record<string, number> = {
  A: 27.5,
  B: 27.5,
  C: 26.5,
  D: 26,
  E: 25.5,
  F: 24.5,
  G: 22.5,
  H: 20.5,
  I: 19.5,
  J: 18,
  K: 17,
  L: 15.5,
  M: 14,
  N: 12.5,
  O: 10.5,
  P: 8,
  Q: 6,
};
function getEffectiveRate(letter: string, kvkJong: boolean) {
  const base = BASE_RATES[letter] ?? 16.49;
  return kvkJong ? base : Number((base - 1).toFixed(2));
}
function parseNumber(v: any) {
  const n = Number(String(v ?? 0).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}
function prettyCurrency(v: any) {
  const n = parseNumber(v);
  try {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${n}`;
  }
}
function calcMonthly({
  aanschafprijs,
  aanbetaling,
  slottermijn,
  looptijd,
  annualRatePct,
}: {
  aanschafprijs: any;
  aanbetaling: any;
  slottermijn: any;
  looptijd: any;
  annualRatePct: number;
}) {
  const P = Math.max(0, parseNumber(aanschafprijs) - parseNumber(aanbetaling));
  const FV = parseNumber(slottermijn);
  const n = Number(looptijd || 0);
  if (!P || !n) return 0;
  const i = Number(annualRatePct || 0) / 100 / 12;
  if (i === 0) return Math.max(0, (P - FV) / n);
  const pvBalloon = FV / Math.pow(1 + i, n);
  const L = Math.max(0, P - pvBalloon);
  return (i * L) / (1 - Math.pow(1 + i, -n));
}
type UploadItem = {
  name: string;
  size: number;
  type: string;
  dataBase64: string;
};
async function filesToBase64List(
  files: FileList | File[]
): Promise<UploadItem[]> {
  const arr = Array.from(files || []);
  const toB64 = (f: File) =>
    new Promise<UploadItem>((res, rej) => {
      const r = new FileReader();
      r.onload = () => {
        const base64 = String(r.result).split(",").pop() || "";
        res({ name: f.name, size: f.size, type: f.type, dataBase64: base64 });
      };
      r.onerror = rej;
      r.readAsDataURL(f);
    });
  return Promise.all(arr.map(toB64));
}

/* ====== Page ====== */
export default function NewApplicationPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    kvkNummer: "",
    kvkData: null as any,
    kvkJong: true,
    contact: { naam: "", email: "", telefoon: "" },
    voertuig: {
      kenteken: "",
      kmStand: "",
      merk: "",
      model: "",
      brandstof: "",
      bouwjaar: "",
    },
    condities: {
      aanschafprijs: "",
      aanbetaling: "",
      slottermijn: "",
      looptijd: "36",
      renteStaffel: "A",
    },
    uploads: [] as UploadItem[],
    opmerkingen: "",
  });

  const [kvkStatus, setKvkStatus] = useState<null | string>(null);
  const [rdwStatus, setRdwStatus] = useState<null | string>(null);
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showProvision, setShowProvision] = useState(false);

  // RDW auto-fill (via jouw server-proxy /api/rdw)
  useEffect(() => {
    const t = setTimeout(async () => {
      const k = form.voertuig.kenteken.toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (!k) return setRdwStatus(null);
      setRdwStatus("Zoeken bij RDW…");
      try {
        const res = await fetch(`/api/rdw?kenteken=${encodeURIComponent(k)}`);
        const data = await res.json();
        if (!res.ok || !data?.ok)
          throw new Error(data?.reason || `HTTP ${res.status}`);
        setForm((s) => ({
          ...s,
          voertuig: {
            ...s.voertuig,
            kenteken: data.kenteken || s.voertuig.kenteken,
            merk: data.merk || s.voertuig.merk,
            model: data.model || s.voertuig.model,
            brandstof: data.brandstof || s.voertuig.brandstof,
            bouwjaar: data.bouwjaar || s.voertuig.bouwjaar,
          },
        }));
        setRdwStatus("RDW-gegevens opgehaald");
      } catch {
        setRdwStatus("RDW-lookup mislukt");
      }
    }, 500);
    return () => clearTimeout(t);
  }, [form.voertuig.kenteken]);

  // KVK auto-fill (via jouw server-proxy /api/kvk)
  useEffect(() => {
    const t = setTimeout(async () => {
      const kvk = form.kvkNummer.replace(/\D/g, "");
      if (!kvk) {
        setKvkStatus(null);
        setForm((s) => ({ ...s, kvkData: null }));
        return;
      }
      setKvkStatus("Zoeken bij KVK…");
      try {
        const res = await fetch(`/api/kvk?kvk=${encodeURIComponent(kvk)}`);
        const data = await res.json();
        if (!res.ok || !data?.ok)
          throw new Error(data?.reason || `HTTP ${res.status}`);
        setForm((s) => ({ ...s, kvkData: data }));
        setKvkStatus("KVK-gegevens gevonden");
      } catch {
        setForm((s) => ({ ...s, kvkData: null }));
        setKvkStatus("KVK-lookup niet gelukt");
      }
    }, 500);
    return () => clearTimeout(t);
  }, [form.kvkNummer]);

  // Afgeleiden
  const effectiveRate = useMemo(
    () => getEffectiveRate(form.condities.renteStaffel, form.kvkJong),
    [form.condities.renteStaffel, form.kvkJong]
  );
  const monthly = useMemo(
    () =>
      calcMonthly({
        aanschafprijs: form.condities.aanschafprijs,
        aanbetaling: form.condities.aanbetaling,
        slottermijn: form.condities.slottermijn,
        looptijd: form.condities.looptijd,
        annualRatePct: effectiveRate,
      }),
    [form.condities, effectiveRate]
  );
  const provisiePct = useMemo(
    () => PROVISIE_PCT[(form.condities.renteStaffel || "A").toUpperCase()] ?? 0,
    [form.condities.renteStaffel]
  );
  const kredietvergoeding = useMemo(() => {
    const P = Math.max(
      0,
      parseNumber(form.condities.aanschafprijs) -
        parseNumber(form.condities.aanbetaling)
    );
    const n = Number(form.condities.looptijd || 0);
    const FV = parseNumber(form.condities.slottermijn);
    const totalPaid = monthly * n + FV;
    return Math.max(0, totalPaid - P);
  }, [form.condities, monthly]);
  const provisieBedrag = useMemo(
    () => Math.max(0, kredietvergoeding * (provisiePct / 100)),
    [kredietvergoeding, provisiePct]
  );

  const field = (
    label: string,
    value: any,
    onChange: (v: string) => void,
    props: any = {}
  ) => (
    <div className="grid gap-1">
      <label className="text-sm text-gray-700">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-400"
        {...props}
      />
    </div>
  );
  const canSubmit =
    form.kvkNummer &&
    form.contact.naam &&
    form.condities.aanschafprijs &&
    form.condities.looptijd;

  // ✅ Indienen
  const onSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault?.();
    if (!canSubmit || pending) return;
    setPending(true);
    setErr(null);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kvkNummer: form.kvkNummer,
          kvkJong: form.kvkJong,
          contact: {
            naam: form.contact.naam,
            email: form.contact.email,
            telefoon: form.contact.telefoon,
          },
          voertuig: { ...form.voertuig },
          condities: { ...form.condities },
          uploads: form.uploads,
          opmerkingen: form.opmerkingen,
        }),
      });
      const created = await res.json();
      if (!res.ok) throw new Error(created?.error || `HTTP ${res.status}`);
      // ✅ Redirect naar mooi nummer als die bestaat, anders naar id
      const key = created.appNumber ?? created.id;
      window.location.href = `/applications/${key}`;
    } catch (e: any) {
      setErr(e.message || "Indienen mislukt");
    } finally {
      setPending(false);
    }
  };

  // Uploads
  async function onFilesSelected(list: FileList | null) {
    if (!list) return;
    const b64 = await filesToBase64List(list);
    setForm((s) => ({ ...s, uploads: [...s.uploads, ...b64] }));
  }
  function removeUpload(idx: number) {
    setForm((s) => ({ ...s, uploads: s.uploads.filter((_, i) => i !== idx) }));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Nieuwe lease-aanvraag</h1>
          <p className="text-sm text-gray-600">
            RDW en KVK worden automatisch opgehaald.
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="/dashboard"
            className="rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-gray-100"
          >
            Annuleren
          </a>
          <button
            onClick={() => onSubmit()}
            disabled={!canSubmit || pending}
            className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600 disabled:opacity-50"
          >
            {pending ? "Indienen…" : "Aanvraag indienen"}
          </button>
        </div>
      </div>

      {/* 3 kolommen: KvK/Klant • Voertuig • Condities */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* KvK + Klant */}
        <div className="rounded-xl border p-4 space-y-3">
          <h3 className="font-bold">KvK & klantgegevens</h3>
          {field("KvK-nummer", form.kvkNummer, (v) =>
            setForm({ ...form, kvkNummer: v })
          )}
          {kvkStatus && (
            <div className="text-xs text-gray-600">{kvkStatus}</div>
          )}

          <div className="flex items-center gap-2">
            <input
              id="kvkJong"
              type="checkbox"
              checked={form.kvkJong}
              onChange={(e) => setForm({ ...form, kvkJong: e.target.checked })}
            />
            <label htmlFor="kvkJong" className="text-sm text-gray-700">
              KvK jonger dan 6 maanden
            </label>
          </div>

          {form.kvkData && (
            <div className="rounded-lg border bg-gray-50 p-2 text-sm">
              <div>
                <b>{form.kvkData.handelsnaam || "—"}</b>{" "}
                {form.kvkData.rechtsvorm ? `• ${form.kvkData.rechtsvorm}` : ""}
              </div>
              <div>Vestigingsnr: {form.kvkData.vestigingsnummer || "—"}</div>
              <div>
                {[
                  form.kvkData.adres,
                  form.kvkData.postcode,
                  form.kvkData.plaats,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </div>
            </div>
          )}

          {field(
            "Contactpersoon",
            form.contact.naam,
            (v) => setForm({ ...form, contact: { ...form.contact, naam: v } }),
            { placeholder: "Voornaam Achternaam" }
          )}
          {field(
            "E-mail",
            form.contact.email,
            (v) => setForm({ ...form, contact: { ...form.contact, email: v } }),
            { type: "email", placeholder: "contact@klant.nl" }
          )}
          {field(
            "Telefoonnummer",
            form.contact.telefoon,
            (v) =>
              setForm({ ...form, contact: { ...form.contact, telefoon: v } }),
            { placeholder: "0612345678" }
          )}
        </div>

        {/* Voertuig */}
        <div className="rounded-xl border p-4 space-y-3">
          <h3 className="font-bold">Voertuig gegevens</h3>
          {field(
            "Kenteken",
            form.voertuig.kenteken,
            (v) =>
              setForm({ ...form, voertuig: { ...form.voertuig, kenteken: v } }),
            { placeholder: "AB12CD" }
          )}
          {field(
            "KM-stand",
            form.voertuig.kmStand,
            (v) =>
              setForm({ ...form, voertuig: { ...form.voertuig, kmStand: v } }),
            { inputMode: "numeric", placeholder: "45000" }
          )}
          {rdwStatus && (
            <div className="text-xs text-gray-600">{rdwStatus}</div>
          )}
          {field("Merk", form.voertuig.merk, (v) =>
            setForm({ ...form, voertuig: { ...form.voertuig, merk: v } })
          )}
          {field("Model", form.voertuig.model, (v) =>
            setForm({ ...form, voertuig: { ...form.voertuig, model: v } })
          )}
          {field("Brandstof", form.voertuig.brandstof, (v) =>
            setForm({ ...form, voertuig: { ...form.voertuig, brandstof: v } })
          )}
          {field(
            "Bouwjaar",
            form.voertuig.bouwjaar,
            (v) =>
              setForm({ ...form, voertuig: { ...form.voertuig, bouwjaar: v } }),
            { inputMode: "numeric", placeholder: "2019" }
          )}
        </div>

        {/* Condities + Provisie */}
        <div className="rounded-xl border p-4 space-y-3">
          <h3 className="font-bold">Leasecondities</h3>
          {field(
            "Aanschafprijs ex BTW (EUR)",
            form.condities.aanschafprijs,
            (v) =>
              setForm({
                ...form,
                condities: { ...form.condities, aanschafprijs: v },
              }),
            { inputMode: "numeric", placeholder: "28500" }
          )}
          {field(
            "Aanbetaling / Inruil (EUR)",
            form.condities.aanbetaling,
            (v) =>
              setForm({
                ...form,
                condities: { ...form.condities, aanbetaling: v },
              }),
            { inputMode: "numeric", placeholder: "2500" }
          )}
          {field(
            "Slottermijn (EUR)",
            form.condities.slottermijn,
            (v) =>
              setForm({
                ...form,
                condities: { ...form.condities, slottermijn: v },
              }),
            { inputMode: "numeric", placeholder: "5000" }
          )}

          <div className="grid gap-1">
            <label className="text-sm text-gray-700">Looptijd (maanden)</label>
            <select
              value={form.condities.looptijd}
              onChange={(e) =>
                setForm({
                  ...form,
                  condities: { ...form.condities, looptijd: e.target.value },
                })
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-400"
            >
              {monthsOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-1">
            <label className="text-sm text-gray-700">Rente-staffel</label>
            <select
              value={form.condities.renteStaffel}
              onChange={(e) =>
                setForm({
                  ...form,
                  condities: {
                    ...form.condities,
                    renteStaffel: e.target.value,
                  },
                })
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-400"
            >
              {STAFFEL_LETTERS.map((L) => (
                <option key={L} value={L}>
                  {L} – {BASE_RATES[L].toFixed(2).replace(".", ",")}%
                </option>
              ))}
            </select>
            <div className="text-xs text-gray-600">
              Van toepassing:{" "}
              <b>
                {getEffectiveRate(form.condities.renteStaffel, form.kvkJong)
                  .toFixed(2)
                  .replace(".", ",")}
                %
              </b>{" "}
              ({form.kvkJong ? "KvK < 6 mnd" : "KvK ≥ 6 mnd (−1%)"})
            </div>
          </div>

          <div className="rounded-lg border bg-gray-50 p-3 space-y-1">
            <div className="text-sm text-gray-600">
              Indicatieve maandtermijn
            </div>
            <div className="text-xl font-extrabold">
              {prettyCurrency(monthly)}
            </div>
            <div className="text-xs text-gray-600">
              Gebaseerd op aanschaf{" "}
              {prettyCurrency(form.condities.aanschafprijs)} · aanbetaling{" "}
              {prettyCurrency(form.condities.aanbetaling) || "€0"} · slottermijn{" "}
              {prettyCurrency(form.condities.slottermijn) || "€0"} · looptijd{" "}
              {form.condities.looptijd} mnd · rente{" "}
              {getEffectiveRate(form.condities.renteStaffel, form.kvkJong)
                .toFixed(2)
                .replace(".", ",")}
              %
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowProvision((s) => !s)}
            className="rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-gray-100"
          >
            {showProvision ? "verberg provisie" : "laat provisie zien"}
          </button>

          {showProvision && (
            <div className="rounded-lg border bg-white p-3 space-y-1">
              <div className="text-sm text-gray-700">
                Kredietvergoeding (totale rente):{" "}
                <b>{prettyCurrency(kredietvergoeding)}</b>
              </div>
              <div className="text-sm text-gray-700">
                Provisie-percentage (staffel{" "}
                {form.condities.renteStaffel.toUpperCase()}):{" "}
                <b>{provisiePct.toString().replace(".", ",")}%</b>
              </div>
              <div className="text-sm font-bold">
                Provisie-bedrag: {prettyCurrency(provisieBedrag)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Opmerkingen + Uploads */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border p-4 space-y-2">
          <h3 className="font-bold">Opmerkingen</h3>
          <textarea
            rows={6}
            value={form.opmerkingen}
            onChange={(e) => setForm({ ...form, opmerkingen: e.target.value })}
            className="w-full resize-y rounded-lg border border-gray-300 p-2 outline-none focus:ring-2 focus:ring-teal-400"
            placeholder="Eventuele extra informatie of voorwaarden"
          />
        </div>

        <div className="rounded-xl border p-4 space-y-2">
          <h3 className="font-bold">Documenten uploaden</h3>
          <input
            type="file"
            multiple
            onChange={(e) => onFilesSelected(e.target.files)}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2"
          />
          {form.uploads.length > 0 ? (
            <ul className="list-disc pl-6 text-sm">
              {form.uploads.map((f, i) => (
                <li key={i} className="flex items-center justify-between gap-2">
                  <span>
                    {f.name}{" "}
                    <span className="text-gray-500">
                      ({Math.round((f.size || 0) / 1024)} kB)
                    </span>
                  </span>
                  <button
                    onClick={() => removeUpload(i)}
                    className="text-red-600 hover:underline"
                  >
                    Verwijderen
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-gray-600 text-sm">Nog geen bestanden.</div>
          )}
        </div>
      </div>

      {err && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          Fout: {err}
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <a
          href="/dashboard"
          className="rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-gray-100"
        >
          Annuleren
        </a>
        <button
          onClick={() => onSubmit()}
          disabled={!canSubmit || pending}
          className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600 disabled:opacity-50"
        >
          {pending ? "Indienen…" : "Aanvraag indienen"}
        </button>
      </div>
    </div>
  );
}
