// app/api/kvk/route.ts
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const kvk = (url.searchParams.get("kvk") || "").replace(/\D/g, "");
  if (!kvk)
    return NextResponse.json({ error: "kvk required" }, { status: 400 });

  const apiKey = process.env.KVK_API_KEY;
  if (!apiKey)
    return NextResponse.json({ error: "KVK_API_KEY missing" }, { status: 500 });

  const endpoint = `https://api.kvk.nl/api/v2/zoeken/kvk?kvkNummer=${encodeURIComponent(
    kvk
  )}&pagina=1`;
  try {
    const res = await fetch(endpoint, {
      headers: { apikey: apiKey, accept: "application/json" },
      cache: "no-store",
    });

    if (!res.ok)
      return NextResponse.json(
        { ok: false, reason: `HTTP ${res.status}` },
        { status: res.status }
      );

    const data = await res.json();
    const item = data?.resultaten?.[0] || data?.items?.[0] || null;
    if (!item)
      return NextResponse.json(
        { ok: false, reason: "no_results" },
        { status: 404 }
      );

    const handelsnaam =
      item.handelsnaam || item.handelNaam || item.handelsnamen?.[0] || "";
    const rechtsvorm = item.rechtsvorm || item.rechtsvormOmschrijving || "";
    const vestigingsnummer =
      item.vestigingsnummer || item.vestigingsNummer || "";

    const straat =
      item.straat || item.adres?.straat || item.bezoekadres?.straatnaam || "";
    const huisnr =
      item.huisnummer ||
      item.adres?.huisnummer ||
      item.bezoekadres?.huisnummer ||
      "";
    const postcode =
      item.postcode || item.adres?.postcode || item.bezoekadres?.postcode || "";
    const plaats =
      item.plaats ||
      item.adres?.plaats ||
      item.bezoekadres?.plaats ||
      item.bezoekadres?.woonplaats ||
      "";

    return NextResponse.json({
      ok: true,
      kvk,
      handelsnaam,
      rechtsvorm,
      vestigingsnummer,
      adres: [straat, huisnr].filter(Boolean).join(" "),
      postcode,
      plaats,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, reason: "network_error" },
      { status: 500 }
    );
  }
}
