'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import OrganizerEditForm from './OrganizerEditForm'

interface OrganizerProfileProps {
  userProfile: any
  onBack: () => void
}

interface OrganizerData {
  id: string
  company_name: string
  name: string
  gender: string
  age: number
  phone_number: string
  email: string
  line_user_id: string
  is_approved: boolean
  created_at: string
  updated_at: string
}

export default function OrganizerProfile({ userProfile, onBack }: OrganizerProfileProps) {
  const [organizerData, setOrganizerData] = useState<OrganizerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    fetchOrganizerData()
  }, [])

  const fetchOrganizerData = async () => {
    try {
      const { data, error } = await supabase
        .from('organizers')
        .select('*')
        .eq('line_user_id', userProfile.userId)
        .single()

      if (error) throw error
      
      setOrganizerData(data)
    } catch (error) {
      console.error('Failed to fetch organizer data:', error)
      alert('プロフィール情報の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateComplete = (updatedData: OrganizerData) => {
    setOrganizerData(updatedData)
    setIsEditing(false)
  }

  if (loading) {
    return (
      <div style={{ background: '#F7F7F7', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '3px solid #E5E5E5',
            borderTopColor: '#06C755',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '16px',
            lineHeight: '150%',
            color: '#666666'
          }}>プロフィールを読み込み中...</p>
        </div>
      </div>
    )
  }

  if (isEditing && organizerData) {
    return (
      <OrganizerEditForm
        organizerData={organizerData}
        userProfile={userProfile}
        onUpdateComplete={handleUpdateComplete}
        onCancel={() => setIsEditing(false)}
      />
    )
  }

  return (
    <div style={{ background: '#F7F7F7', minHeight: '100vh' }}>
      <div className="container mx-auto" style={{ padding: '9px 16px', maxWidth: '394px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingTop: '24px' }}>
          <div style={{ width: '60px' }}></div>
          <h1 style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '20px',
            fontWeight: 700,
            lineHeight: '120%',
            color: '#000000',
            textAlign: 'center'
          }}>登録情報</h1>
          <button
            onClick={() => setIsEditing(true)}
            style={{
              padding: '8px 16px',
              background: '#06C755',
              color: '#FFFFFF',
              borderRadius: '8px',
              border: 'none',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              fontWeight: 500,
              lineHeight: '120%',
              cursor: 'pointer'
            }}
          >
            編集
          </button>
        </div>

        {organizerData && (
          <div style={{
            background: '#FFFFFF',
            boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  lineHeight: '120%',
                  color: '#000000',
                  marginBottom: '8px',
                  display: 'block'
                }}>会社名</label>
                <p style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '16px',
                  fontWeight: 600,
                  lineHeight: '150%',
                  color: '#000000'
                }}>{organizerData.company_name}</p>
              </div>

              <div>
                <label style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  lineHeight: '120%',
                  color: '#000000',
                  marginBottom: '8px',
                  display: 'block'
                }}>お名前</label>
                <p style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '16px',
                  fontWeight: 600,
                  lineHeight: '150%',
                  color: '#000000'
                }}>{organizerData.name}</p>
              </div>

              <div>
                <label style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  lineHeight: '120%',
                  color: '#000000',
                  marginBottom: '8px',
                  display: 'block'
                }}>性別</label>
                <p style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '16px',
                  fontWeight: 600,
                  lineHeight: '150%',
                  color: '#000000'
                }}>{organizerData.gender === '男' ? '男性' : organizerData.gender === '女' ? '女性' : 'その他'}</p>
              </div>

              <div>
                <label style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  lineHeight: '120%',
                  color: '#000000',
                  marginBottom: '8px',
                  display: 'block'
                }}>年齢</label>
                <p style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '16px',
                  fontWeight: 600,
                  lineHeight: '150%',
                  color: '#000000'
                }}>{organizerData.age}歳</p>
              </div>

              <div>
                <label style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  lineHeight: '120%',
                  color: '#000000',
                  marginBottom: '8px',
                  display: 'block'
                }}>電話番号</label>
                <p style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '16px',
                  fontWeight: 600,
                  lineHeight: '150%',
                  color: '#000000'
                }}>{organizerData.phone_number}</p>
              </div>

              <div>
                <label style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  lineHeight: '120%',
                  color: '#000000',
                  marginBottom: '8px',
                  display: 'block'
                }}>メールアドレス</label>
                <p style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '16px',
                  fontWeight: 600,
                  lineHeight: '150%',
                  color: '#000000'
                }}>{organizerData.email}</p>
              </div>

              <div>
                <label style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  lineHeight: '120%',
                  color: '#000000',
                  marginBottom: '8px',
                  display: 'block'
                }}>承認状態</label>
                <p style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '16px',
                  fontWeight: 600,
                  lineHeight: '150%',
                  color: organizerData.is_approved ? '#06C755' : '#B8860B'
                }}>{organizerData.is_approved ? '承認済み' : '承認待ち'}</p>
              </div>

              <div>
                <label style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  lineHeight: '120%',
                  color: '#000000',
                  marginBottom: '8px',
                  display: 'block'
                }}>登録日時</label>
                <p style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '16px',
                  lineHeight: '150%',
                  color: '#000000'
                }}>
                  {new Date(organizerData.created_at).toLocaleString('ja-JP')}
                </p>
              </div>

              <div>
                <label style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  lineHeight: '120%',
                  color: '#000000',
                  marginBottom: '8px',
                  display: 'block'
                }}>最終更新日時</label>
                <p style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '16px',
                  lineHeight: '150%',
                  color: '#000000'
                }}>
                  {new Date(organizerData.updated_at).toLocaleString('ja-JP')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

