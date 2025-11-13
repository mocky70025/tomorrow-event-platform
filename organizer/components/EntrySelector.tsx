'use client'

interface EntrySelectorProps {
  onSelectNew: () => void
  onSelectInvite: () => void
}

export default function EntrySelector({ onSelectNew, onSelectInvite }: EntrySelectorProps) {
  return (
    <div style={{ background: '#F7F7F7', minHeight: '100vh' }}>
      <div className="container mx-auto" style={{ padding: '56px 16px', maxWidth: '394px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '64px' }}>
          <div
            style={{
              width: '220px',
              height: '220px',
              borderRadius: '32px',
              background: '#A7FF6B',
              boxShadow: '0px 12px 32px rgba(0, 0, 0, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'Inter, sans-serif',
              fontSize: '20px',
              fontWeight: 700,
              color: '#0F2A1A',
            }}
          >
            アイコン作る
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <button
            type="button"
            onClick={onSelectNew}
            style={{
              width: '100%',
              borderRadius: '999px',
              border: '2px solid #06C755',
              background: '#FFFFFF',
              padding: '18px',
              textAlign: 'center',
              fontFamily: 'Inter, sans-serif',
              fontSize: '17px',
              fontWeight: 700,
              color: '#06C755',
              cursor: 'pointer',
              boxShadow: '0px 8px 18px rgba(6, 199, 85, 0.18)',
            }}
          >
            新規登録
          </button>

          <button
            type="button"
            onClick={onSelectInvite}
            style={{
              width: '100%',
              borderRadius: '999px',
              border: 'none',
              background: '#06C755',
              padding: '18px',
              textAlign: 'center',
              fontFamily: 'Inter, sans-serif',
              fontSize: '17px',
              fontWeight: 700,
              color: '#FFFFFF',
              cursor: 'pointer',
              boxShadow: '0px 16px 28px rgba(6, 199, 85, 0.35)',
            }}
          >
            招待コードで登録
          </button>
        </div>
      </div>
    </div>
  )
}

