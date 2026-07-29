# UI Library

Shared React component library and design system for internal web applications.

**New here? Jump to [Getting started](#getting-started).**

## Goals

- Reusable React components
- Shared design tokens
- Storybook documentation
- Private npm package for internal applications

## Tech Stack

- React 19
- TypeScript 5.9
- Tailwind CSS v4
- Base UI (unstyled primitives) + shadcn/ui (`base-nova` style)
- Storybook 10
- Vite 7
- pnpm Workspaces
- tsdown (library bundler)

## Repository Structure

This is a **monorepo**: one repo holding several packages that reference each other.

```
ui-library/
├─ packages/ui/              @suryagoku/ui — the component library (this is what ships)
│  ├─ src/
│  │  ├─ components/         one file per component: button.tsx, input.tsx, dialog.tsx
│  │  ├─ lib/utils.ts        cn() + mergeClassName() class-name helpers
│  │  ├─ styles/
│  │  │  ├─ globals.css      the stylesheet entry — imports everything below
│  │  │  ├─ tokens.css       design tokens (colours, radii, fonts) + dark theme
│  │  │  ├─ utilities.css    custom Tailwind @utility rules
│  │  │  └─ animations.css   custom keyframes
│  │  └─ index.ts            the public API — a component is not exported until it is listed here
│  ├─ components.json        shadcn CLI config
│  ├─ tsdown.config.ts       library build config
│  └─ dist/                  build output (git-ignored)
│
├─ apps/docs/                @my-org/docs — private playground, never published
│  ├─ src/App.tsx            the demo page you see at localhost:5173
│  ├─ src/stories/           Storybook stories
│  ├─ .storybook/            Storybook config
│  └─ vite.config.ts         dev server + workspace aliases + Tailwind plugin
│
├─ tsconfig.base.json        TypeScript options shared by every package
├─ pnpm-workspace.yaml       tells pnpm that apps/* and packages/* are workspace packages
└─ .nvmrc                    the Node version this repo expects
```

`apps/docs` exists so you can see and test your components. It consumes `@suryagoku/ui`
exactly the way a real downstream app would — through the package's public exports.

---

## Getting started

### 1. Prerequisites

**Node 22.12 or newer.** The build tools use APIs that do not exist in older versions, and
Node 21 and below will fail with confusing errors. If you use [nvm](https://github.com/nvm-sh/nvm),
the repo pins the version for you:

```bash
nvm use          # reads .nvmrc
node -v          # expect v22.x or newer
```

If you don't have Node 22 yet: `nvm install 22`.

**pnpm 10.** This repo uses pnpm, not npm or yarn. The version is pinned in `package.json`
(`"packageManager": "pnpm@10.20.0"`) and Corepack — which ships with Node — will fetch it
automatically:

```bash
corepack enable pnpm
pnpm --version   # expect 10.20.0
```

If that errors, your Corepack is too old: `npm i -g corepack@latest`, then try again.

> Do not run `npm install` in this repo. It would ignore `pnpm-lock.yaml` and the workspace
> links, and produce a broken `node_modules`.

### 2. Install

```bash
pnpm install
```

This installs dependencies for **all** packages at once and links `@suryagoku/ui` into
`apps/docs`. You only need to re-run it when dependencies change.

> You may see `Ignored build scripts: esbuild.` — that is expected and recorded in
> `package.json`. esbuild works without its install script here.

### 3. Run something

```bash
pnpm dev:docs        # demo page   → http://localhost:5173
pnpm dev:storybook   # Storybook   → http://localhost:6006
```

Both support hot reload: save a file in `packages/ui/src` and the browser updates
immediately. You do **not** need to build the library first — see below for why.

---

## Everyday commands

Run all of these from the repository root.

| Command                                 | What it does                                             |
| --------------------------------------- | -------------------------------------------------------- |
| `pnpm install`                          | Install/update dependencies for every package            |
| `pnpm dev:docs`                         | Vite dev server for the demo page (port 5173)            |
| `pnpm dev:storybook`                    | Storybook dev server (port 6006)                         |
| `pnpm build`                            | Build every package (library, then docs app)             |
| `pnpm build:storybook`                  | Build static Storybook into `apps/docs/storybook-static` |
| `pnpm --filter @suryagoku/ui typecheck` | Typecheck the library only                               |
| `pnpm --filter @suryagoku/ui build`     | Build the library only (`dist/`)                         |
| `pnpm --filter @my-org/docs preview`    | Serve the production docs build locally                  |

`--filter` is how pnpm targets one package in a monorepo. `@suryagoku/ui` and `@my-org/docs`
are the package names from their `package.json` files.

### Why you don't need to build the library during development

In production, `import { Button } from "@suryagoku/ui"` resolves to the compiled
`packages/ui/dist/index.mjs`. That would mean rebuilding after every edit.

So for development, [apps/docs/vite.config.ts](apps/docs/vite.config.ts) aliases the package
straight to the **source**:

| Import in your code        | Resolves to, during dev              |
| -------------------------- | ------------------------------------ |
| `@suryagoku/ui`            | `packages/ui/src/index.ts`           |
| `@suryagoku/ui/styles.css` | `packages/ui/src/styles/globals.css` |
| `@/…`                      | `apps/docs/src/…`                    |

That's why hot reload works across package boundaries. `pnpm build` is only needed to check
the real published output, or before publishing.

---

## Using the components

```tsx
import { Button, Input, Dialog, DialogTrigger, DialogContent, DialogTitle } from "@suryagoku/ui"
import "@suryagoku/ui/styles.css" // once, at your app's entry point

export function Example() {
  return (
    <div className="space-y-4">
      <Button>Save</Button>
      <Button variant="outline" size="sm">
        Cancel
      </Button>
      <Input type="email" placeholder="you@company.com" />

      <Dialog>
        <DialogTrigger render={<Button />}>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Hello</DialogTitle>
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

**Button** — `variant`: `default` `outline` `secondary` `ghost` `destructive` `link`.
`size`: `default` `xs` `sm` `lg` `icon` `icon-xs` `icon-sm` `icon-lg`.

**Dialog** — composed from parts: `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`,
`DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogClose`, `DialogOverlay`,
`DialogPortal`.

### The `render` prop

Components are built on [Base UI](https://base-ui.com), so instead of a `asChild`-style
wrapper you pass an element to `render` to swap the underlying tag:

```tsx
<DialogTrigger render={<Button variant="outline" />}>Open</DialogTrigger>
```

This makes the trigger _be_ a `Button` rather than a button inside a button.

### Every component accepts `className`

Your classes are merged with the component's own, and yours win on conflicts (that's
`tailwind-merge` in [lib/utils.ts](packages/ui/src/lib/utils.ts)):

```tsx
<Button className="w-full">Full width</Button> // overrides the default width
```

---

## Design tokens and theming

Colours, radii, spacing and fonts live in one place:
[packages/ui/src/styles/tokens.css](packages/ui/src/styles/tokens.css).

```css
:root {
  --background: oklch(1 0 0);
  --primary: oklch(0.205 0 0);
  --radius-lg: 0.75rem;
  /* … */
}
```

Each token is exposed to Tailwind through the `@theme inline` block below it, which is what
turns `--primary` into utilities like `bg-primary` and `text-primary-foreground`.

**To restyle the whole system, edit the token values** — do not touch individual components.

### Prefer token utilities over raw `var()`

```tsx
<div className="bg-card text-muted-foreground border-border">   ✅
<div className="bg-[var(--color-card)]">                        ⚠️  works, but avoid
```

Both render the same thing, but the second only works while Tailwind happens to see that
exact `var()` text in a scanned file. The utility form has no such dependency.

### Dark mode

Add the `dark` class to the `<html>` element and every token flips:

```html
<html class="dark"></html>
```

The overrides are the `.dark { … }` block in `tokens.css`. Nothing else is wired up — there
is no theme toggle component yet, so a real app supplies its own.

---

## Adding a new component

### Option A — the shadcn CLI (fastest for standard components)

Run it **from inside `packages/ui`**, so files land in the library rather than the demo app:

```bash
cd packages/ui
pnpm exec shadcn add badge
```

Then complete the two things the CLI does not do:

1. **Export it** from [packages/ui/src/index.ts](packages/ui/src/index.ts) — until you do,
   `import { Badge } from "@suryagoku/ui"` will not resolve:

   ```ts
   export * from "./components/badge"
   ```

2. **Typecheck it**, since generated code occasionally needs a small adjustment:

   ```bash
   pnpm --filter @suryagoku/ui typecheck
   ```

### Option B — by hand

Copy the shape of an existing component. [input.tsx](packages/ui/src/components/input.tsx) is
the simplest example; [button.tsx](packages/ui/src/components/button.tsx) shows variants.

```tsx
// packages/ui/src/components/card.tsx
import { cn } from "../lib/utils"
import * as React from "react"

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn("rounded-xl border border-border bg-card p-6", className)}
      {...props}
    />
  )
}

