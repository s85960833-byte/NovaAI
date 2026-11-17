import fs from "node:fs";import path from "node:path";
const ignored=new Set(["node_modules",".git","dist","coverage"]);
const patterns=[/sk-[A-Za-z0-9_-]{20,}/,/sb_secret_[A-Za-z0-9_-]{20,}/,/AIza[0-9A-Za-z_-]{30,}/,/rzp_(?:live|test)_[A-Za-z0-9]{12,}/,/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/];
const failures=[];
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){if(ignored.has(entry.name))continue;const full=path.join(dir,entry.name);if(entry.isDirectory())walk(full);else if(entry.isFile()&&!entry.name.endsWith(".lock")){const data=fs.readFileSync(full,"utf8");for(const pattern of patterns)if(pattern.test(data))failures.push(full+" matched "+pattern);}}}
walk(".");if(failures.length){console.error(failures.join("\n"));process.exit(1);}console.log("secret pattern scan: PASS");