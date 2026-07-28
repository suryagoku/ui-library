import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"

import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
} from "@my-org/ui"

const meta = {
  title: "Components/Dialog",
  component: Dialog,
  tags: ["autodocs"],
  argTypes: {
    open: { control: false, description: "Controlled open state. Pair with `onOpenChange`." },
    defaultOpen: { control: "boolean", description: "Initial open state when uncontrolled." },
    modal: {
      control: "select",
      options: [true, false, "trap-focus"],
      description:
        "`true` traps focus and locks page scroll. `false` leaves the page interactive. " +
        "`'trap-focus'` traps focus without locking scroll.",
      table: { defaultValue: { summary: "true" } },
    },
    disablePointerDismissal: {
      control: "boolean",
      description: "Prevent closing on an outside press.",
    },
  },
} satisfies Meta<typeof Dialog>

export default meta

type Story = StoryObj<typeof meta>

/** The standard composition. `DialogContent` renders its own close button by default. */
export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button />}>Open dialog</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite your team</DialogTitle>
          <DialogDescription>
            Everyone you invite gets read access to this workspace.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="secondary" />}>Cancel</DialogClose>
          <Button>Continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}

/**
 * `showCloseButton={false}` removes the corner ✕. Only do this when the footer offers another
 * way out — a modal with no visible dismiss is a keyboard-and-screen-reader trap.
 */
export const WithoutCloseButton: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>No corner close</DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Confirm deployment</DialogTitle>
          <DialogDescription>Pick an explicit action below to continue.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="secondary" />}>Not now</DialogClose>
          <Button>Deploy</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}

/** `DialogFooter` has its own `showCloseButton`, which appends a ready-made Close button. */
export const FooterCloseButton: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>Footer close button</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Release notes</DialogTitle>
          <DialogDescription>The footer supplies its own Close button.</DialogDescription>
        </DialogHeader>
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  ),
}

/** Drive open state from outside the component with `open` + `onOpenChange`. */
export const Controlled: Story = {
  parameters: { layout: "padded" },
  render: function ControlledDialog() {
    const [open, setOpen] = useState(false)

    return (
      <div className="grid gap-3">
        <p className="text-sm text-muted-foreground">
          External state:{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{String(open)}</code>
        </p>
        <div className="flex gap-2">
          <Button onClick={() => setOpen(true)}>Open from outside</Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close from outside
          </Button>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Controlled dialog</DialogTitle>
              <DialogDescription>
                There is no trigger inside this dialog — the buttons behind it own the state.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter showCloseButton />
          </DialogContent>
        </Dialog>
      </div>
    )
  },
}

/**
 * `modal={false}` leaves the rest of the page interactive and does not lock scroll — suitable
 * for non-blocking side panels. Try scrolling the page or clicking the field behind it.
 */
export const NonModal: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div className="grid max-w-sm gap-3">
      <Input placeholder="Still focusable while open" />
      <Dialog modal={false}>
        <DialogTrigger render={<Button variant="outline" />}>Open non-modal</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Non-modal</DialogTitle>
            <DialogDescription>
              The input behind this dialog still accepts focus and typing.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  ),
}

/** `modal="trap-focus"` keeps focus inside the dialog but leaves page scrolling enabled. */
export const TrapFocus: Story = {
  render: () => (
    <Dialog modal="trap-focus">
      <DialogTrigger render={<Button variant="outline" />}>Open trap-focus</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Focus is trapped</DialogTitle>
          <DialogDescription>
            Tab cycles within the dialog, but the page can still scroll.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  ),
}

/**
 * `disablePointerDismissal` ignores outside presses, so the dialog can only be dismissed
 * deliberately. Escape still works.
 */
export const PersistentOnOutsideClick: Story = {
  render: () => (
    <Dialog disablePointerDismissal>
      <DialogTrigger render={<Button variant="outline" />}>Open persistent</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Unsaved changes</DialogTitle>
          <DialogDescription>
            Clicking the backdrop will not close this. Choose an action.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="secondary" />}>Discard</DialogClose>
          <Button>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}

/** A form inside a dialog: submitting closes it via controlled state. */
export const WithForm: Story = {
  render: function DialogWithForm() {
    const [open, setOpen] = useState(false)
    const [email, setEmail] = useState("")

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button />}>Invite teammate</DialogTrigger>
        <DialogContent>
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault()
              setOpen(false)
            }}
          >
            <DialogHeader>
              <DialogTitle>Invite teammate</DialogTitle>
              <DialogDescription>They will receive an email invitation.</DialogDescription>
            </DialogHeader>

            <label className="grid gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Email</span>
              <Input
                type="email"
                required
                placeholder="teammate@company.com"
                value={email}
                onValueChange={setEmail}
              />
            </label>

            <DialogFooter>
              <DialogClose render={<Button variant="secondary" type="button" />}>
                Cancel
              </DialogClose>
              <Button type="submit">Send invite</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    )
  },
}

/** Long content scrolls inside the popup rather than growing past the viewport. */
export const LongContent: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>Open long dialog</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Terms of service</DialogTitle>
          <DialogDescription>Scroll to review all sections.</DialogDescription>
        </DialogHeader>
        <div className="max-h-64 space-y-3 overflow-y-auto text-sm text-muted-foreground">
          {Array.from({ length: 12 }, (_, index) => (
            <p key={index}>
              <strong className="text-foreground">Section {index + 1}.</strong> Placeholder copy to
              demonstrate the popup&apos;s internal scroll region while the surrounding page stays
              locked.
            </p>
          ))}
        </div>
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  ),
}
