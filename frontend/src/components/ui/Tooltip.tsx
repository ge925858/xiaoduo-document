import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import type { ReactNode } from 'react'

export function Hint({
  label,
  children,
  side = 'bottom',
}: {
  label: string
  children: ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
}) {
  return (
    <TooltipPrimitive.Root delayDuration={450}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={6}
          className="z-[100] rounded-[5px] border border-[var(--line)] bg-[var(--panel-strong)] px-2.5 py-1.5 text-[11px] text-[var(--ink)] shadow-lg"
        >
          {label}
          <TooltipPrimitive.Arrow className="fill-[var(--panel-strong)]" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}
