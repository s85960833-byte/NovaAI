import fs from "node:fs";
import path from "node:path";
const root = path.resolve("apps/web/src/i18n");
const en = JSON.parse(fs.readFileSync(path.join(root, "en.json"), "utf8"));
const hi = JSON.parse(fs.readFileSync(path.join(root, "hi.json"), "utf8"));
function flatten(value, prefix = "", result = new Set()) {
  for (const [key, item] of Object.entries(value)) {
    const name = prefix ? prefix + "." + key : key;
    if (item && typeof item === "object" && !Array.isArray(item)) flatten(item, name, result);
    else result.add(name);
  }
  return result;
}
const a = flatten(en),
  b = flatten(hi),
  missingHi = [...a].filter((k) => !b.has(k)),
  missingEn = [...b].filter((k) => !a.has(k));
if (missingHi.length || missingEn.length) {
  console.error(JSON.stringify({ missingHi, missingEn }, null, 2));
  process.exit(1);
}
process.stdout.write("i18n parity: PASS (" + a.size + " keys)\\n");
