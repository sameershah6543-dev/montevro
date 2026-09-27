// Starts a throwaway local PostgreSQL for development (no install needed).
// Usage: npm run db:local   → then in another terminal: npm run dev
import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "node:fs";
import path from "node:path";

const dir = path.join(process.cwd(), ".local-db");
const pg = new EmbeddedPostgres({ databaseDir: dir, user: "montevro", password: "montevro", port: 5433, persistent: true, initdbFlags: ["--encoding=UTF8", "--locale=C"] });

async function main() {
  const fresh = !existsSync(path.join(dir, "PG_VERSION"));
  if (fresh) await pg.initialise();
  await pg.start();
  if (fresh) await pg.createDatabase("montevro");
  console.log('Local Postgres running → DATABASE_URL="postgresql://montevro:montevro@localhost:5433/montevro"');
  const stop = async () => { await pg.stop(); process.exit(0); };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}
main().catch((e) => { console.error(e); process.exit(1); });
