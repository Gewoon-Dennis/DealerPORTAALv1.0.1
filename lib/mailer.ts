import nodemailer from "nodemailer";
import { Resend } from "resend";

const from = process.env.MAIL_FROM || "AutoAgent <no-reply@autoagent.nl>";

export async function sendMail(opts: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}) {
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html ?? `<pre>${opts.text ?? ""}</pre>`,
      text: opts.text,
    });
    return;
  }

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transporter.sendMail({
      from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html ?? `<pre>${opts.text ?? ""}</pre>`,
      text: opts.text,
    });
    return;
  }

  // Geen mailprovider geconfigureerd → log alleen
  console.warn("[MAIL] No provider configured, would send:", opts);
}
