import * as AlertDialog from '@radix-ui/react-alert-dialog'
import { useRef } from 'react'

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => void
}) {
  const returnFocusRef = useRef<HTMLElement | null>(null)

  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="dialog-overlay fixed inset-0 z-[90] bg-[#0d120f]/55 backdrop-blur-[2px]" />
        <AlertDialog.Content
          className="dialog-content fixed left-1/2 top-1/2 z-[91] w-[min(92vw,430px)] -translate-x-1/2 -translate-y-1/2 rounded-[7px] border border-[var(--line-strong)] bg-[var(--paper)] p-5 shadow-2xl"
          onOpenAutoFocus={() => {
            const activeElement = document.activeElement
            if (activeElement instanceof HTMLElement) {
              returnFocusRef.current = activeElement
            }
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            returnFocusRef.current?.focus()
          }}
        >
          <AlertDialog.Title className="font-display text-xl text-[var(--ink)]">
            {title}
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-xs leading-6 text-[var(--muted)]">
            {description}
          </AlertDialog.Description>
          <div className="mt-6 flex justify-end gap-2">
            <AlertDialog.Cancel asChild>
              <button type="button" className="studio-secondary-button">
                取消
              </button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button
                type="button"
                className="trash-danger-button"
                onClick={onConfirm}
              >
                {confirmLabel}
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
