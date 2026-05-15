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
        padding: `0 ${theme.spacing.xs}`,
      }}
    >
      <div
        style={{
          maxWidth: '72%',
          background: isUser ? theme.glass.userBubble : theme.glass.surface,
          backdropFilter: theme.glass.blurLight,
          WebkitBackdropFilter: theme.glass.blurLight,
          border: `1px solid ${isUser ? theme.glass.userBorder : theme.glass.border}`,
          borderRadius: isUser
            ? `${theme.radius.lg} ${theme.radius.lg} ${theme.radius.sm} ${theme.radius.lg}`
            : `${theme.radius.lg} ${theme.radius.lg} ${theme.radius.lg} ${theme.radius.sm}`,
          color: theme.colors.text,
          padding: `10px ${theme.spacing.md}`,
          fontSize: theme.font.size.base,
          fontFamily: theme.font.sans,
          lineHeight: '1.55',
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
              marginTop: '6px',
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
