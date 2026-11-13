'use client'

import { Toaster as SonnerToaster } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      closeButton
      toastOptions={{
        classNames: {
          toast:
            'border border-[var(--line)] !bg-[var(--panel-strong)] !text-[var(--ink)] !shadow-[0_14px_42px_var(--shadow)]',
          description: '!text-[var(--muted)]',
          actionButton: '!bg-[var(--accent)] !text-[var(--accent-contrast)]',
          cancelButton: '!bg-[var(--hover)] !text-[var(--ink)]',
        },
      }}
    />
  )
}
