import React from 'react'
import type { MessageRole } from '@pneuma/types'
import { theme } from '../theme'

interface Props {
  role: MessageRole
  content: string
  timestamp?: string
}

export function MessageBubble({ role, content, timestamp }: Props) {
  const isUser = role === 'user'

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: theme.spacing.sm,
      }}
    >
      <div
        style={{
          maxWidth: '72%',
          backgroundColor: isUser ? theme.colors.userBubble : theme.colors.assistantBubble,
          color: theme.colors.text,
          padding: `${theme.spacing.sm} ${theme.spacing.md}`,
          borderRadius: theme.radius.lg,
          fontSize: theme.font.size.base,
          fontFamily: theme.font.sans,
          lineHeight: '1.5',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {content}
        {timestamp && (
          <div
            style={{
              fontSize: '11px',
              color: theme.colors.textMuted,
              marginTop: theme.spacing.xs,
              textAlign: isUser ? 'right' : 'left',
            }}
          >
            {timestamp}
          </div>
        )}
      </div>
    </div>
  )
}
