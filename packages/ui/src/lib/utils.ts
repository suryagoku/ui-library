import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * A Base UI `className` prop: either a string, or a function of the component's state.
 */
export type StatefulClassName<State> = string | ((state: State) => string | undefined) | undefined

/**
 * Merge base classes with a Base UI `className` prop, returning the state callback Base UI
 * expects. Needed because clsx treats a function as a plain object and drops it, so passing
 * the prop straight into `cn` would silently discard the callback form.
 */
export function mergeClassName<State>(base: ClassValue, className: StatefulClassName<State>) {
  return (state: State) => cn(base, typeof className === "function" ? className(state) : className)
}
