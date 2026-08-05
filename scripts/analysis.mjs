#!/usr/bin/env node
/**
 * Runs the static-analysis tooling for real and writes its output to
 * `src/components/resources/demos/analysis.json`, which the
 * react-doctor / Biome demo reads.
 *
 * The demo used to carry a hand-written array of findings. That is a
 * lie dressed as evidence: it looks like tool output and is not. This
 * script means the page can only ever show what the tools actually
 * said about this repository.
 *
 *   npm run analysis
 */
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

function run(cmd, args) {
  try {
    return execFileSync(cmd, args, {
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch (err) {
    // Both tools exit non-zero when they find something. That is the
    // normal case here, and stdout still holds the report.
    return err.stdout ?? "";
  }
}

const findings = [];

// ---- Biome -------------------------------------------------------
try {
  const raw = run("npx", [
    "biome",
    "check",
    "src",
    "--reporter=json",
    "--max-diagnostics=200",
  ]);
  const json = JSON.parse(raw.slice(raw.indexOf("{")));
  for (const d of json.diagnostics ?? []) {
    if (d.severity === "information" || d.severity === "info") continue;
    findings.push({
      tool: "biome",
      rule: d.category ?? "unknown",
      severity: d.severity,
      file: (d.location?.path?.file ?? d.location?.path ?? "").replace(/^src\//, ""),
      message: (d.description ?? d.message ?? "").toString().slice(0, 200),
    });
  }
} catch (err) {
  console.error("biome report failed:", err.message);
}

// ---- react-doctor ------------------------------------------------
try {
  const raw = run("npx", ["react-doctor", "--json", "--no-supply-chain"]);
  const json = JSON.parse(raw.slice(raw.indexOf("{")));
  // Its findings live in a flat `diagnostics` array, not under `lint`.
  for (const d of json.diagnostics ?? []) {
    findings.push({
      tool: "react-doctor",
      rule: d.rule ?? "unknown",
      severity: d.severity ?? "warn",
      file: (d.filePath ?? "").replace(/^.*?src\//, ""),
      message: (d.title ?? d.message ?? "").toString().slice(0, 200),
    });
  }
} catch (err) {
  console.error("react-doctor report failed:", err.message);
}

const byRule = new Map();
for (const f of findings) {
  const key = `${f.tool}:${f.rule}`;
  const hit = byRule.get(key) ?? { ...f, count: 0, files: [] };
  hit.count += 1;
  if (f.file && !hit.files.includes(f.file) && hit.files.length < 4)
    hit.files.push(f.file);
  byRule.set(key, hit);
}

const out = {
  generatedAt: new Date().toISOString(),
  total: findings.length,
  rules: [...byRule.values()].sort((a, b) => b.count - a.count).slice(0, 12),
};

writeFileSync(
  new URL("../src/components/resources/demos/analysis.json", import.meta.url),
  JSON.stringify(out, null, 1) + "\n",
);
console.log(`analysis.json: ${out.total} findings across ${out.rules.length} rules`);
