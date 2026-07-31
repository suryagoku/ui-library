import type { Meta, StoryObj } from "@storybook/react-vite"
import { ArrowRightIcon, MailIcon, PlusIcon, TrashIcon } from "lucide-react"

import { Button } from "@suryagoku/ui"

const VARIANTS = ["default", "outline", "secondary", "ghost", "destructive", "link"] as const
const SIZES = ["xs", "sm", "default", "lg"] as const
const ICON_SIZES = ["icon-xs", "icon-sm", "icon", "icon-lg"] as const

const meta = {
  title: "Components/Button",
  component: Button,
  tags: ["autodocs"],
  args: {
    children: "Button",
  },
  argTypes: {
    variant: {
      control: "select",
      options: VARIANTS,
      description: "Visual style.",
      table: { defaultValue: { summary: "default" } },
    },
    size: {
      control: "select",
      options: [...SIZES, ...ICON_SIZES],
      description: "Height and padding. The `icon-*` sizes are square, for icon-only buttons.",
      table: { defaultValue: { summary: "default" } },
    },
    disabled: { control: "boolean" },
    focusableWhenDisabled: {
      control: "boolean",
      description: "Keep the button in the tab order while disabled, so screen readers reach it.",
    },
    nativeButton: {
      control: "boolean",
      description: "Set false when `render` swaps in a non-button element (e.g. an `<a>`).",
    },
  },
} satisfies Meta<typeof Button>

export default meta

type Story = StoryObj<typeof meta>

/** Drive every prop from the Controls panel. */
export const Playground: Story = {}

export const AllVariants: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      {VARIANTS.map((variant) => (
        <Button key={variant} variant={variant}>
          {variant}
        </Button>
      ))}
    </div>
  ),
}

export const AllSizes: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        {SIZES.map((size) => (
          <Button key={size} size={size}>
            {size}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {ICON_SIZES.map((size) => (
          <Button key={size} size={size} aria-label={size}>
            <PlusIcon />
          </Button>
        ))}
      </div>
    </div>
  ),
}

/**
 * Icon padding is driven by `data-icon` on the icon itself — the base styles include
 * `has-data-[icon=inline-start]:pl-2` / `has-data-[icon=inline-end]:pr-2`, which tightens the
 * padding on whichever side the icon sits.
 */
export const WithIcons: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button>
        <MailIcon data-icon="inline-start" />
        Email us
      </Button>
      <Button variant="outline">
        Continue
        <ArrowRightIcon data-icon="inline-end" />
      </Button>
      <Button variant="destructive">
        <TrashIcon data-icon="inline-start" />
        Delete
      </Button>
    </div>
  ),
}

/** Icon-only buttons still need an accessible name — use `aria-label`. */
export const IconOnly: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="icon" aria-label="Add item">
        <PlusIcon />
      </Button>
      <Button size="icon" variant="outline" aria-label="Delete item">
        <TrashIcon />
      </Button>
      <Button size="icon" variant="ghost" aria-label="Compose mail">
        <MailIcon />
      </Button>
    </div>
  ),
}

/**
 * `focusableWhenDisabled` keeps a disabled button reachable by keyboard, so assistive tech can
 * announce why it is unavailable. Plain `disabled` removes it from the tab order.
 */
export const Disabled: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button disabled>Disabled</Button>
      <Button disabled variant="outline">
        Disabled outline
      </Button>
      <Button disabled focusableWhenDisabled>
        Disabled but focusable
      </Button>
    </div>
  ),
}

/** `aria-invalid` turns on the destructive ring, for buttons that submit an invalid form. */
export const Invalid: Story = {
  args: { "aria-invalid": true, children: "Submit" },
}

/**
 * `render` swaps the underlying element. Pass `nativeButton={false}` so Base UI knows it is no
 * longer a real `<button>` and applies link semantics instead.
 */
export const AsLink: Story = {
  render: () => (
    <Button
      variant="link"
      nativeButton={false}
      render={<a href="https://base-ui.com" target="_blank" rel="noreferrer" />}
    >
      Base UI docs
      <ArrowRightIcon data-icon="inline-end" />
    </Button>
  ),
}
