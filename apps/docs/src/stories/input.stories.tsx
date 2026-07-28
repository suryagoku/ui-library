import type { Meta, StoryObj } from "@storybook/react-vite"

import { Input } from "@my-org/ui"

const meta = {
  title: "Components/Input",
  component: Input,
  args: {
    placeholder: "Enter your email",
  },
} satisfies Meta<typeof Input>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Disabled: Story = {
  args: {
    disabled: true,
    value: "disabled@example.com",
  },
}
