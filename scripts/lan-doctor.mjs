import fs from "node:fs";
import os from "node:os";
import path from "node:path";
const root = process.cwd();
const results = [];
results.push(["Node 22+", Number(process.versions.node.split(".")[0]) >= 22, process.versions.node]);
results.push(["bridge/server.mjs", fs.existsSync(path.join(root, "bridge", "server.mjs")), ""]);
results.push(["bridge/.env", fs.existsSync(path.join(root, "bridge", ".env")), path.join(root, "bridge", ".env")]);
const privateIps = [];
for (const entries of Object.values(os.networkInterfaces())) {
  for (const item of entries ?? []) {
    if (item.family !== "IPv4" || item.internal) continue;
    if (/^10\./.test(item.address) || /^192\.168\./.test(item.address) || /^172\.(1[6-9]|2\d|3[01])\./.test(item.address)) privateIps.push(item.address);
  }
}
results.push(["Private LAN IPv4", privateIps.length > 0, privateIps.join(", ") || "none"]);
console.log("\nTV Phone LAN Doctor\n");
for (const [name, ok, detail] of results) console.log(`${ok ? "✓" : "✗"} ${name}${detail ? ` — ${detail}` : ""}`);
console.log("\nVercel hosts the UI but cannot directly reach private TV IPs.");
console.log("An HTTPS PWA cannot call a plain HTTP LAN bridge because of mixed-content rules.");
console.log("Use local HTTP dev for immediate protocol testing or the Capacitor native build for the final phone experience.\n");
if (results.some(([, ok]) => !ok)) process.exitCode = 1;
