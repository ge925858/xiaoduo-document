import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'

export function StudioSelect({
  value,
  options,
  onChange,
  ariaLabel,
  className,
  contentClassName,
}: {
  value: string
  options: Array<{ value: string; label: string }>
  onChange: (value: string) => void
  ariaLabel: string
  className?: string
  contentClassName?: string
}) {
  const selected = options.find((option) => option.value === value)

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={cn('studio-select-trigger', className)}
          aria-label={ariaLabel}
        >
          <span>{selected?.label ?? '请选择'}</span>
          <ChevronDown size={18} />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className={cn('studio-select-content', contentClassName)}
          side="bottom"
          align="start"
          sideOffset={6}
          collisionPadding={12}
        >
          {options.map((option) => (
            <DropdownMenu.Item
              key={option.value}
              className={cn(
                'studio-select-item',
                option.value === value && 'is-active',
              )}
              onSelect={() => onChange(option.value)}
            >
              <span>{option.label}</span>
              {option.value === value && <Check size={17} />}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
