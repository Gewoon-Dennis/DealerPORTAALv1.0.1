// app/api/applications/route.ts
import { NextResponse } from "next/server";
import { sendMail } from "@/lib/mailer";
import { customerEmailHtml, internalEmailHtml } from "@/lib/email-templates";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1) Opslaan in DB of service
    // TODO: vervang door jouw echte create
    const created = await createApplication(body); 
    // verwacht { id, appNumber? } terug

    // 2) Data voor mails
    const appNumber = created.appNumber ?? created.id;
    const klantNaam = body?.contact?.naam || "";
    const klantEmail = body?.contact?.email || "";
    const companyTo = process.env.MAIL_TO || "info@autoagent.nl";

    // Rente voor klantmail (zelfde als UI)
    const rente = getEffectiveRate(
      (body?.condities?.renteStaffel || "A").toUpperCase(),
      !!body?.kvkJong
    ).toFixed(2);

    // 3) Stuur mails in parallel (faal-tolerant)
    const tasks: Promise<any>[] = [];

    if (klantEmail) {
      tasks.push(
        sendMail({
          to: klantEmail,
          subject: `Bevestiging lease-aanvraag #${appNumber}`,
          html: customerEmailHtml({
            naam: klantNaam,
            appNumber,
            voertuig: {
              kenteken: body?.voertuig?.kenteken,
              merk: body?.voertuig?.merk,
              model: body?.voertuig?.model,
              bouwjaar: body?.voertuig?.bouwjaar,
            },
            condities: {
              aanschafprijs: body?.condities?.aanschafprijs,
              aanbetaling: body?.condities?.aanbetaling,
              slottermijn: body?.condities?.slottermijn,
              looptijd: body?.condities?.looptijd,
              rente,
            },
          }),
        })
      );
    }

    tasks.push(
      sendMail({
        to: companyTo,
        subject: `Nieuwe lease-aanvraag #${appNumber}`,
        html: internalEmailHtml({
          appNumber,
          kvkNummer: body?.kvkNummer,
          kvkJong: !!body?.kvkJong,
          contact: body?.contact,
          voertuig: body?.voertuig,
          condities: body?.condities,
          opmerkingen: body?.opmerkingen,
        }),
      })
    );

    // laat e-mail fouten de aanvraag niet breken:
    await Promise.allSettled(tasks);

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    console.error("Create application error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}

// Dummy implement; vervang door jouw opsla-logic
async function createApplication(data: any) {
  // ... save to DB
  return { id: "app_12345", appNumber: data?.appNumber };
}

// Zelfde functie als client (of verplaatsen naar shared util)
function getEffectiveRate(letter: string, kvkJong: boolean) {
  const BASE_RATES: Record<string, number> = {
    A: 16.49, B: 15.99, C: 15.49, D: 14.99, E: 14.49, F: 13.99,
    G: 13.49, H: 12.99, I: 12.49, J: 11.99, K: 11.49, L: 10.99,
    M: 10.49, N: 9.99,  O: 9.49,  P: 8.99,  Q: 8.49
  };
  const base = BASE_RATES[letter] ?? 16.49;
  return kvkJong ? base : Number((base - 1).toFixed(2));
}
