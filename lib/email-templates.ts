// lib/email-templates.ts
import { prettyCurrency } from "@/lib/utils";

export function customerEmailHtml(params: {
  naam: string;
  appNumber?: string;
  voertuig: { kenteken?: string; merk?: string; model?: string; bouwjaar?: string };
  condities: { aanschafprijs?: string; aanbetaling?: string; slottermijn?: string; looptijd?: string; rente?: string };
}) {
  const { naam, appNumber, voertuig, condities } = params;
  return `
  <div style="font-family:Arial,sans-serif;line-height:1.5">
    <h2>Bevestiging lease-aanvraag${appNumber ? ` #${appNumber}` : ""}</h2>
    <p>Hoi ${naam || "klant"},</p>
    <p>We hebben je aanvraag goed ontvangen. Hieronder een samenvatting:</p>
    <h3>Voertuig</h3>
    <ul>
      <li>Kenteken: ${voertuig.kenteken || "Onbekend"}</li>
      <li>Merk/Model: ${[voertuig.merk, voertuig.model].filter(Boolean).join(" ")}${voertuig.bouwjaar ? ` (${voertuig.bouwjaar})` : ""}</li>
    </ul>
    <h3>Condities</h3>
    <ul>
      <li>Aanschafprijs: €${condities.aanschafprijs || "-"}</li>
      <li>Aanbetaling: €${condities.aanbetaling || "0"}</li>
      <li>Slottermijn: €${condities.slottermijn || "0"}</li>
      <li>Looptijd: ${condities.looptijd || "-"} mnd</li>
      <li>Rente: ${condities.rente || "-"}%</li>
    </ul>
    <p>We nemen zo snel mogelijk contact met je op.</p>
    <p>Groet,<br/>AutoAgent</p>
  </div>`;
}

export function internalEmailHtml(params: {
  appNumber?: string;
  kvkNummer: string;
  kvkJong: boolean;
  contact: { naam: string; email: string; telefoon: string };
  voertuig: any;
  condities: any;
  opmerkingen?: string;
}) {
  const { appNumber, kvkNummer, kvkJong, contact, voertuig, condities, opmerkingen } = params;
  return `
  <div style="font-family:Arial,sans-serif;line-height:1.5">
    <h2>Nieuwe lease-aanvraag${appNumber ? ` #${appNumber}` : ""}</h2>
    <h3>Contact</h3>
    <ul>
      <li>Naam: ${contact.naam}</li>
      <li>Email: ${contact.email}</li>
      <li>Telefoon: ${contact.telefoon}</li>
    </ul>
    <h3>KvK</h3>
    <ul>
      <li>KvK-nummer: ${kvkNummer}</li>
      <li>KvK jonger dan 6 mnd: ${kvkJong ? "Ja" : "Nee"}</li>
    </ul>
    <h3>Voertuig</h3>
    <pre>${escapeHtml(JSON.stringify(voertuig, null, 2))}</pre>
    <h3>Condities</h3>
    <pre>${escapeHtml(JSON.stringify(condities, null, 2))}</pre>
    ${opmerkingen ? `<h3>Opmerkingen</h3><p>${escapeHtml(opmerkingen)}</p>` : ""}
  </div>`;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
