'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  supabase,
  type Event,
  type OrganizerProfile,
  type OrganizerMember,
  type OrganizerInvitation,
  type OrganizerMemberRole,
} from '@/lib/supabase'
import EventForm from './EventForm'
import EventList from './EventList'
import EventApplications from './EventApplications'

interface EventManagementProps {
  userProfile: any
  profile: OrganizerProfile
  currentMember: OrganizerMember
  onProfileChange: (profile: OrganizerProfile) => void
  onMemberChange: (member: OrganizerMember) => void
}

const CalendarIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M7 2a1 1 0 0 0-1 1v1H5a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3h-1V3a1 1 0 1 0-2 0v1H8V3a1 1 0 0 0-1-1Zm12 6v11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8h14Z"
      fill="currentColor"
    />
    <path d="M7 11h4v4H7v-4Zm6 0h4v4h-4v-4Z" fill="currentColor" />
  </svg>
)

const SettingsIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M19.14 12.936a7.836 7.836 0 0 0 .054-.936 7.836 7.836 0 0 0-.054-.936l2.037-1.593a.5.5 0 0 0 .12-.638l-1.928-3.338a.5.5 0 0 0-.607-.214l-2.399.964a7.896 7.896 0 0 0-1.618-.936l-.365-2.54A.5.5 0 0 0 13.9 2h-3.8a.5.5 0 0 0-.495.419l-.365 2.54a7.896 7.896 0 0 0-1.618.936l-2.399-.964a.5.5 0 0 0-.607.214L2.688 8.543a.5.5 0 0 0 .12.638l2.037 1.593a7.836 7.836 0 0 0-.054.936c0 .317.018.628.054.936l-2.037 1.593a.5.5 0 0 0-.12.638l1.928 3.338a.5.5 0 0 0 .607.214l2.399-.964c.5.39 1.047.713 1.618.936l.365 2.54a.5.5 0 0 0 .495.419h3.8a.5.5 0 0 0 .495-.419l.365-2.54a7.896 7.896 0 0 0 1.618-.936l2.399.964a.5.5 0 0 0 .607-.214l1.928-3.338a.5.5 0 0 0-.12-.638l-2.037-1.593ZM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5Z"
      fill="currentColor"
    />
  </svg>
)

const SectionCard: React.FC<{ title: string; actions?: React.ReactNode; children: React.ReactNode }> = ({
  title,
  actions,
  children,
}) => (
  <div
    style={{
      background: '#FFFFFF',
      boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '24px',
    }}
  >
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
      }}
    >
      <h2
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '16px',
          fontWeight: 700,
          lineHeight: '120%',
          color: '#000000',
        }}
      >
        {title}
      </h2>
      {actions}
    </div>
    {children}
  </div>
)

const generateInvitationCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export default function EventManagement({
  userProfile,
  profile,
  currentMember,
  onProfileChange,
  onMemberChange,
}: EventManagementProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [members, setMembers] = useState<OrganizerMember[]>([])
  const [invitations, setInvitations] = useState<OrganizerInvitation[]>([])
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [loadingSettings, setLoadingSettings] = useState(false)
  const [showEventForm, setShowEventForm] = useState(false)
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null)
  const [eventForApplications, setEventForApplications] = useState<Event | null>(null)
  const [currentView, setCurrentView] = useState<'events' | 'settings'>('events')
  const [navVisible, setNavVisible] = useState(true)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const fetchEvents = useCallback(async () => {
    if (!profile) return
    setLoadingEvents(true)
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('organizer_profile_id', profile.id)
        .order('event_start_date', { ascending: true })

      if (error) throw error
      setEvents(data || [])
    } catch (error) {
      console.error('Failed to fetch events:', error)
      alert('イベント一覧の取得に失敗しました')
    } finally {
      setLoadingEvents(false)
    }
  }, [profile])

  const fetchMembersAndInvitations = useCallback(async () => {
    if (!profile) return
    setLoadingSettings(true)
    try {
      const [{ data: memberData, error: memberError }, { data: invitationData, error: invitationError }] =
        await Promise.all([
          supabase
            .from('organizer_members')
            .select('*')
            .eq('organizer_profile_id', profile.id)
            .order('created_at', { ascending: true }),
          supabase
            .from('organizer_invitations')
            .select('*')
            .eq('organizer_profile_id', profile.id)
            .order('created_at', { ascending: false }),
        ])

      if (memberError) throw memberError
      if (invitationError) throw invitationError

      const memberList = memberData || []
      setMembers(memberList)
      setInvitations(invitationData || [])

      const refreshedSelf = memberList.find(member => member.line_user_id === currentMember.line_user_id)
      if (refreshedSelf) {
        onMemberChange(refreshedSelf)
      }
    } catch (error) {
      console.error('Failed to fetch settings data:', error)
      alert('設定情報の取得に失敗しました')
    } finally {
      setLoadingSettings(false)
    }
  }, [profile, currentMember.line_user_id, onMemberChange])

  useEffect(() => {
    fetchEvents()
    fetchMembersAndInvitations()
  }, [fetchEvents, fetchMembersAndInvitations])

  useEffect(() => {
    onProfileChange(profile)
  }, [profile, onProfileChange])

  useEffect(() => {
    const handleScroll = () => {
      setNavVisible(false)
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
      scrollTimeoutRef.current = setTimeout(() => {
        setNavVisible(true)
      }, 200)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  const handleEventCreated = (savedEvent: Event) => {
    setEvents(prev => {
      const existingIndex = prev.findIndex(e => e.id === savedEvent.id)
      if (existingIndex >= 0) {
        const updated = [...prev]
        updated[existingIndex] = savedEvent
        return updated
      }
      return [savedEvent, ...prev]
    })
    setShowEventForm(false)
    setEventToEdit(null)
  }

  useEffect(() => {
    const handler = (e: any) => {
      const id = e.detail?.id
      const target = events.find(ev => ev.id === id)
      if (target) {
        setEventToEdit(target)
        setShowEventForm(true)
      }
    }
    window.addEventListener('edit-event', handler)
    return () => window.removeEventListener('edit-event', handler)
  }, [events])

  const handleCreateInvitation = async (role: OrganizerMemberRole = 'editor') => {
    try {
      const code = generateInvitationCode()
      const { error } = await supabase
        .from('organizer_invitations')
        .insert({
          organizer_profile_id: profile.id,
          code,
          role,
          created_by_member_id: currentMember.id,
        })

      if (error) throw error
      await fetchMembersAndInvitations()
      alert(`招待コードを発行しました: ${code}`)
    } catch (error) {
      console.error('Failed to create invitation:', error)
      alert('招待コードの発行に失敗しました')
    }
  }

  const handleRevokeInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('organizer_invitations')
        .update({ status: 'revoked' })
        .eq('id', invitationId)

      if (error) throw error
      await fetchMembersAndInvitations()
    } catch (error) {
      console.error('Failed to revoke invitation:', error)
      alert('招待コードの無効化に失敗しました')
    }
  }

  const renderEventsView = () => (
    <div style={{ background: '#F7F7F7', minHeight: '100vh' }}>
      <div className="container mx-auto" style={{ padding: '9px 16px', maxWidth: '394px', paddingBottom: '24px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            paddingTop: '24px',
          }}
        >
          <h1
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '20px',
              fontWeight: 700,
              lineHeight: '120%',
              color: '#000000',
            }}
          >
            イベント管理
          </h1>
          <button
            onClick={() => setShowEventForm(true)}
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
              cursor: 'pointer',
            }}
            disabled={!profile.is_approved}
          >
            新しいイベント掲載
          </button>
        </div>

        {!profile.is_approved && (
          <SectionCard title="承認待ち">
            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                lineHeight: '150%',
                color: '#B8860B',
              }}
            >
              運営側の承認をお待ちください。承認完了後にイベントを掲載できます。
            </p>
          </SectionCard>
        )}

        <EventList
          events={events}
          loading={loadingEvents}
          onEventUpdated={fetchEvents}
          onEdit={ev => {
            setEventToEdit(ev)
            setShowEventForm(true)
          }}
          onViewApplications={ev => setEventForApplications(ev)}
        />
      </div>
    </div>
  )

  const renderSettingsView = () => (
    <div style={{ background: '#F7F7F7', minHeight: '100vh' }}>
      <div className="container mx-auto" style={{ padding: '9px 16px', maxWidth: '394px', paddingBottom: '24px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            paddingTop: '24px',
          }}
        >
          <h1
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '20px',
              fontWeight: 700,
              lineHeight: '120%',
              color: '#000000',
            }}
          >
            設定
          </h1>
        </div>

        <SectionCard
          title="組織情報"
          actions={
            <button
              type="button"
              style={{
                padding: '8px 12px',
                background: '#06C755',
                color: '#FFFFFF',
                borderRadius: '8px',
                border: 'none',
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              onClick={() => alert('組織情報の編集UIは後日実装予定です。')}
            >
              編集
            </button>
          }
        >
          <dl style={{ display: 'grid', gridTemplateColumns: '96px 1fr', rowGap: '12px', columnGap: '16px' }}>
            <dt style={{ fontSize: '14px', color: '#666666', fontFamily: 'Inter, sans-serif' }}>会社名</dt>
            <dd style={{ fontSize: '16px', fontWeight: 600, color: '#000000', fontFamily: 'Inter, sans-serif' }}>{profile.company_name}</dd>
            {profile.contact_phone && (
              <>
                <dt style={{ fontSize: '14px', color: '#666666', fontFamily: 'Inter, sans-serif' }}>電話番号</dt>
                <dd style={{ fontSize: '16px', color: '#000000', fontFamily: 'Inter, sans-serif' }}>{profile.contact_phone}</dd>
              </>
            )}
            {profile.contact_email && (
              <>
                <dt style={{ fontSize: '14px', color: '#666666', fontFamily: 'Inter, sans-serif' }}>メール</dt>
                <dd style={{ fontSize: '16px', color: '#000000', fontFamily: 'Inter, sans-serif' }}>{profile.contact_email}</dd>
              </>
            )}
            {profile.website_url && (
              <>
                <dt style={{ fontSize: '14px', color: '#666666', fontFamily: 'Inter, sans-serif' }}>Webサイト</dt>
                <dd style={{ fontSize: '16px', color: '#000000', fontFamily: 'Inter, sans-serif' }}>{profile.website_url}</dd>
              </>
            )}
          </dl>
        </SectionCard>

        <SectionCard
          title="メンバー"
          actions={
            <button
              type="button"
              style={{
                padding: '8px 12px',
                background: '#06C755',
                color: '#FFFFFF',
                borderRadius: '8px',
                border: 'none',
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              onClick={() => handleCreateInvitation('editor')}
            >
              招待コード発行
            </button>
          }
        >
          {loadingSettings ? (
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#666666' }}>読み込み中...</p>
          ) : members.length === 0 ? (
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#666666' }}>登録メンバーがまだいません。</p>
          ) : (
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {members.map(member => (
                <li
                  key={member.id}
                  style={{
                    padding: '14px 16px',
                    border: '1px solid #E5E5E5',
                    borderRadius: '8px',
                    background: '#FAFAFA',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: 600 }}>{member.name}</p>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#666666' }}>{member.email || 'メール未登録'}</p>
                    </div>
                    <span
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '12px',
                        padding: '4px 10px',
                        borderRadius: '999px',
                        background: member.role === 'owner' ? '#E6F8EC' : '#EFEFEF',
                        color: member.role === 'owner' ? '#066B34' : '#555555',
                      }}
                    >
                      {member.role === 'owner' ? 'オーナー' : member.role === 'editor' ? '編集者' : '閲覧者'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="招待コード">
          {loadingSettings ? (
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#666666' }}>読み込み中...</p>
          ) : invitations.length === 0 ? (
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#666666' }}>発行済みの招待コードがありません。</p>
          ) : (
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {invitations.map(invitation => (
                <li
                  key={invitation.id}
                  style={{
                    padding: '14px 16px',
                    border: '1px solid #E5E5E5',
                    borderRadius: '8px',
                    background: '#FAFAFA',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: 700 }}>{invitation.code}</p>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#666666' }}>
                        権限: {invitation.role === 'owner' ? 'オーナー' : invitation.role === 'editor' ? '編集者' : '閲覧者'}
                      </p>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#999999' }}>
                        状態: {invitation.status === 'active' ? '有効' : invitation.status === 'used' ? '使用済み' : invitation.status === 'revoked' ? '無効化済み' : '期限切れ'}
                      </p>
                    </div>
                    {invitation.status === 'active' && (
                      <button
                        type="button"
                        style={{
                          padding: '6px 10px',
                          background: '#FFFFFF',
                          border: '1px solid #E5E5E5',
                          borderRadius: '6px',
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                        onClick={() => handleRevokeInvitation(invitation.id)}
                      >
                        無効化
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  )

  if (showEventForm) {
    return (
      <EventForm
        profile={profile}
        currentMember={currentMember}
        onEventCreated={handleEventCreated}
        initialEvent={eventToEdit || undefined}
        onCancel={() => {
          setShowEventForm(false)
          setEventToEdit(null)
        }}
      />
    )
  }

  if (eventForApplications) {
    return (
      <EventApplications
        eventId={eventForApplications.id}
        eventName={eventForApplications.event_name}
        onBack={() => setEventForApplications(null)}
      />
    )
  }

  return (
    <div style={{ background: '#F7F7F7', minHeight: '100vh', paddingBottom: 'calc(env(safe-area-inset-bottom, 0) + 88px)' }}>
      {currentView === 'events' ? renderEventsView() : renderSettingsView()}

      <nav
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000,
          background: '#FFFFFF',
          borderTop: '1px solid #E5E5E5',
          boxShadow: '0px -2px 8px rgba(0, 0, 0, 0.08)',
          willChange: 'transform',
          transition: 'transform 0.25s ease-out',
          transform: navVisible ? 'translateY(0) translateZ(0)' : 'translateY(110%) translateZ(0)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            width: '100%',
            padding: '8px 16px',
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0) + 8px)',
          }}
        >
          <button
            onClick={() => setCurrentView('events')}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            <span style={{ color: currentView === 'events' ? '#06C755' : '#666666' }}>
              <CalendarIcon />
            </span>
            <span style={{ fontSize: '12px', color: currentView === 'events' ? '#06C755' : '#666666' }}>イベント</span>
          </button>
          <button
            onClick={() => setCurrentView('settings')}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            <span style={{ color: currentView === 'settings' ? '#06C755' : '#666666' }}>
              <SettingsIcon />
            </span>
            <span style={{ fontSize: '12px', color: currentView === 'settings' ? '#06C755' : '#666666' }}>設定</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
