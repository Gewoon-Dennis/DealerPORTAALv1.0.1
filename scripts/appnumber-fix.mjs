// scripts/appnumber-fix.mjs
// Doel: overal /applications/${X.id} -> /applications/${X.appNumber ?? X.id}
// en  #{X.id} -> #{X.appNumber ?? X.id}  zonder je UI/flows te veranderen.
// Daarna zet het je detail-API goed, zodat zowel /applications/102001 als /applications/<cuid> werkt.

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = process.cwd();

const exts = new Set([".ts", ".tsx", ".jsx"]);
const scanDirs = ["app"]; // we patchen alleen code in app/

const rules = [
  // Detail URLs in template strings
  { re: /\/applications\/\$\{([A-Za-z_]\w*)\.id\}/g, to: "/applications/${$1.appNumber ?? $1.id}" },
  // Titel/labels als '#${x.id}'
  { re: /#\$\{([A-Za-z_]\w*)\.id\}/g, to: "#${$1.appNumber ?? $1.id}" },
  // Specifiek voor 'created.id' (redirect na POST)
  { re: /\/applications\/\$\{created\.id\}/g, to: "/applications/${created.appNumber ?? created.id}" },
  { re: /#\$\{created\.id\}/g, to: "#${created.appNumber ?? created.id}" },
  // Veelgebruikte variabelenamen in lijsten
  { re: /\/applications\/\$\{(item|row|a|app|application)\.id\}/g, to: "/applications/${$1.appNumber ?? $1.id}" },
  { re: /#\$\{(item|row|a|app|application)\.id\}/g, to: "#${$1.appNumber ?? $1.id}" },
];

async function walk(dir, out = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) await walk(p, out);
    else if (exts.has(path.extname(e.name))) out.push(p);
  }
  return out;
}

async function writeIfChanged(file, content) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  try {
    const prev = await fs.readFile(file, "utf8");
    if (prev === content) return false;
  } catch {}
  await fs.writeFile(file, content, "utf8");
  return true;
}

const detailApiContent = `// app/api/applications/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = (session.user as any).role === "admin";
  const key = String(params.id || "");
  const isNumeric = /^\\d+$/.test(key);

  const app = await prisma.application.findFirst({
    where: { OR: [ ...(isNumeric ? [{ appNumber: parseInt(key, 10) }] : []), { id: key }] },
  });

  if (!app) return NextResponse.json({ error: "Not found", debug: { key } }, { status: 404 });
  if (!isAdmin && app.dealerEmail !== session.user.email) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(app);
}
`;

async function main() {
  console.log("🔧 Patching appNumber usage…");
  const files = (await Promise.all(scanDirs.map(d => walk(path.join(root, d))))).flat();

  let changed = 0;
  for (const f of files) {
    let src = await fs.readFile(f, "utf8");
    let next = src;
    rules.forEach(({ re, to }) => { next = next.replace(re, to); });
    if (next !== src) {
      await fs.writeFile(f, next, "utf8");
      changed++;
      console.log("  ✏️", path.relative(root, f));
    }
  }

  const apiPath = path.join(root, "app/api/applications/[id]/route.ts");
  const apiUpdated = await writeIfChanged(apiPath, detailApiContent);
  if (apiUpdated) console.log("  ✅ Updated API:", path.relative(root, apiPath));

  console.log(`✅ Klaar. Aangepaste bestanden: ${changed}`);
  console.log("➡️ Herstart daarna je dev server.");
}

main().catch(e => { console.error(e); process.exit(1); });
`;

