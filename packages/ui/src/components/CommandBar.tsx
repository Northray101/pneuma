import React, { type KeyboardEvent, useRef } from 'react'
import { theme } from '../theme'

interface Props {
  onSubmit: (message: string) => void
  disabled?: boolean
  placeholder?: string
}

export function CommandBar({ onSubmit, disabled = false, placeholder = 'Ask anything...' }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const value = ref.current?.value.trim()
      if (!value || disabled) return
      onSubmit(value)
      if (ref.current) ref.current.value = ''
    }
  }

  return (
    <div
      style={{
        padding: theme.spacing.md,
        borderTop: `1px solid ${theme.colors.border}`,
        backgroundColor: theme.colors.bg,
      }}
    >
      <textarea
        ref={ref}
        rows={1}
        disabled={disabled}
        placeholder={placeholder}
        onKeyDown={handleKey}
        style={{
          width: '100%',
          resize: 'none',
          background: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius.md,
          color: theme.colors.text,
          fontFamily: theme.font.sans,
          fontSize: theme.font.size.base,
          padding: `${theme.spacing.sm} ${theme.spacing.md}`,
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
      <div
        style={{
          fontSize: '11px',
          color: theme.colors.textMuted,
          marginTop: theme.spacing.xs,
        }}
      >
        Enter to send · Shift+Enter for newline
      </div>
    </div>
  )
}
