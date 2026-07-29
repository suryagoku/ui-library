#!/usr/bin/env node
// Verifies the tarball @suryagoku/ui would publish, without publishing anything.
//
// Run locally with `pnpm verify:pkg`; CI runs the same script on every push, and the release
// workflow runs it again before publishing. The checks encode the failure modes that are
// invisible at install time but break consumers:
//
//   - src/ leaking into the tarball, turning internals into public API
//   - a missing entry point, so `import ... from "@suryagoku/ui"` cannot resolve
//   - an uncompiled stylesheet (a literal @tailwind means Tailwind never ran)
//   - a stale dist/ that installs and imports fine but exports the wrong things
//   - a dependency accidentally inlined into the bundle instead of left external
//
// `pnpm pack` triggers the package's prepack script, so dist/ is always rebuilt from current
// source before it is inspected.

import { execFileSync } from "node:child_process"
import { mkdtempSync, readFileSync, readdirSync, statSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const PKG = "@suryagoku/ui"
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const PKG_DIR = join(REPO_ROOT, "packages", "ui")
const DIST = join(PKG_DIR, "dist")
const MAX_UNPACKED_BYTES = 1_000_000
// The bundle keeps every dependency external, so it holds only this library's own code. A large
// jump here means something got inlined.
const MAX_ENTRY_BYTES = 60_000

const failures = []
const notes = []

function check(label, ok, detail = "") {
  const line = `${label}${detail ? ` — ${detail}` : ""}`
  if (ok) notes.push(`  ok    ${line}`)
  else failures.push(`  FAIL  ${line}`)
}

function dirSize(dir) {
  return readdirSync(dir, { withFileTypes: true }).reduce((total, entry) => {
    const path = join(dir, entry.name)
    return total + (entry.isDirectory() ? dirSize(path) : statSync(path).size)
  }, 0)
}

// --- what would ship ---------------------------------------------------------------------

const packDestination = mkdtempSync(join(tmpdir(), "verify-pkg-"))
const packOutput = execFileSync("pnpm", ["pack", "--json", "--pack-destination", packDestination], {
  cwd: PKG_DIR,
  encoding: "utf8",
  stdio: ["ignore", "pipe", "inherit"],
})

// prepack (the build) writes to the same stdout, so the JSON object is not the whole output.
// It is the last top-level `{` at the start of a line.
const jsonStart = packOutput.lastIndexOf("\n{\n")
let meta
try {
  meta = JSON.parse(jsonStart === -1 ? packOutput : packOutput.slice(jsonStart + 1))
} catch {
  console.error("Could not parse `pnpm pack --json` output:\n" + packOutput)
  process.exit(1)
}

const entries = meta.files.map((f) => f.path)
const stray = entries.filter((p) => !p.startsWith("dist/") && p !== "package.json")
check("tarball contains only dist/ and package.json", stray.length === 0, stray.join(", "))

for (const required of ["dist/index.mjs", "dist/index.d.mts", "dist/styles.css"]) {
  check(`tarball contains ${required}`, entries.includes(required))
}

const unpacked = dirSize(DIST)
check(
  `unpacked size under ${MAX_UNPACKED_BYTES / 1000} kB`,
  unpacked <= MAX_UNPACKED_BYTES,
  `${Math.round(unpacked / 1000)} kB across ${entries.length} entries, ` +
    `${Math.round(statSync(meta.filename).size / 1000)} kB packed`,
)

// --- the package.json contract -----------------------------------------------------------

const manifest = JSON.parse(readFileSync(join(PKG_DIR, "package.json"), "utf8"))
for (const field of ["types", "files", "exports", "sideEffects", "license", "peerDependencies"]) {
  check(`package.json declares ${field}`, manifest[field] !== undefined)
}
check("prepack rebuilds before pack/publish", Boolean(manifest.scripts?.prepack))
check(
  "exports exposes exactly the two documented entry points",
  Object.keys(manifest.exports ?? {}).join(",") === ".,./styles.css",
  Object.keys(manifest.exports ?? {}).join(", "),
)
// A scoped package defaults to `restricted`, which fails with 402 Payment Required on a free
// npm account. publishConfig makes the intent part of the manifest rather than something a
// publisher has to remember, so it must not quietly go missing.
check(
  "publishConfig pins the publish target",
  manifest.publishConfig?.access === "public" || Boolean(manifest.publishConfig?.registry),
  JSON.stringify(manifest.publishConfig ?? null),
)

// --- the JS entry point ------------------------------------------------------------------

const indexMjs = readFileSync(join(DIST, "index.mjs"), "utf8")
const dts = readFileSync(join(DIST, "index.d.mts"), "utf8")

const exportBlock = indexMjs.match(/export\s*\{([^}]*)\}/)
const exportNames = exportBlock
  ? exportBlock[1]
      .split(",")
      .map((n) =>
        n
          .trim()
          .split(/\s+as\s+/)
          .pop(),
      )
      .filter(Boolean)
  : []

