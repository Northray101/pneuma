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
        background: theme.glass.surface,
        backdropFilter: theme.glass.blurHeavy,
        WebkitBackdropFilter: theme.glass.blurHeavy,
        borderTop: `1px solid ${theme.glass.border}`,
        flexShrink: 0,
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
          background: theme.glass.inputBg,
          backdropFilter: theme.glass.blurLight,
          WebkitBackdropFilter: theme.glass.blurLight,
          border: `1px solid ${theme.glass.inputBorder}`,
          borderRadius: theme.radius.md,
          color: theme.colors.text,
          fontFamily: theme.font.sans,
          fontSize: theme.font.size.base,
          padding: `10px ${theme.spacing.md}`,
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'border-color 0.15s',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = theme.glass.borderStrong
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = theme.glass.inputBorder
        }}
      />
      <div
        style={{
          fontSize: '11px',
          color: theme.colors.textMuted,
          marginTop: '6px',
          opacity: 0.6,
        }}
      >
        Enter to send · Shift+Enter for newline
      </div>
    </div>
  )
}