export { Card }
```

House conventions:

- **One component family per file**, lower-case filename.
- **`data-slot="…"`** on the root element, so consumers can target parts in CSS.
- **`className` last** in the `cn()` call, so caller classes override defaults.
- **Import helpers relatively** (`../lib/utils`), matching the existing files.
- **Add the export** to `src/index.ts`.

### `cn` vs `mergeClassName`

Two helpers live in [lib/utils.ts](packages/ui/src/lib/utils.ts):

- **`cn(...)`** — merges class strings. Use it for plain HTML elements (`<div>`, `<span>`).
- **`mergeClassName(base, className)`** — use it when the element is a **Base UI primitive**.

Base UI lets callers pass `className` as a _function_ of component state
(`className={(state) => state.disabled ? "opacity-50" : ""}`). `cn()` cannot handle a
function — it would silently drop it and produce no class at all. `mergeClassName` resolves
the function against the state first, so both forms work.

Rule of thumb: if the JSX tag comes from `@base-ui/react/…`, use `mergeClassName`.

---

## Adding a story

Stories are the Storybook entries for a component. Put them in
[apps/docs/src/stories/](apps/docs/src/stories/) as `<name>.stories.tsx`:

```tsx
import type { Meta, StoryObj } from "@storybook/react-vite"
import { Badge } from "@suryagoku/ui"

