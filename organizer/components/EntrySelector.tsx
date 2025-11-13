'use client'

interface EntrySelectorProps {
  onSelectNew: () => void
  onSelectInvite: () => void
}

const containerStyle = {
  background: '#F7F7F7',
  minHeight: '100vh',
}

const wrapperStyle = {
  padding: '56px 16px',
  maxWidth: '394px',
  margin: '0 auto',
}

const iconWrapperStyle = {
  display: 'flex',
  justifyContent: 'center' as const,
  marginBottom: '56px',
}

const iconBoxStyle = {
  width: '220px',
  height: '220px',
  borderRadius: '24px',
  background: '#A7FF6B',
  boxShadow: '0px 12px 28px rgba(0, 0, 0, 0.12)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'Inter, sans-serif',
  fontSize: '20px',
  fontWeight: 700,
  color: '#103820',
}

const buttonGroupStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '16px',
}

const baseButtonStyle = {
  width: '100%',
  maxWidth: '330px',
  height: '48px',
  borderRadius: '8px',
  padding: '0 16px',
  fontFamily: 'Inter, sans-serif',
  fontSize: '16px',
  fontWeight: 700,
  lineHeight: '48px',
  textAlign: 'center' as const,
  cursor: 'pointer',
  marginLeft: 'auto',
  marginRight: 'auto',
  transition: 'transform 0.1s ease',
} as const

const secondaryButtonStyle = {
  ...baseButtonStyle,
  background: '#FFFFFF',
  border: '1px solid #06C755',
  color: '#06C755',
  boxShadow: '0px 4px 12px rgba(6, 199, 85, 0.12)',
}

const primaryButtonStyle = {
  ...baseButtonStyle,
  background: '#06C755',
  border: 'none',
  color: '#FFFFFF',
  boxShadow: '0px 10px 24px rgba(6, 199, 85, 0.28)',
}

export default function EntrySelector({ onSelectNew, onSelectInvite }: EntrySelectorProps) {
  return (
    <div style={containerStyle}>
      <div style={wrapperStyle}>
        <div style={iconWrapperStyle}>
          <div style={iconBoxStyle}>アイコン作る</div>
        </div>

        <div style={buttonGroupStyle}>
          <button type="button" onClick={onSelectNew} style={secondaryButtonStyle}>
            新規登録
          </button>
          <button type="button" onClick={onSelectInvite} style={primaryButtonStyle}>
            招待コードで登録
          </button>
        </div>
      </div>
    </div>
  )
}

