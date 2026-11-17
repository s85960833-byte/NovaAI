import fs from "node:fs";
import path from "node:path";
const roots = ["apps", "packages", "scripts"];
const patterns = [
  /sk-[A-Za-z0-9_-]{20,}/,
  /sb_secret_[A-Za-z0-9_-]{20,}/,
  /AIza[0-9A-Za-z_-]{30,}/,
  /rzp_(?:live|test)_[A-Za-z0-9]{12,}/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
];
const failures = [];
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "dist") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && !entry.name.endsWith(".lock")) {
      const data = fs.readFileSync(full, "utf8");
      for (const pattern of patterns)
        if (pattern.test(data)) failures.push(full + " matched " + pattern);
    }
  }
}
for (const root of roots) walk(root);
if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("secret pattern scan: PASS");
