// lib/mailer.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export type SendMailArgs = {
  to: string | string[];
  subject: string;
  html: string;
};

export async function sendMail({ to, subject, html }: SendMailArgs) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY ontbreekt — email overslagen");
    return { skipped: true };
  }
  const from = process.env.MAIL_FROM || "noreply@autoagent.nl";
  const result = await resend.emails.send({ from, to, subject, html });
  if (result.error) {
    throw new Error(result.error.message || "Resend send error");
  }
  return result;
}