const meta = { title: "Components/Badge", component: Badge } satisfies Meta<typeof Badge>
export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = { args: { children: "New" } }
```

Storybook picks up `../src/**/*.stories.@(ts|tsx)` automatically — no registration needed.
Each exported `Story` becomes one entry in the sidebar under `title`.

---

## Building and publishing the library

```bash
pnpm --filter @suryagoku/ui build
```

Two steps run in sequence, producing `packages/ui/dist/`:

| Step        | Tool    | Output                                 |
| ----------- | ------- | -------------------------------------- |
| `build:js`  | tsdown  | `index.mjs`, `index.d.mts`, sourcemaps |
| `build:css` | postcss | `styles.css` (compiled Tailwind)       |

Nothing is bundled into the output — `react`/`react-dom` are peer dependencies supplied by
the consuming app, and the runtime dependencies (`@base-ui/react`, `class-variance-authority`,
`clsx`, `tailwind-merge`, `lucide-react`) stay as plain imports that npm installs alongside
the package. That keeps `index.mjs` around 8 kB.

Consumers get exactly two entry points, declared in `packages/ui/package.json`:

```
@suryagoku/ui              → dist/index.mjs
@suryagoku/ui/styles.css   → dist/styles.css
```

**Before publishing**, bump `version` in `packages/ui/package.json`, run a clean build, and
sanity-check that everything you expect is exported:

```bash
pnpm --filter @suryagoku/ui build
grep -o 'export {[^}]*}' packages/ui/dist/index.mjs
```

A stale `dist/` that silently omits components is an easy mistake to ship. The package now has a
`prepack` script, so `pnpm pack` and `pnpm publish` always rebuild first.

> **See [PUBLISHING.md](PUBLISHING.md)** for the full guide: how to verify the built package
> locally (`pnpm pack`, `pnpm link`, or a throwaway local registry) and step-by-step publishing
> to npm, GitHub Packages, or a private registry.

---

## Troubleshooting

**`pnpm: command not found`, or Corepack throws `ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING`**
Your Corepack is older than the pinned pnpm. Fix: `npm i -g corepack@latest`, then
`corepack enable pnpm`.

**Any build fails with a strange `TypeError` from deep inside a tool**
Check `node -v` first. Node must be 22.12+; older versions fail in non-obvious ways (for
example rolldown calls `util.styleText` with an array, which only Node 22+ supports). Run
`nvm use`.

**`Cannot find native binding` (rolldown / esbuild / lightningcss)**
An interrupted install left a platform-specific binary unfetched. Fix:
`pnpm install --force`.

**The page loads but has no styling at all**
Tailwind isn't running. Check that `@tailwindcss/vite` is still in the `plugins` array of
[apps/docs/vite.config.ts](apps/docs/vite.config.ts). To confirm, look at the served CSS — if
it contains the literal text `@tailwind`, the compiler never ran.

**A component's classes have no effect, but other classes work**
Tailwind only generates classes it finds by scanning files. It scans from the Vite root
(`apps/docs`) plus the `@source "../"` declared in
[globals.css](packages/ui/src/styles/globals.css) for the library. A new source directory
outside both needs its own `@source` line.

**Edits to a `.tsx` file don't show up**
Look for a stale compiled `.js` next to it. Vite resolves `.js` before `.tsx`, so a leftover
`button.js` shadows `button.tsx`. Delete any `.js`/`.d.ts`/`.map` files under `src/` — nothing
there is hand-written. (The tsconfigs set `noEmit` to prevent this, so it should not recur.)

**`dark:` classes apply but the colours look wrong**
Make sure `class="dark"` is on `<html>`, not just on an inner element — the token overrides
are scoped to a `.dark` ancestor.

**Storybook shows no stories**
The file must match `*.stories.tsx` and live under `apps/docs/src/`.

---

## Not set up yet

So you don't go looking for these: there is no linter, no formatter config, and no test
runner in this repo. `pnpm --filter @suryagoku/ui typecheck` and the Storybook a11y addon are
the only automated checks today.
