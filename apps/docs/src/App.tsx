import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
} from "@my-org/ui"

export function App() {
  return (
    <main className="min-h-svh bg-background text-foreground">
      <section className="mx-auto flex min-h-svh max-w-6xl flex-col justify-center gap-10 px-6 py-16">
        <div className="space-y-4">
          <p className="text-sm tracking-[0.28em] text-muted-foreground uppercase">@my-org/ui</p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
            A reusable React 19 design system with Tailwind CSS v4 and Storybook 10.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            This docs app consumes the workspace package the same way a downstream application
            would: through the public exports and shared stylesheet.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,420px)]">
          <div className="rounded-[calc(var(--radius-lg)+0.25rem)] border border-border bg-card p-6 shadow-(--shadow-soft)">
            <div className="mb-6 space-y-2">
              <h2 className="text-2xl font-semibold">Foundation preview</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                The initial surface ships with Button, Input, and Dialog without wrapper
                abstractions.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button>Primary action</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
            </div>
          </div>

          <div className="rounded-[calc(var(--radius-lg)+0.25rem)] border border-border bg-card p-6 shadow-(--shadow-soft)">
            <div className="mb-6 space-y-2">
              <h2 className="text-2xl font-semibold">Quick sandbox</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Verify package imports, token usage, and interaction patterns in one place.
              </p>
            </div>

            <div className="space-y-4">
              <Input type="email" placeholder="team@company.com" />

              <Dialog>
                <DialogTrigger render={<Button className="w-full" />}>Open dialog</DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Library contract looks good</DialogTitle>
                    <DialogDescription>
                      The docs app is importing components and styles through
                      <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-xs">
                        @my-org/ui
                      </code>
                      without deep relative imports.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="secondary">Review later</Button>
                    <Button>Ship foundation</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
