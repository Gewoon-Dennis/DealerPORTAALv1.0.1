// scripts/test-resend.ts
import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);
(async () => {
  const r = await resend.emails.send({
    from: "onboarding@resend.dev",
    to: "rojusdaalder@gmail.com",
    subject: "Test Resend",
    html: "<p>Hallo vanaf Resend 🎉</p>",
  });
  console.log(r);
})();
