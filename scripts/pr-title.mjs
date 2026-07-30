#!/usr/bin/env node
// Parses Conventional Commits pull request titles, and derives the release from them.
//
// This is the only place that rule lives. The PR check that rejects a title and the release
// workflow that picks a version number both call this file, so the rule a contributor is held to
// and the rule that decides the version cannot drift apart.
//
//   node scripts/pr-title.mjs --check "feat(button): add a loading state"   # exit 0 / 1
//   node scripts/pr-title.mjs --bump  "feat(button): add a loading state"   # -> minor
//   node scripts/pr-title.mjs --selftest                                    # pnpm verify:title
//
// This script decides published version numbers, so being wrong here is worse than being wrong
// almost anywhere else in the repo: it is silent. --selftest runs from `pnpm check` for that
// reason.

import { readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const PKG_JSON = join(REPO_ROOT, "packages", "ui", "package.json")

// Type -> the release it causes. `null` means the PR merges and publishes nothing: a README fix
// should not ship a new version whose dist/ is byte-identical to the last one.
const TYPES = {
  feat: "minor",
  fix: "patch",
  perf: "patch",
  refactor: null,
  revert: null,
  build: null,
  chore: null,
  ci: null,
  docs: null,
  style: null,
  test: null,
}

// The title becomes the squash commit subject, and GitHub appends " (#123)" to it.
const MAX_TITLE = 72

const TITLE =
  /^(?<type>[a-z]+)(?:\((?<scope>[a-z0-9][a-z0-9-]*)\))?(?<breaking>!)?: (?<subject>.*)$/

const GUIDANCE = `Pull request titles follow Conventional Commits, because merging derives the
version bump from the title:

  feat: …               new component, prop or variant        -> minor release
  fix: … / perf: …      bug fix or performance fix            -> patch release
  build/chore/ci/docs/refactor/revert/style/test: …           -> no release

  Optional scope:    fix(dialog): restore focus on close
  Breaking change:   feat!: require React 20   (add "!" after the type)

Examples of titles that pass:
  feat(button): add a loading state
  fix: stop Dialog stealing focus from the trigger
  docs: document the release workflow`

function lowerFirst(text) {
  return text.charAt(0).toLowerCase() + text.slice(1)
}

// Distinguishes the common near-misses, so the failure tells a contributor what to change rather
// than just restating the pattern they already failed to match.
function explain(raw) {
  const head = raw.split(":")[0]
  if (!raw.includes(":")) return `Missing the "type: " prefix — try "fix: ${lowerFirst(raw)}".`
  if (/^[A-Z]/.test(raw))
    return `The type is lowercase: write "${lowerFirst(head)}:", not "${head}:".`
  if (/^[a-z]+(?:\([^)]*\))?!?:\S/.test(raw))
    return 'Add a space after the colon: "type: description".'
  if (/^[a-z]+\([^)]*\)/.test(raw))
    return 'The scope is lowercase letters, digits or dashes, e.g. "feat(button): …".'
  return `Could not parse "${raw}". Expected "type(optional-scope)!: description".`
}

export function parse(title) {
  const raw = typeof title === "string" ? title.trim() : ""
  if (!raw) return { ok: false, error: "The pull request title is empty." }
  if (raw.length > MAX_TITLE)
    return {
      ok: false,
      error: `Title is ${raw.length} characters; keep it to ${MAX_TITLE} or fewer.`,
    }

  const match = TITLE.exec(raw)
  if (!match) return { ok: false, error: explain(raw) }

  const { type, scope, breaking, subject } = match.groups
  if (!(type in TYPES))
    return {
      ok: false,
      error: `Unknown type "${type}". Allowed: ${Object.keys(TYPES).join(", ")}.`,
    }
  if (!subject.trim()) return { ok: false, error: 'The description after ": " is empty.' }
  if (subject.endsWith("."))
    return { ok: false, error: "Drop the trailing period from the description." }

  return { ok: true, type, scope: scope ?? null, breaking: Boolean(breaking), subject }
}

// A breaking change while the package is still 0.x bumps the minor, not the major: a single "!" in
// a PR title should not be able to declare this library stable at 1.0.0 by accident. Once it is
// past 1.0.0, "!" means major.
export function bumpFor(title, currentVersion) {
  const parsed = parse(title)
  if (!parsed.ok) throw new Error(parsed.error)
  if (parsed.breaking) {
    const major = Number.parseInt(String(currentVersion).split(".")[0], 10)
    return major === 0 ? "minor" : "major"
  }
  return TYPES[parsed.type] ?? "none"
}

