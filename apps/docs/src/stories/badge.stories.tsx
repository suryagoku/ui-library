import type { Meta, StoryObj } from "@storybook/react-vite"
import { ArrowRightIcon, CheckIcon, CircleAlertIcon, ClockIcon } from "lucide-react"

import { Badge } from "@suryagoku/ui"

const VARIANTS = ["default", "secondary", "destructive", "outline", "ghost", "link"] as const

const meta = {
  title: "Components/Badge",
  component: Badge,
  tags: ["autodocs"],
  args: {
    children: "Badge",
  },
  argTypes: {
    variant: {
      control: "select",
      options: VARIANTS,
      description: "Visual style.",
      table: { defaultValue: { summary: "default" } },
    },
    render: {
      control: false,
      description:
        'Swaps the underlying element, e.g. `render={<a href="…" />}`. Defaults to a `<span>`.',
    },
  },
} satisfies Meta<typeof Badge>

export default meta

type Story = StoryObj<typeof meta>

/** Drive every prop from the Controls panel. */
export const Playground: Story = {}

export const AllVariants: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      {VARIANTS.map((variant) => (
        <Badge key={variant} variant={variant}>
          {variant}
        </Badge>
      ))}
    </div>
  ),
}

/**
 * Icon padding is driven by `data-icon` on the icon itself — the base styles include
 * `has-data-[icon=inline-start]:pl-1.5` / `has-data-[icon=inline-end]:pr-1.5`, which tightens the
 * padding on whichever side the icon sits. Icons are sized to `size-3` automatically.
 */
export const WithIcon: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge>
        <CheckIcon data-icon="inline-start" />
        Verified
      </Badge>
      <Badge variant="secondary">
        <ClockIcon data-icon="inline-start" />
        Pending
      </Badge>
      <Badge variant="destructive">
        <CircleAlertIcon data-icon="inline-start" />
        Failed
      </Badge>
      <Badge variant="outline">
        Changelog
        <ArrowRightIcon data-icon="inline-end" />
      </Badge>
    </div>
  ),
}

/**
 * A badge is a `<span>` by default, so it has no hover state. Pass an element to `render` to make
 * it a link — the hover styles are scoped to `[a&]`, so they only apply once it really is an
 * anchor.
 */
export const AsLink: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge render={<a href="#badge" />}>Default link</Badge>
      <Badge variant="secondary" render={<a href="#badge" />}>
        Secondary link
      </Badge>
      <Badge variant="outline" render={<a href="#badge" />}>
        Outline link
      </Badge>
      <Badge variant="link" render={<a href="#badge" />}>
        Read the docs
      </Badge>
    </div>
  ),
}

/** `aria-invalid` turns on the destructive border and ring. */
export const Invalid: Story = {
  args: { "aria-invalid": true, children: "Invalid" },
}

/**
 * Two common shapes built from `className` alone: a status dot, and a numeric count squared off to
 * a circle.
 */
export const StatusAndCount: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge variant="outline">
        <span className="size-1.5 rounded-full bg-emerald-500" />
        Operational
      </Badge>
      <Badge variant="outline">
        <span className="size-1.5 rounded-full bg-amber-500" />
        Degraded
      </Badge>
      <Badge className="size-5 px-0 tabular-nums">8</Badge>
      <Badge variant="secondary" className="tabular-nums">
        99+
      </Badge>
    </div>
  ),
}

/** Long labels do not wrap — the badge grows to fit, and truncation is the caller's choice. */
export const Truncated: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div className="flex max-w-48 flex-col items-start gap-3">
      <Badge variant="secondary">deploy/production-europe-west-1</Badge>
      <Badge variant="secondary" className="max-w-full">
        <span className="truncate">deploy/production-europe-west-1</span>
      </Badge>
    </div>
  ),
}
