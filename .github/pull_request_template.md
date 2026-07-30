<!--
  The title of this pull request is the release input. Merging derives the version bump from it,
  and the squash commit on main takes the title as its subject. The "PR title" check enforces it.

    feat: …             new component, prop or variant   -> minor release
    fix: … / perf: …    bug fix or performance fix       -> patch release
    build/chore/ci/docs/refactor/revert/style/test: …    -> merges, publishes nothing

    Optional scope:   fix(dialog): restore focus on close
    Breaking change:  feat!: require React 20

  Check what a title will do before you push:  pnpm bump-for "feat: add a Tooltip"
-->

## What changed

## Why

## Consumer impact

<!-- New or changed exports, props, variants or design tokens. "None" is a fine answer. -->

- [ ] `pnpm check` passes
- [ ] Storybook still shows the component correctly (`pnpm dev:storybook`)
