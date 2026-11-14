import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  className?: string
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="dialog-overlay fixed inset-0 z-[70] bg-[#0b120e]/55 backdrop-blur-[2px]" />
        <DialogPrimitive.Content
          className={cn(
            'dialog-content fixed left-1/2 top-1/2 z-[71] max-h-[86vh] w-[min(92vw,520px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[8px] border border-[var(--line)] bg-[var(--panel-strong)] shadow-2xl',
            className,
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] px-5 py-4">
            <div>
              <DialogPrimitive.Title className="font-display text-lg text-[var(--ink)]">
                {title}
              </DialogPrimitive.Title>
              {description && (
                <DialogPrimitive.Description className="mt-1 text-xs leading-5 text-[var(--muted)]">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close asChild>
              <button
                className="flex size-8 items-center justify-center rounded-[6px] text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                aria-label="关闭"
              >
                <X size={21} />
              </button>
            </DialogPrimitive.Close>
          </div>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
