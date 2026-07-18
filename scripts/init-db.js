require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { listRegistrations, storageMode } = require("../netlify/functions/_lib/store");

async function main() {
  const mode = storageMode();
  console.log("Storage mode:", mode);

  if (mode === "file") {
    const dir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const fp = path.join(dir, "registrations.json");
    if (!fs.existsSync(fp)) fs.writeFileSync(fp, "[]", "utf8");
    console.log("File store ready:", fp);
    return;
  }

  // Touch Neon + ensure schema via list path
  const rows = await listRegistrations();
  console.log("Neon schema ready. Current registrations:", rows.length);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
