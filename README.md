# AutoAgent Dealerportaal (Next.js 14 + App Router)

All-in-one **frontend + API** met **Postgres (Prisma)**, **NextAuth (Credentials + roles)** en **API-proxies** (RDW/KvK). UI/flows gemigreerd vanuit de bestaande `App.jsx`.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-org/autoagent-portal&env=DATABASE_URL,NEXTAUTH_SECRET,RESEND_API_KEY,SMTP_HOST,SMTP_PORT,SMTP_USER,SMTP_PASS,MAIL_FROM,KVK_API_KEY&project-name=autoagent-portal&repository-name=autoagent-portal)

---

## 1) Lokaal draaien

```bash
# 1. Repo klonen & dependencies
pnpm i   # of npm i / yarn

# 2. .env aanmaken
cp .env.example .env
# Vul DATABASE_URL en NEXTAUTH_SECRET (en evt. mail/KVK variabelen)

# 3. Prisma genereren en DB schema pushen
pnpm prisma generate
pnpm run db:push

# 4. Seed data (admin + dealer + 1 demo-aanvraag)
pnpm run db:seed

# 5. Start dev server
pnpm dev  # http://localhost:3000
```
