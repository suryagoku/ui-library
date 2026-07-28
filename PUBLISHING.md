# Verifying and publishing `@my-org/ui`

How to check the built package locally before you ship it, and how to publish it.

Every command here is run from the repository root unless stated otherwise, and every step
assumes `nvm use` (Node 22+) — see [README.md](README.md#1-prerequisites).

> **Before your first publish:** `@my-org` is a placeholder scope. You cannot publish to a scope
> you don't own, so rename it first — see [Choosing a name and scope](#0-choosing-a-name-and-scope).

---

## What actually gets published

Only `dist/` ships. That is set by two fields in
[packages/ui/package.json](packages/ui/package.json):

```json
"files": ["dist"],
"exports": {
  ".": { "types": "./dist/index.d.mts", "import": "./dist/index.mjs" },
  "./styles.css": "./dist/styles.css"
}
```

`files` controls what goes into the tarball; `exports` controls what consumers are allowed to
import. Together they give consumers exactly two entry points:

| Consumer writes                       | Gets                                             |
| ------------------------------------- | ------------------------------------------------ |
| `import { Button } from "@my-org/ui"` | `dist/index.mjs` (types from `dist/index.d.mts`) |
| `import "@my-org/ui/styles.css"`      | `dist/styles.css`                                |

Anything not listed in `exports` is unreachable, even though it exists in the tarball. That is
deliberate — it keeps `src/` internals from becoming accidental API.

### Inspect the tarball

```bash
# List what would ship, without writing a file
cd packages/ui && npm pack --dry-run

# Or build a real tarball and look inside it
pnpm --filter @my-org/ui pack --pack-destination /tmp
tar -tzf /tmp/my-org-ui-0.1.0.tgz
```

You should see exactly this — five entries, nothing from `src/`:

```
package/dist/index.d.mts
package/dist/index.mjs
package/dist/index.mjs.map
package/dist/styles.css
package/package.json
```

If you see `src/` or test files, `files` has drifted. If `dist/` is missing entirely, the build
didn't run.

---

## Pre-flight checklist

`packages/ui` has a `prepack` script (`pnpm run build`), so **`pnpm pack` and `pnpm publish`
always rebuild first**. That guard exists because a stale `dist/` is the easiest way to publish a
broken package: it installs fine and imports fine, but silently exports the wrong things.

Still worth checking by hand before a release:

```bash
# 1. Bump the version
#    edit "version" in packages/ui/package.json

# 2. Clean build from scratch
rm -rf packages/ui/dist
pnpm --filter @my-org/ui build

# 3. Confirm the export surface is complete (expect 13 names today)
grep -o 'export {[^}]*}' packages/ui/dist/index.mjs

# 4. Confirm the stylesheet actually compiled
head -c 64 packages/ui/dist/styles.css      # → /*! tailwindcss v4.3.3 ... */
grep -c '@tailwind' packages/ui/dist/styles.css   # → 0  (a literal @tailwind means Tailwind never ran)

# 5. Everything else is green
pnpm check                                  # lint + format + typecheck
```

---

## Checking locally

Four methods, in increasing fidelity to a real install. Use the lightest one that answers your
question.

### A. Through the docs app — fastest

The docs app normally aliases `@my-org/ui` to **source** for hot reload, so it does not exercise
the build at all. To test the built output instead, temporarily point the alias at `dist` in
[apps/docs/vite.config.ts](apps/docs/vite.config.ts):

```diff
 {
   find: "@my-org/ui",
-  replacement: path.resolve(__dirname, "../../packages/ui/src/index.ts"),
+  replacement: path.resolve(__dirname, "../../packages/ui/dist/index.mjs"),
 },
```

Then `pnpm --filter @my-org/ui build && pnpm dev:docs`. Good for catching "it works in source but
the bundle is broken". **Revert the alias afterwards** or you lose hot reload.

### B. Pack and install the tarball — recommended

This is byte-for-byte what npm would serve, so it catches missing `files` entries, wrong
`exports`, and bad type paths. Nothing is published anywhere.

```bash
# 1. Build a tarball (prepack rebuilds dist for you)
pnpm --filter @my-org/ui pack --pack-destination /tmp

# 2. In a scratch project somewhere outside this repo
mkdir /tmp/consumer && cd /tmp/consumer
npm init -y && npm pkg set type=module
npm install /tmp/my-org-ui-0.1.0.tgz react@^19 react-dom@^19

# 3. Prove the contract holds
node --input-type=module -e "import * as UI from '@my-org/ui'; console.log(Object.keys(UI))"
```

That should print all 13 exports. To check the stylesheet subpath and the types too:

```bash
node --input-type=module -e "
  import { createRequire } from 'node:module'
  console.log(createRequire(import.meta.url).resolve('@my-org/ui/styles.css'))"
```

For a real UI smoke test, scaffold a Vite React app instead
(`npm create vite@latest consumer -- --template react-ts`), install the tarball there, import
`@my-org/ui/styles.css` in `main.tsx`, and render a `<Button>`. Remember the consumer needs its
own Tailwind setup only if _it_ uses Tailwind classes — the library's own styles arrive
pre-compiled in `styles.css`.

Reinstalling after a rebuild needs the cache bypassed, since the filename doesn't change:

```bash
npm install /tmp/my-org-ui-0.1.0.tgz --force
```

### C. `pnpm link` — for iterative work

Use this when you're changing the library and an external app in the same sitting. It symlinks
the package, so edits show up without repacking.

**pnpm 10 has no `--global` flag** (older guides show `pnpm link --global`; that is gone):

```bash
# Option 1 — via the global store
cd packages/ui && pnpm link          # register this package globally
cd /path/to/your-app && pnpm link @my-org/ui

# Option 2 — link a directory directly, no global step
cd /path/to/your-app
pnpm link ../ui-library/packages/ui
```

Undo with `pnpm unlink @my-org/ui` in the consumer.

Three caveats, in order of how likely they are to bite:

1. **Duplicate React → `Invalid hook call`.** `react` and `react-dom` are _peer_ dependencies
   here. A symlinked package resolves them from its own tree, so your app and the library can end
   up with two React copies — which crashes on the first hook. Fix it in the consumer's Vite
   config:

   ```ts
   export default defineConfig({
     resolve: { dedupe: ["react", "react-dom"] },
   })
   ```

   For non-Vite consumers, alias `react` and `react-dom` to the app's own copies.

2. **A linked package's dependencies are not installed for you.** Run `pnpm install` inside
   `packages/ui` first, or its imports of `@base-ui/react` etc. will fail to resolve.

3. **`pnpm link` bypasses `files` and `exports` enforcement in some setups**, so it will happily
   let you import things a real consumer cannot. pnpm's own docs recommend the `file:` protocol
   over linking when peer dependencies are involved:

   ```bash
   pnpm add file:../ui-library/packages/ui
   ```

   Use method B before you believe a link-based test.

### D. A local registry — full publish rehearsal

The only way to exercise `npm publish` itself — auth, registry resolution, version conflicts —
without touching a real registry. [Verdaccio](https://verdaccio.org) runs a throwaway one.

```bash
# 1. Start it (terminal 1)
pnpm dlx verdaccio@6 --listen 4873

# 2. Create a throwaway user (terminal 2)
npm adduser --registry http://localhost:4873

# 3. Publish to it — --no-git-checks because pnpm otherwise refuses a dirty tree
pnpm --filter @my-org/ui publish \
  --registry http://localhost:4873 --no-git-checks

# 4. Install from it, exactly like a consumer would
mkdir /tmp/consumer && cd /tmp/consumer && npm init -y
npm install @my-org/ui --registry http://localhost:4873
```

Browse <http://localhost:4873> to see the published package and its README. Stop Verdaccio and
delete `~/.config/verdaccio/storage` when you're finished, so a test version never lingers.

This is also the safest way to rehearse a **version bump**: publish `0.1.1` and confirm the
consumer picks it up.

It is worth rehearsing a republish here too, because **pnpm and npm behave differently** when the
version already exists:

```bash
pnpm --filter @my-org/ui publish --no-git-checks --registry http://localhost:4873
# → "There are no new packages that should be published"   exit code 0

npm publish --registry http://localhost:4873
# → npm error code E409 / 409 Conflict - this package is already present   exit code 1
```

`pnpm publish` checks the registry first and **skips silently with a success exit code**. That
matters in CI: a release job using `pnpm publish` will go green even when it published nothing, so
assert the version actually changed rather than trusting the exit code.

---

## Publishing

### 0. Choosing a name and scope

`@my-org/ui` will fail against any real registry, because scopes are owned. Pick the scope you
actually control and rename it in **both** places:

```bash
# packages/ui/package.json — the package's own name
"name": "@your-scope/ui"
```

`apps/docs` depends on it by name, so update that too:

```bash
# apps/docs/package.json
"@your-scope/ui": "workspace:*"
```

Then update the aliases in [apps/docs/vite.config.ts](apps/docs/vite.config.ts), the `paths` in
`apps/docs/tsconfig*.json`, and the imports in `src/` and `src/stories/`. A single
find-and-replace of `@my-org/ui` across the repo covers all of it. Finish with `pnpm install`
so the workspace link is rewritten, then `pnpm check`.

While you're there, fill in the two fields npm expects and this package still lacks a real value
for:

```json
"license": "UNLICENSED",
"repository": { "type": "git", "url": "git+https://github.com/your-org/ui-library.git" }
```

`license` is already set to `UNLICENSED` (appropriate for an internal package — change it to
`MIT` or similar if you open-source it). `repository` is intentionally absent because this repo
has **no git remote configured yet**; add it once it does.

### 1. Rehearse

```bash
pnpm --filter @my-org/ui publish --dry-run --no-git-checks
```

Does everything except the upload. Always do this first.

### 2. Publish

Run it through pnpm from the workspace root so filtering works:

```bash
pnpm --filter @my-org/ui publish
```

Two things to know about `pnpm publish` specifically:

- **It refuses to publish from a dirty git tree or a non-default branch.** That is a feature —
  it stops you shipping uncommitted code. Override with `--no-git-checks` only when you mean it.
- It runs `prepack` for you, so `dist/` is always rebuilt from current source.

Now pick your registry.

#### Option 1 — public npm registry

```bash
npm login                                   # once per machine
pnpm --filter @my-org/ui publish --access public
```

**Scoped packages default to `restricted`**, which fails with `402 Payment Required` on a free
account. `--access public` is required — or make it permanent:

```json
"publishConfig": { "access": "public" }
```

#### Option 2 — GitHub Packages

The scope **must** match your GitHub org or username, so `@your-org/ui` for `github.com/your-org`.

Create a personal access token with the `write:packages` scope, then add a **user-level**
`~/.npmrc` (never commit a token):

```ini
@your-org:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Pin the registry in the package so nobody publishes to the wrong place by accident:

```json
"publishConfig": { "registry": "https://npm.pkg.github.com" }
```

```bash
export GITHUB_TOKEN=ghp_...
pnpm --filter @my-org/ui publish
```

Requires a `repository` field pointing at the same org, and a git remote. Consumers also need
the `@your-org:registry` line in their own `.npmrc` — GitHub Packages requires auth even to
_read_ private packages.

#### Option 3 — private registry (Verdaccio, Artifactory, Nexus)

```json
"publishConfig": { "registry": "https://npm.internal.example.com" }
```

```bash
npm config set //npm.internal.example.com/:_authToken "$NPM_TOKEN"
pnpm --filter @my-org/ui publish
```

Commit a repo-level `.npmrc` with the registry line (but **not** the token) so everyone resolves
from the same place:

```ini
@your-scope:registry=https://npm.internal.example.com
```

### 3. Verify the published result

```bash
npm view @your-scope/ui                     # version, files, dist-tags
npm view @your-scope/ui exports             # the entry points consumers get
```

Then install it in a scratch project, as in method B — against the real registry this time.

---

## Versioning

Semver, judged from the consumer's point of view:

| Change                                               | Bump                                         |
| ---------------------------------------------------- | -------------------------------------------- |
| New component, new optional prop, new variant        | **minor** (`0.1.0` → `0.2.0`)                |
| Bug fix, style tweak that doesn't change the API     | **patch** (`0.1.0` → `0.1.1`)                |
| Removed or renamed export, prop, or variant name     | **major**                                    |
| Renamed a design token in `tokens.css`               | **major** — consumers override these by name |
| Changed a peer dependency range (e.g. React 19 → 20) | **major**                                    |

Below `1.0.0`, npm treats a minor bump as potentially breaking anyway, so the cost of getting it
slightly wrong is low while you stabilise.

```bash
# Bump, build, tag
cd packages/ui && npm version patch          # or minor / major
cd ../.. && git commit -am "release: @my-org/ui $(node -p "require('./packages/ui/package.json').version")"
git tag "ui-v$(node -p "require('./packages/ui/package.json').version")"
```

Once more than one package here is published, switch to
[Changesets](https://github.com/changesets/changesets) — it handles cross-package version bumps
and generates changelogs, which manual bumping does not.

---

## Troubleshooting

**`ENEEDAUTH` / `401 Unauthorized`**
Not logged in for that registry. `npm login --registry <url>`, or check the `_authToken` line in
`~/.npmrc` matches the registry host exactly (including the leading `//` and trailing `/`).

**`402 Payment Required`**
A scoped package being published as private on a free npm account. Add `--access public`.

**`403 Forbidden`**
You don't own the scope — still `@my-org`? See
[Choosing a name and scope](#0-choosing-a-name-and-scope).

**`E409 Conflict` / `this package is already present`**
That exact version is already published, and registries never allow overwriting one. Bump the
version and publish again. Note this is the **npm** error — `pnpm publish` instead prints
"There are no new packages that should be published" and exits **0**, so a CI job can appear to
succeed while publishing nothing.

**`ERR_PNPM_GIT_UNCLEAN`**
`pnpm publish` found uncommitted changes. Commit them, or pass `--no-git-checks`.

**Published fine, but consumers get no components**
A stale `dist/`. Check with `npm view @your-scope/ui` and
`grep -o 'export {[^}]*}' node_modules/@your-scope/ui/dist/index.mjs` in the consumer — if it
only exports `cn`, the tarball predates the components. `prepack` now prevents this, but a
version published before it was added can still be out there. Bump and republish.

**Consumer gets `Invalid hook call`**
Two copies of React — see [method C](#c-pnpm-link--for-iterative-work). Almost always a linked
or `file:` install rather than a registry one.

**Consumer sees unstyled components**
They didn't `import "@your-scope/ui/styles.css"`. The library ships pre-compiled CSS; it is not
injected automatically.