function currentVersion() {
  return JSON.parse(readFileSync(PKG_JSON, "utf8")).version
}

function fail(message) {
  if (process.env.GITHUB_ACTIONS) console.log(`::error::${message}`)
  console.error(`\n  ${message}\n\n${GUIDANCE}\n`)
  process.exit(1)
}

// --- self-test ----------------------------------------------------------------------------------
// Each case is [title, version, expected], where expected is a bump or "invalid".
const CASES = [
  ["feat: add a Tooltip component", "0.1.0", "minor"],
  ["feat(button): add a loading state", "0.1.0", "minor"],
  ["fix: restore focus on close", "0.1.0", "patch"],
  ["perf: memoise the class-name merge", "0.1.0", "patch"],
  ["refactor: split the token stylesheet", "0.1.0", "none"],
  ["revert: restore the previous focus ring", "0.1.0", "none"],
  ["build: switch the bundler to tsdown", "0.1.0", "none"],
  ["chore(deps): bump vite to 7.1", "0.1.0", "none"],
  ["ci: run the package check on pull requests", "0.1.0", "none"],
  ["docs: document the release workflow", "0.1.0", "none"],
  ["style: run Prettier over the stylesheets", "0.1.0", "none"],
  ["test: cover the Dialog focus trap", "0.1.0", "none"],
  // "!" is a breaking change: minor while 0.x, major afterwards.
  ["feat!: require React 20", "0.1.0", "minor"],
  ["feat!: require React 20", "1.4.2", "major"],
  ["fix!: rename the size prop", "2.0.0", "major"],
  // A breaking change wins even on a type that would not otherwise release.
  ["chore!: drop Node 20 support", "1.0.0", "major"],
  // Invalid forms.
  ["add a tooltip", "0.1.0", "invalid"],
  ["Feat: add a tooltip", "0.1.0", "invalid"],
  ["feat:no space after the colon", "0.1.0", "invalid"],
  ["feat: ", "0.1.0", "invalid"],
  ["feat: ends with a period.", "0.1.0", "invalid"],
  ["feature: add a tooltip", "0.1.0", "invalid"],
  ["feat(Button): add a loading state", "0.1.0", "invalid"],
  ["", "0.1.0", "invalid"],
  [`feat: ${"x".repeat(MAX_TITLE)}`, "0.1.0", "invalid"],
]

function selftest() {
  const failures = []
  for (const [title, version, expected] of CASES) {
    let actual
    try {
      actual = bumpFor(title, version)
    } catch {
      actual = "invalid"
    }
    const line = `${expected.padEnd(7)} ${JSON.stringify(title)} at ${version}`
    if (actual === expected) console.log(`  ok    ${line}`)
    else failures.push(`  FAIL  ${line} — got ${actual}`)
  }
  // Guards the table itself: a type added to TYPES without a case here would go untested.
  const covered = new Set(
    CASES.map(([t]) => parse(t))
      .filter((p) => p.ok)
      .map((p) => p.type),
  )
  const untested = Object.keys(TYPES).filter((type) => !covered.has(type))
  if (untested.length) failures.push(`  FAIL  no self-test case covers: ${untested.join(", ")}`)

  if (failures.length) {
    console.error(`\n${failures.join("\n")}\n\n${failures.length} case(s) failed.`)
    process.exit(1)
  }
  console.log(`\nAll ${CASES.length} title cases behave as expected.`)
}

// --- CLI ----------------------------------------------------------------------------------------
const [flag, value] = process.argv.slice(2)

switch (flag) {
  case "--selftest":
    selftest()
    break

  case "--check": {
    const parsed = parse(value)
    if (!parsed.ok) fail(parsed.error)
    const bump = bumpFor(value, currentVersion())
    const effect = bump === "none" ? "no release" : `a ${bump} release`
    console.log(`"${value.trim()}" is a valid title — merging it causes ${effect}.`)
    break
  }

  case "--bump": {
    const parsed = parse(value)
    if (!parsed.ok) fail(parsed.error)
    // Bare word on stdout so a workflow can capture it directly.
    console.log(bumpFor(value, currentVersion()))
    break
  }

  default:
    console.error(
      "Usage: pr-title.mjs --check <title> | --bump <title> | --selftest\n\n" + GUIDANCE,
    )
    process.exit(1)
}
