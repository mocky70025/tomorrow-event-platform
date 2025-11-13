'use client'

interface EntrySelectorProps {
  onSelectNew: () => void
  onSelectInvite: () => void
}

export default function EntrySelector({ onSelectNew, onSelectInvite }: EntrySelectorProps) {
  return (
    <div style={{ background: '#F7F7F7', minHeight: '100vh' }}>
      <div className="container mx-auto" style={{ padding: '32px 16px', maxWidth: '394px' }}>
        <h1
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '22px',
            fontWeight: 700,
            lineHeight: '130%',
            color: '#000000',
            textAlign: 'center',
            marginBottom: '24px'
          }}
        >
          主催者アカウントにアクセス
        </h1>

        <p
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '16px',
            lineHeight: '150%',
            color: '#666666',
            textAlign: 'center',
            marginBottom: '32px'
          }}
        >
          はじめて利用する場合は「新規登録」を、既存アカウントから招待された場合は「招待コードから登録」を選択してください。
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <button
            type="button"
            onClick={onSelectNew}
            style={{
              width: '100%',
              borderRadius: '12px',
              border: '1px solid #E5E5E5',
              background: '#FFFFFF',
              padding: '20px',
              textAlign: 'left',
              boxShadow: '0px 2px 8px rgba(0,0,0,0.06)',
              cursor: 'pointer',
            }}
          >
            <span
              style={{
                display: 'block',
                fontFamily: 'Inter, sans-serif',
                fontSize: '18px',
                fontWeight: 700,
                color: '#000000',
                marginBottom: '8px'
              }}
            >
              新規登録
            </span>
            <span
              style={{
                display: 'block',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                lineHeight: '150%',
                color: '#666666'
              }}
            >
              初めて主催者として利用する場合はこちらから登録を開始してください。
            </span>
          </button>

          <button
            type="button"
            onClick={onSelectInvite}
            style={{
              width: '100%',
              borderRadius: '12px',
              border: '1px solid #06C755',
              background: '#E6F8EC',
              padding: '20px',
              textAlign: 'left',
              boxShadow: '0px 2px 8px rgba(0,0,0,0.06)',
              cursor: 'pointer',
            }}
          >
            <span
              style={{
                display: 'block',
                fontFamily: 'Inter, sans-serif',
                fontSize: '18px',
                fontWeight: 700,
                color: '#066B34',
                marginBottom: '8px'
              }}
            >
              招待コードから登録
            </span>
            <span
              style={{
                display: 'block',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                lineHeight: '150%',
                color: '#066B34'
              }}
            >
              既に登録済みの主催者から招待コードを受け取っている場合はこちらを選択してください。
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

