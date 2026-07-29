import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"

import { Input } from "@suryagoku/ui"

const meta = {
  title: "Components/Input",
  component: Input,
  tags: ["autodocs"],
  args: {
    placeholder: "Enter your email",
  },
  argTypes: {
    type: {
      control: "select",
      options: ["text", "email", "password", "number", "search", "tel", "url", "date", "file"],
    },
    disabled: { control: "boolean" },
    readOnly: { control: "boolean" },
    defaultValue: { control: "text", description: "Initial value. Use when uncontrolled." },
    value: {
      control: false,
      description: "Controlled value. Pair with `onValueChange`.",
    },
    onValueChange: {
      description:
        "Base UI's change callback — receives the new string directly, not an event. " +
        "Prefer it over `onChange`.",
    },
  },
} satisfies Meta<typeof Input>

export default meta

type Story = StoryObj<typeof meta>

/** Drive every prop from the Controls panel. */
export const Playground: Story = {}

/**
 * The component forwards `type` to the underlying `<input>`, so every native type works and
 * inherits the same styling.
 */
export const Types: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div className="grid max-w-sm gap-4">
      {(
        [
          ["email", "team@company.com"],
          ["password", "••••••••"],
          ["number", "42"],
          ["search", "Search components"],
          ["url", "https://example.com"],
          ["date", ""],
        ] as const
      ).map(([type, placeholder]) => (
        <label key={type} className="grid gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">{type}</span>
          <Input type={type} placeholder={placeholder} />
        </label>
      ))}
    </div>
  ),
}

/** File inputs get dedicated styling via the `file:` variants in the base class list. */
export const File: Story = {
  args: { type: "file" },
}

/** Uses `defaultValue` rather than `value`, so the input stays uncontrolled. */
export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: "disabled@example.com",
  },
}

/** Readable and selectable, but not editable — unlike `disabled`, it stays focusable. */
export const ReadOnly: Story = {
  args: {
    readOnly: true,
    defaultValue: "read-only@example.com",
  },
}

/** `aria-invalid` switches the border and focus ring to the destructive token. */
export const Invalid: Story = {
  args: {
    "aria-invalid": true,
    defaultValue: "not-an-email",
  },
}

/**
 * Base UI exposes `onValueChange(value, details)`, which hands you the string directly — no
 * `event.target.value` needed. Type in the field to see the state update.
 */
export const Controlled: Story = {
  parameters: { layout: "padded" },
  render: function ControlledInput() {
    const [value, setValue] = useState("")

    return (
      <div className="grid max-w-sm gap-3">
        <Input
          placeholder="Type something…"
          value={value}
          onValueChange={(next) => setValue(next)}
        />
        <p className="text-sm text-muted-foreground">
          Value:{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{value || "(empty)"}</code>
        </p>
      </div>
    )
  },
}
