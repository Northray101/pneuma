export const theme = {
  colors: {
    bg: '#0e0e0e',
    surface: '#1a1a1a',
    border: '#2a2a2a',
    text: '#e8e8e8',
    textMuted: '#888',
    accent: '#4f8ef7',
    userBubble: '#1e2a3a',
    assistantBubble: '#1a1a1a',
  },
  font: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
    size: { sm: '13px', base: '14px', lg: '16px' },
  },
  radius: { sm: '6px', md: '12px', lg: '16px' },
  spacing: { xs: '4px', sm: '8px', md: '16px', lg: '24px' },
} as const