check(
  "entry point re-exports the public API",
  exportNames.length > 0,
  `${exportNames.length} names`,
)

// Every name each barrel module exports must survive the build. A silent drop here is the
// "published fine, but consumers get no components" failure — it installs and imports cleanly.
const barrel = readFileSync(join(PKG_DIR, "src", "index.ts"), "utf8")
const barrelModules = [...barrel.matchAll(/export \* from "\.\/(.+)"/g)].map((m) => m[1])

const missingValues = []
const missingTypes = []
for (const moduleName of barrelModules) {
  const source = readFileSync(join(PKG_DIR, "src", `${moduleName}.tsx`), "utf8")

  for (const [, names] of source.matchAll(/export\s+\{([^}]*)\}/g)) {
    for (const name of names
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean)) {
      if (!exportNames.includes(name)) missingValues.push(`${moduleName}:${name}`)
    }
  }

  for (const [, names] of source.matchAll(/export\s+type\s+\{([^}]*)\}/g)) {
    for (const name of names
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean)) {
      if (!dts.includes(name)) missingTypes.push(`${moduleName}:${name}`)
    }
  }
}

check(
  "every value exported by a barrel module reaches dist/index.mjs",
  missingValues.length === 0,
  missingValues.length ? `missing ${missingValues.join(", ")}` : `${barrelModules.length} modules`,
)
check(
  "every type exported by a barrel module reaches dist/index.d.mts",
  missingTypes.length === 0,
  missingTypes.join(", "),
)

check(
  "dependencies stay external rather than inlined",
  /from "react\/jsx-runtime"/.test(indexMjs) && /from "@base-ui\/react\//.test(indexMjs),
)
check(
  `entry point under ${MAX_ENTRY_BYTES / 1000} kB`,
  indexMjs.length <= MAX_ENTRY_BYTES,
  `${Math.round(indexMjs.length / 1000)} kB`,
)
check("sourcemap emitted", entries.includes("dist/index.mjs.map"))
check("type declarations re-export the API", /export\s*\{|export declare/.test(dts))

// --- the stylesheet ----------------------------------------------------------------------

const css = readFileSync(join(DIST, "styles.css"), "utf8")
check("stylesheet was compiled by Tailwind", css.startsWith("/*! tailwindcss"))
check("stylesheet has no un-processed @tailwind directive", !css.includes("@tailwind "))
check("stylesheet carries the design tokens", css.includes("--primary:"))
check("dark variant is bound to the .dark class", css.includes(":is(.dark *)"))

// --- the docs app must never be published ------------------------------------------------

const docsManifest = JSON.parse(
  readFileSync(join(REPO_ROOT, "apps", "docs", "package.json"), "utf8"),
)
check("apps/docs is marked private", docsManifest.private === true)

// --- report ------------------------------------------------------------------------------

console.log(`\nVerifying ${PKG}@${meta.version}\n`)
console.log([...notes, ...failures].join("\n"))

if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed.\n`)
  process.exit(1)
}
console.log(`\nAll ${notes.length} checks passed.\n`)
