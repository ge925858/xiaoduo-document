'use client'

import { Moon, Sun } from 'lucide-react'
import { useSyncExternalStore } from 'react'

type Theme = 'light' | 'dark'

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback)
  window.addEventListener('zhijian-theme-change', callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener('zhijian-theme-change', callback)
  }
}

function getSnapshot(): Theme {
  return document.documentElement.dataset.theme === 'dark'
    ? 'dark'
    : 'light'
}

export function ThemeToggle({
  className = 'theme-toggle',
  iconSize = 17,
}: {
  className?: string
  iconSize?: number
}) {
  const theme = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => 'light',
  )

  function toggle() {
    const next: Theme = theme === 'light' ? 'dark' : 'light'
    window.localStorage.setItem('zhijian-theme', next)
    document.documentElement.dataset.theme = next
    document.documentElement.style.colorScheme = next
    window.dispatchEvent(new Event('zhijian-theme-change'))
  }

  const label =
    theme === 'light' ? '切换到深色主题' : '切换到浅色主题'
  return (
    <button
      type="button"
      className={className}
      title={label}
      aria-label={label}
      onClick={toggle}
    >
      {theme === 'light' ? (
        <Moon aria-hidden="true" size={iconSize} />
      ) : (
        <Sun aria-hidden="true" size={iconSize} />
      )}
    </button>
  )
}
