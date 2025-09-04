// app/api/rdw/route.ts
import { NextResponse } from "next/server";

function normalizeFuelName(s = "") {
  const v = String(s).trim().toLowerCase();
  if (v.includes("elektr")) return "Elektrisch";
  if (v.includes("benz")) return "Benzine";
  if (v.includes("dies")) return "Diesel";
  if (v.includes("lpg")) return "LPG";
  if (v.includes("cng") || v.includes("aardgas")) return "CNG";
  if (v.includes("waterstof") || v.includes("hydrogen")) return "Waterstof";
  if (v.includes("ethanol") || v.includes("e85")) return "Ethanol";
  if (v.includes("hybride")) return "Hybride";
  return v.charAt(0).toUpperCase() + v.slice(1);
}

function deriveFuelLabel(fuels: any[] = []) {
  const raw = (Array.isArray(fuels) ? fuels : [])
    .map((f) => f?.brandstof_omschrijving || f?.brandstof || "")
    .filter(Boolean);
  if (!raw.length) return "";
  const norm = [...new Set(raw.map(normalizeFuelName))];

  if (norm.includes("Hybride")) {
    const comb = norm.filter((x) => x !== "Hybride");
    const hasElec = comb.includes("Elektrisch");
    const combustion = comb.find((x) => x !== "Elektrisch");
    if (hasElec && combustion) return `Hybride (${combustion}/Elektrisch)`;
    return "Hybride";
  }
  const hasElectric = norm.includes("Elektrisch");
  const combustionList = norm.filter((x) => x !== "Elektrisch");
  if (hasElectric && combustionList.length > 0) {
    return `Hybride (${combustionList[0]}/Elektrisch)`;
  }
  return norm.length > 1 ? norm.join(" + ") : norm[0];
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const kenteken = (url.searchParams.get("kenteken") || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  if (!kenteken)
    return NextResponse.json({ error: "kenteken required" }, { status: 400 });

  const voertuigenUrl = `https://opendata.rdw.nl/resource/m9d7-ebf2.json?kenteken=${encodeURIComponent(
    kenteken
  )}`;
  const brandstofUrl = `https://opendata.rdw.nl/resource/8ys7-d773.json?kenteken=${encodeURIComponent(
    kenteken
  )}`;

  try {
    const [vehRes, fuelRes] = await Promise.all([
      fetch(voertuigenUrl),
      fetch(brandstofUrl),
    ]);
    const vehJson = await vehRes.json();
    const fuelJson = await fuelRes.json();

    const v = Array.isArray(vehJson) && vehJson[0];
    if (!v)
      return NextResponse.json(
        { ok: false, reason: "not_found" },
        { status: 404 }
      );

    let bouwjaar = "";
    const det = v.datum_eerste_toelating || v.datum_eerste_toelating_dt;
    if (det && /^\d{8}$/.test(det)) bouwjaar = det.slice(0, 4);

    const brandstof = deriveFuelLabel(fuelJson);

    return NextResponse.json({
      ok: true,
      kenteken,
      merk: v.merk || "",
      model: v.handelsbenaming || "",
      brandstof,
      bouwjaar,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, reason: "rdw_error" },
      { status: 500 }
    );
  }
}
