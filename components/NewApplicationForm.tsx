"use client";

import { useEffect, useMemo, useState } from "react";
import { btn, card, h3, input } from "./ui";
import {
  BASE_RATES,
  STAFFEL_LETTERS,
  getEffectiveRate,
  calcMonthly,
  monthsOptions,
  prettyCurrency,
} from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function NewApplicationForm() {
  const router = useRouter();
  const [kvkStatus, setKvkStatus] = useState<string | null>(null);
  const [form, setForm] = useState<any>({
    kvkNummer: "",
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
    uploads: [] as { name: string; size: number }[],
    opmerkingen: "",
  });

  // RDW auto-fill
  useEffect(() => {
    const t = setTimeout(async () => {
      const kenteken = String(form.voertuig.kenteken || "")
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "");
      if (!kenteken) return;
      const res = await fetch(
        `/api/rdw?kenteken=${encodeURIComponent(kenteken)}`
      );
      const json = await res.json();
      if (json?.ok && json.data) {
        setForm((s: any) => ({
          ...s,
          voertuig: {
            ...s.voertuig,
            kenteken: json.data.kenteken,
            merk: json.data.merk || s.voertuig.merk,
            model: json.data.model || s.voertuig.model,
            brandstof: json.data.brandstof || s.voertuig.brandstof,
            bouwjaar: json.data.bouwjaar || s.voertuig.bouwjaar,
          },
        }));
      }
    }, 450);
    return () => clearTimeout(t);
  }, [form.voertuig.kenteken]);

  // KVK auto-fill (badge)
  useEffect(() => {
    const t = setTimeout(async () => {
      const kvk = String(form.kvkNummer || "").replace(/\D/g, "");
      if (!kvk) {
        setKvkStatus(null);
        return;
      }
      setKvkStatus("loading");
      const res = await fetch(`/api/kvk?kvk=${kvk}`);
      const json = await res.json();
      if (json?.ok) setKvkStatus("ok");
      else setKvkStatus(`error:${json?.reason || "onbekend"}`);
    }, 500);
    return () => clearTimeout(t);
  }, [form.kvkNummer]);

  const valid = useMemo(() => {
    const c = form.condities;
    return (
      form.kvkNummer &&
      form.contact.naam &&
      form.voertuig.kenteken &&
      c.aanschafprijs &&
      c.looptijd
    );
  }, [form]);

  const onFile = (e: any) => {
    const files = Array.from(e.target.files || []).map((f: any) => ({
      name: f.name,
      size: f.size,
    }));
    setForm((s: any) => ({ ...s, uploads: [...s.uploads, ...files] }));
  };

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
        looptijd: Number(form.condities.looptijd),
        annualRatePct: effectiveRate,
      }),
    [form.condities, effectiveRate]
  );

  const submit = async () => {
    const payload = {
      kvkNummer: form.kvkNummer,
      kvkJong: form.kvkJong,
      contact: {
        naam: form.contact.naam,
        email: form.contact.email,
        telefoon: form.contact.telefoon,
      },
      voertuig: form.voertuig,
      condities: form.condities,
      uploads: form.uploads,
      opmerkingen: form.opmerkingen,
    };
    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const created = await res.json();
      // notify
      const msg = `Er is een nieuwe aanvraag ingediend.

+ Aanvraag ID: ${created.id}
+ Dealer: ${created.dealerEmail}
+ Contact: ${form.contact.naam} (${form.contact.email})
+ KvK: ${form.kvkNummer}
+ Voertuig: ${form.voertuig.merk} ${form.voertuig.model} (${
        form.voertuig.kenteken || "n.v.t."
      })
+ Aanschafprijs: ${prettyCurrency(form.condities.aanschafprijs)}
+ Aanbetaling: ${prettyCurrency(form.condities.aanbetaling)}
+ Slottermijn: ${prettyCurrency(form.condities.slottermijn)}
+ Looptijd: ${form.condities.looptijd} mnd
+ Status: Ingediend`;
      await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          type: "new_application",
          to: "info@autoagent.nl",
          subject: `Nieuwe lease-aanvraag #${created.id}`,
          message: msg,
        }),
      });
      // go to detail
      router.replace(`/applications/${created.id}`);
    }
  };

  const field = (
    label: string,
    value: any,
    onChange: (v: any) => void,
    props: any = {}
  ) => (
    <div style={{ display: "grid", gap: 6 }}>
      <label style={{ fontSize: 14, color: "#333" }}>{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...props}
        style={input()}
      />
    </div>
  );

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>
          Nieuwe lease-aanvraag
        </h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => history.back()} style={btn({ kind: "ghost" })}>
            Annuleren
          </button>
          <button
            onClick={submit}
            disabled={!valid}
            style={btn({ kind: valid ? "primary" : "disabled" })}
          >
            Indienen
          </button>
        </div>
      </div>

      <div
        style={{
          ...card(),
          display: "grid",
          gap: 80,
          gridTemplateColumns: "1fr 1fr",
          alignItems: "end",
        }}
      >
        {field(
          "Kenteken",
          form.voertuig.kenteken,
          (v: any) =>
            setForm({ ...form, voertuig: { ...form.voertuig, kenteken: v } }),
          { placeholder: "AB12CD" }
        )}
        {field("KM-stand", form.voertuig.kmStand, (v: any) =>
          setForm({ ...form, voertuig: { ...form.voertuig, kmStand: v } })
        )}
      </div>

      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 1fr" }}>
        <div style={card()}>
          <h3 style={h3()}>KvK & klantgegevens</h3>
          <div style={{ display: "grid", gap: 12 }}>
            {field("KvK-nummer", form.kvkNummer, (v: any) =>
              setForm({ ...form, kvkNummer: v })
            )}
            <div
              style={{
                fontSize: 12,
                color: kvkStatus?.startsWith("error") ? "#b91c1c" : "#666",
              }}
            >
              {kvkStatus === "loading" && "Zoeken in KVK…"}
              {kvkStatus === "ok" && "KVK-gegevens gevonden"}
              {kvkStatus?.startsWith("error") &&
                `KVK-lookup niet gelukt: ${kvkStatus.split(":")[1]}`}
              {!kvkStatus && "Voer KvK-nummer in"}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                id="kvkJong"
                type="checkbox"
                checked={form.kvkJong}
                onChange={(e) =>
                  setForm({ ...form, kvkJong: e.target.checked })
                }
              />
              <label htmlFor="kvkJong" style={{ fontSize: 14, color: "#333" }}>
                KvK jonger dan 6 maanden
              </label>
            </div>

            {field(
              "Contactpersoon",
              form.contact.naam,
              (v: any) =>
                setForm({ ...form, contact: { ...form.contact, naam: v } }),
              { placeholder: "Voornaam Achternaam" }
            )}
            {field(
              "E-mail",
              form.contact.email,
              (v: any) =>
                setForm({ ...form, contact: { ...form.contact, email: v } }),
              { placeholder: "contact@klant.nl", type: "email" }
            )}
            {field(
              "Telefoonnummer",
              form.contact.telefoon,
              (v: any) =>
                setForm({ ...form, contact: { ...form.contact, telefoon: v } }),
              { placeholder: "0612345678" }
            )}
          </div>

          <div style={{ height: 16 }} />
          <div style={{ display: "grid", gap: 12 }}>
            {field(
              "Merk",
              form.voertuig.merk,
              (v: any) =>
                setForm({ ...form, voertuig: { ...form.voertuig, merk: v } }),
              { placeholder: "Automatisch via RDW of handmatig" }
            )}
            {field(
              "Model",
              form.voertuig.model,
              (v: any) =>
                setForm({ ...form, voertuig: { ...form.voertuig, model: v } }),
              { placeholder: "Automatisch via RDW of handmatig" }
            )}
            {field(
              "Brandstof",
              form.voertuig.brandstof,
              (v: any) =>
                setForm({
                  ...form,
                  voertuig: { ...form.voertuig, brandstof: v },
                }),
              { placeholder: "Automatisch via RDW of handmatig" }
            )}
            {field(
              "Bouwjaar",
              form.voertuig.bouwjaar,
              (v: any) =>
                setForm({
                  ...form,
                  voertuig: { ...form.voertuig, bouwjaar: v },
                }),
              {
                placeholder: "Automatisch via RDW of handmatig",
                inputMode: "numeric",
              }
            )}
          </div>
        </div>

        <div style={card()}>
          <h3 style={h3()}>Leasecondities</h3>
          <div style={{ display: "grid", gap: 12 }}>
            {field(
              "Aanschafprijs ex BTW (EUR)",
              form.condities.aanschafprijs,
              (v: any) =>
                setForm({
                  ...form,
                  condities: { ...form.condities, aanschafprijs: v },
                }),
              { inputMode: "numeric", placeholder: "Bijv. 28.500" }
            )}
            {field(
              "Aanbetaling / Inruil (EUR)",
              form.condities.aanbetaling,
              (v: any) =>
                setForm({
                  ...form,
                  condities: { ...form.condities, aanbetaling: v },
                }),
              { inputMode: "numeric", placeholder: "Bijv. 2.500" }
            )}
            {field(
              "Slottermijn (EUR)",
              form.condities.slottermijn,
              (v: any) =>
                setForm({
                  ...form,
                  condities: { ...form.condities, slottermijn: v },
                }),
              { inputMode: "numeric", placeholder: "Bijv. 5.000" }
            )}

            <div style={{ display: "grid", gap: 6 }}>
              <label style={{ fontSize: 14, color: "#333" }}>
                Looptijd (maanden)
              </label>
              <select
                value={form.condities.looptijd}
                onChange={(e) =>
                  setForm({
                    ...form,
                    condities: { ...form.condities, looptijd: e.target.value },
                  })
                }
                style={input()}
              >
                {monthsOptions.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <label style={{ fontSize: 14, color: "#333" }}>
                Rente staffel
              </label>
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
                style={input()}
              >
                {STAFFEL_LETTERS.map((L) => (
                  <option key={L} value={L}>
                    {L} – {BASE_RATES[L].toFixed(2).replace(".", ",")}%
                  </option>
                ))}
              </select>
              <div style={{ fontSize: 12, color: "#666" }}>
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

            <div
              style={{
                marginTop: 6,
                padding: 10,
                background: "#f9fafb",
                border: "1px solid #eef2f7",
                borderRadius: 8,
              }}
            >
              <div style={{ fontSize: 13, color: "#555" }}>
                Indicatieve maandtermijn
              </div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>
                {prettyCurrency(monthly)}
              </div>
              <div style={{ fontSize: 12, color: "#777", marginTop: 4 }}>
                Gebaseerd op aanschaf{" "}
                {prettyCurrency(form.condities.aanschafprijs)} · aanbetaling{" "}
                {prettyCurrency(form.condities.aanbetaling) || "€0"} ·
                slottermijn {prettyCurrency(form.condities.slottermijn) || "€0"}{" "}
                · looptijd {form.condities.looptijd} mnd · rente{" "}
                {getEffectiveRate(form.condities.renteStaffel, form.kvkJong)
                  .toFixed(2)
                  .replace(".", ",")}
                %
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 1fr" }}>
        <div style={card()}>
          <h3 style={h3()}>Opmerkingen</h3>
          <textarea
            rows={5}
            value={form.opmerkingen}
            onChange={(e) => setForm({ ...form, opmerkingen: e.target.value })}
            placeholder="Eventuele extra informatie of voorwaarden"
            style={{ ...input(), height: 120, resize: "vertical" }}
          />
        </div>
        <div style={card()}>
          <h3 style={h3()}>Documenten uploaden</h3>
          <input type="file" multiple onChange={onFile} />
          {form.uploads?.length > 0 && (
            <div style={{ marginTop: 8, fontSize: 14, color: "#333" }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Bestanden:</div>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {form.uploads.map((f: any, i: number) => (
                  <li key={i}>
                    {f.name}{" "}
                    <span style={{ color: "#888" }}>
                      ({Math.round((f.size || 0) / 1024)} kB)
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          ...card(),
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontSize: 14, color: "#666" }}>
          Door in te dienen ga je akkoord met de voorwaarden van AutoAgent.
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => history.back()} style={btn({ kind: "ghost" })}>
            Annuleren
          </button>
          <button
            onClick={submit}
            disabled={!valid}
            style={btn({ kind: valid ? "primary" : "disabled" })}
          >
            Aanvraag indienen
          </button>
        </div>
      </div>
    </div>
  );
}
