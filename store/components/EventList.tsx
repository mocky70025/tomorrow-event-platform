'use client'

import { useState, useEffect, CSSProperties } from 'react'
import { supabase } from '@/lib/supabase'

interface Event {
  id: string
  event_name: string
  event_name_furigana: string
  genre: string
  event_start_date: string
  event_end_date: string
  event_display_period: string
  event_time?: string
  lead_text: string
  event_description: string
  venue_name: string
  venue_city?: string
  venue_town?: string
  venue_address?: string
  main_image_url?: string
  main_image_caption?: string
  homepage_url?: string
  created_at: string
  application_end_date?: string | null
}

interface EventListProps {
  userProfile: any
  onBack: () => void
}

type SearchFilters = {
  keyword: string
  periodStart: string
  periodEnd: string
  venue: string
}

export default function EventList({ userProfile, onBack }: EventListProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showFilterSheet, setShowFilterSheet] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [venue, setVenue] = useState('')
  const [draftPeriodStart, setDraftPeriodStart] = useState('')
  const [draftPeriodEnd, setDraftPeriodEnd] = useState('')
  const [draftVenue, setDraftVenue] = useState('')
  const [hasSearched, setHasSearched] = useState(false)

  useEffect(() => {
    fetchEvents()
  }, [])

  useEffect(() => {
    if (showFilterSheet) {
      setDraftPeriodStart(periodStart)
      setDraftPeriodEnd(periodEnd)
      setDraftVenue(venue)
    }
  }, [showFilterSheet, periodStart, periodEnd, venue])

  const fetchEvents = async (overrideFilters?: Partial<SearchFilters>) => {
    setLoading(true)
    try {
      const effectiveFilters: SearchFilters = {
        keyword,
        periodStart,
        periodEnd,
        venue,
        ...overrideFilters
      }

      let query = supabase
        .from('events')
        .select('*')
        .eq('approval_status', 'approved')

      if (effectiveFilters.periodStart) {
        query = query.gte('event_end_date', effectiveFilters.periodStart)
      }

      if (effectiveFilters.periodEnd) {
        query = query.lte('event_start_date', effectiveFilters.periodEnd)
      }

      const today = new Date().toISOString().split('T')[0]
      query = query.or(`application_end_date.is.null,application_end_date.gte.${today}`)

      query = query.order('event_start_date', { ascending: true })

      const { data, error } = await query

      if (error) throw error

      let filteredEvents = (data || []) as Event[]

      if (effectiveFilters.keyword.trim()) {
        const kw = effectiveFilters.keyword.trim().toLowerCase()
        filteredEvents = filteredEvents.filter(event =>
          [event.event_name, event.event_description, event.lead_text]
            .filter(Boolean)
            .some(field => field?.toLowerCase().includes(kw))
        )
      }

      if (effectiveFilters.venue.trim()) {
        const venueKeyword = effectiveFilters.venue.trim().toLowerCase()
        filteredEvents = filteredEvents.filter(event =>
          [event.venue_name, event.venue_city, event.venue_town, event.venue_address]
            .filter(Boolean)
            .some(field => String(field).toLowerCase().includes(venueKeyword))
        )
      }

      setEvents(filteredEvents)
    } catch (error) {
      console.error('Failed to fetch events:', error)
      alert('イベント一覧の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setHasSearched(true)
    fetchEvents()
  }

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event)
  }

  const handleKeywordClear = () => {
    setKeyword('')
    setHasSearched(false)
    fetchEvents({
      keyword: '',
      periodStart,
      periodEnd,
      venue
    })
  }

  const handleOpenFilterSheet = () => {
    setShowFilterSheet(true)
  }

  const handleCloseFilterSheet = () => {
    setShowFilterSheet(false)
  }

  const handleApplyFilters = () => {
    setPeriodStart(draftPeriodStart)
    setPeriodEnd(draftPeriodEnd)
    setVenue(draftVenue)
    setHasSearched(true)
    setShowFilterSheet(false)
    fetchEvents({
      periodStart: draftPeriodStart,
      periodEnd: draftPeriodEnd,
      venue: draftVenue
    })
  }

  const handleClearFilters = () => {
    setDraftPeriodStart('')
    setDraftPeriodEnd('')
    setDraftVenue('')
    setPeriodStart('')
    setPeriodEnd('')
    setVenue('')
    setHasSearched(false)
    setShowFilterSheet(false)
    fetchEvents({
      periodStart: '',
      periodEnd: '',
      venue: ''
    })
  }

  const handleApply = async (eventId: string) => {
    try {
      // 出店者情報を取得
      const { data: exhibitor } = await supabase
        .from('exhibitors')
        .select('id')
        .eq('line_user_id', userProfile.userId)
        .single()

      if (!exhibitor) {
        alert('出店者登録が完了していません。まず登録を行ってください。')
        return
      }

      // 申し込み状況をチェック
      const { data: existingApplication } = await supabase
        .from('event_applications')
        .select('id')
        .eq('exhibitor_id', exhibitor.id)
        .eq('event_id', eventId)
        .single()

      if (existingApplication) {
        alert('既にこのイベントに申し込み済みです。')
        return
      }

      // 申し込みを登録
      const { error } = await supabase
        .from('event_applications')
        .insert({
          exhibitor_id: exhibitor.id,
          event_id: eventId,
          application_status: 'pending'
        })

      if (error) throw error

      alert('出店申し込みが完了しました。')
      setSelectedEvent(null)
    } catch (error) {
      console.error('Application failed:', error)
      alert('申し込みに失敗しました。')
    }
  }

  const searchCardStyle = {
    background: '#FFFFFF',
    borderRadius: '12px',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    padding: '24px',
    marginBottom: '24px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px'
  }

  const searchLabelStyle = {
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
    fontWeight: 500,
    lineHeight: '120%',
    color: '#000000'
  }

  const searchRowStyle = {
    display: 'flex',
    gap: '12px',
    alignItems: 'center'
  }

  const searchFieldContainerStyle = {
    position: 'relative' as const,
    flex: 1
  }

  const searchInputStyle: CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '12px 44px 12px 44px',
    minHeight: '48px',
    border: '1px solid #E5E5E5',
    borderRadius: '8px',
    fontFamily: 'Inter, sans-serif',
    fontSize: '16px',
    lineHeight: '150%',
    color: '#000000',
    background: '#FFFFFF',
    outline: 'none'
  }

  const searchIconStyle = {
    position: 'absolute' as const,
    left: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#6B6B6B',
    pointerEvents: 'none' as const
  }

  const clearButtonStyle = {
    position: 'absolute' as const,
    right: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    border: 'none',
    background: 'none',
    color: '#6B6B6B',
    cursor: 'pointer',
    fontSize: '18px',
    padding: 0,
    display: 'flex',
    alignItems: 'center'
  }

  const conditionButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 20px',
    minHeight: '48px',
    borderRadius: '8px',
    border: '1px solid #06C755',
    background: '#E6F8EC',
    fontFamily: 'Inter, sans-serif',
    fontSize: '16px',
    fontWeight: 600,
    lineHeight: '19px',
    color: '#066B34',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const
  }

  const sheetBackdropStyle = {
    position: 'fixed' as const,
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-end',
    zIndex: 1000
  }

  const sheetStyle = {
    width: '100%',
    maxWidth: '480px',
    background: '#FFFFFF',
    borderTopLeftRadius: '24px',
    borderTopRightRadius: '24px',
    padding: '24px 24px 32px',
    boxShadow: '0px -4px 12px rgba(0,0,0,0.15)'
  }

  const sheetHandleStyle = {
    width: '48px',
    height: '4px',
    borderRadius: '2px',
    background: '#D9D9D9',
    alignSelf: 'center' as const,
    marginBottom: '16px'
  }

  const sheetHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  }

  const sheetTitleStyle = {
    fontFamily: 'Inter, sans-serif',
    fontSize: '18px',
    fontWeight: 700,
    lineHeight: '120%',
    color: '#000000'
  }

  const sheetCloseButtonStyle = {
    border: 'none',
    background: 'none',
    color: '#6B6B6B',
    fontSize: '16px',
    cursor: 'pointer'
  }

  const sheetLabelStyle = {
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
    fontWeight: 500,
    lineHeight: '120%',
    color: '#000000',
    marginBottom: '10px'
  }

  const sheetInputStyle = {
    boxSizing: 'border-box' as const,
    padding: '12px 16px',
    width: '100%',
    minHeight: '48px',
    border: '1px solid #E5E5E5',
    borderRadius: '8px',
    fontFamily: 'Inter, sans-serif',
    fontSize: '16px',
    lineHeight: '150%',
    color: '#000000',
    background: '#FFFFFF'
  }

  const sheetButtonRowStyle = {
    display: 'flex',
    gap: '12px',
    marginTop: '24px'
  }

  const sheetSecondaryButtonStyle = {
    flex: 1,
    height: '48px',
    borderRadius: '8px',
    border: '1px solid #E5E5E5',
    background: '#FFFFFF',
    fontFamily: 'Inter, sans-serif',
    fontSize: '16px',
    fontWeight: 600,
    lineHeight: '19px',
    color: '#000000',
    cursor: 'pointer'
  }

  const sheetPrimaryButtonStyle = {
    flex: 1,
    height: '48px',
    borderRadius: '8px',
    border: 'none',
    background: '#06C755',
    fontFamily: 'Inter, sans-serif',
    fontSize: '16px',
    fontWeight: 700,
    lineHeight: '19px',
    color: '#FFFFFF',
    cursor: 'pointer'
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
          }}>イベント一覧を読み込み中...</p>
        </div>
      </div>
    )
  }

  if (selectedEvent) {
    return (
      <div style={{ background: '#F7F7F7', minHeight: '100vh' }}>
        <div className="container mx-auto" style={{ padding: '9px 16px', maxWidth: '394px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingTop: '24px' }}>
            <button
              onClick={() => setSelectedEvent(null)}
              style={{
                background: 'transparent',
                border: 'none',
                fontFamily: 'Inter, sans-serif',
                fontSize: '16px',
                lineHeight: '150%',
                color: '#06C755',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              ← 戻る
            </button>
            <h1 style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '20px',
              fontWeight: 700,
              lineHeight: '120%',
              color: '#000000'
            }}>イベント詳細</h1>
            <div style={{ width: '60px' }}></div>
          </div>

          <div style={{
            background: '#FFFFFF',
            boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px'
          }}>
            {selectedEvent.main_image_url && (
              <div style={{ marginBottom: '24px' }}>
                <img
                  src={selectedEvent.main_image_url}
                  alt={selectedEvent.main_image_caption || selectedEvent.event_name}
                  style={{
                    width: '100%',
                    height: '200px',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    background: '#F7F7F7'
                  }}
                />
                {selectedEvent.main_image_caption && (
                  <p style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                    lineHeight: '120%',
                    color: '#666666',
                    marginTop: '8px'
                  }}>{selectedEvent.main_image_caption}</p>
                )}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h2 style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '20px',
                  fontWeight: 700,
                  lineHeight: '120%',
                  color: '#000000',
                  marginBottom: '8px'
                }}>{selectedEvent.event_name}</h2>
                <p style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '16px',
                  lineHeight: '150%',
                  color: '#666666'
                }}>{selectedEvent.event_name_furigana}</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                    fontWeight: 500,
                    lineHeight: '120%',
                    color: '#000000',
                    marginBottom: '8px',
                    display: 'block'
                  }}>ジャンル</label>
                  <p style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '16px',
                    lineHeight: '150%',
                    color: '#000000'
                  }}>{selectedEvent.genre}</p>
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
                  }}>開催期間</label>
                  <p style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '16px',
                    lineHeight: '150%',
                    color: '#000000'
                  }}>
                    {formatDate(selectedEvent.event_start_date)} 〜 {formatDate(selectedEvent.event_end_date)}
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
                  }}>開催時間</label>
                  <p style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '16px',
                    lineHeight: '150%',
                    color: '#000000'
                  }}>{selectedEvent.event_time || '未定'}</p>
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
                  }}>会場</label>
                  <p style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '16px',
                    lineHeight: '150%',
                    color: '#000000'
                  }}>{selectedEvent.venue_name}</p>
                  {selectedEvent.venue_city && (
                    <p style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '14px',
                      lineHeight: '120%',
                      color: '#666666',
                      marginTop: '4px'
                    }}>{selectedEvent.venue_city}</p>
                  )}
                </div>
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
                }}>リード文</label>
                <p style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '16px',
                  lineHeight: '150%',
                  color: '#000000'
                }}>{selectedEvent.lead_text}</p>
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
                }}>イベント説明</label>
                <p style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '16px',
                  lineHeight: '150%',
                  color: '#000000'
                }}>{selectedEvent.event_description}</p>
              </div>

              {selectedEvent.homepage_url && (
                <div>
                  <label style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                    fontWeight: 500,
                    lineHeight: '120%',
                    color: '#000000',
                    marginBottom: '8px',
                    display: 'block'
                  }}>公式サイト</label>
                  <a
                    href={selectedEvent.homepage_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '16px',
                      lineHeight: '150%',
                      color: '#06C755',
                      textDecoration: 'underline'
                    }}
                  >
                    {selectedEvent.homepage_url}
                  </a>
                </div>
              )}
            </div>

            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={() => handleApply(selectedEvent.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '16px 24px',
                  gap: '10px',
                  width: '100%',
                  maxWidth: '330px',
                  height: '48px',
                  background: '#06C755',
                  borderRadius: '8px',
                  border: 'none',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '16px',
                  fontWeight: 700,
                  lineHeight: '19px',
                  color: '#FFFFFF',
                  cursor: 'pointer'
                }}
              >
                出店申し込み
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div style={{ background: '#F7F7F7', minHeight: '100vh' }}>
        <div className="container mx-auto" style={{ padding: '9px 16px', maxWidth: '394px' }}>
        <div style={{ marginBottom: '24px', paddingTop: '24px' }}>
          <h1 style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '20px',
            fontWeight: 700,
            lineHeight: '120%',
            color: '#000000',
            textAlign: 'center'
          }}>イベント一覧</h1>
        </div>

        <form onSubmit={handleSearchSubmit} style={searchCardStyle}>
          <div>
            <span style={searchLabelStyle}>キーワード</span>
          </div>
          <div style={searchRowStyle}>
            <div style={searchFieldContainerStyle}>
              <span style={searchIconStyle} aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M11 4a7 7 0 0 1 5.472 11.41l3.559 3.558a1 1 0 0 1-1.414 1.414l-3.558-3.559A7 7 0 1 1 11 4zm0 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10z" fill="currentColor"/>
                </svg>
              </span>
              <input
                type="search"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="イベント名や説明文で検索"
                style={searchInputStyle}
                aria-label="キーワードで検索"
              />
              {keyword && (
                <button
                  type="button"
                  onClick={handleKeywordClear}
                  style={clearButtonStyle}
                  aria-label="検索キーワードをクリア"
                >
                  ×
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={handleOpenFilterSheet}
              style={conditionButtonStyle}
              aria-haspopup="dialog"
              aria-expanded={showFilterSheet}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M3 5a1 1 0 0 1 1-1h16a1 1 0 0 1 .78 1.625l-6.28 7.35V19a1 1 0 0 1-.553.894l-4 2A1 1 0 0 1 8 21v-7.025L1.22 6.625A1 1 0 0 1 2 5h1z" fill="#066B34"/>
              </svg>
              条件設定
            </button>
          </div>
        </form>

        {events.length === 0 ? (
          <div style={{
            background: '#FFFFFF',
            boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
            borderRadius: '12px',
            padding: '48px 24px',
            textAlign: 'center'
          }}>
            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '16px',
              lineHeight: '150%',
              color: '#666666'
            }}>
              {hasSearched ? '該当するイベントが見つかりませんでした' : '開催予定のイベントがありません'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {events.map((event) => (
              <div
                key={event.id}
                onClick={() => handleEventClick(event)}
                style={{
                  background: '#FFFFFF',
                  boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  cursor: 'pointer'
                }}
              >
                {event.main_image_url && (
                  <img
                    src={event.main_image_url}
                    alt={event.event_name}
                    style={{
                      width: '100%',
                      height: '200px',
                      objectFit: 'contain',
                      background: '#F7F7F7'
                    }}
                  />
                )}
                <div style={{ padding: '16px' }}>
                  <h3 style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '18px',
                    fontWeight: 700,
                    lineHeight: '120%',
                    color: '#000000',
                    marginBottom: '8px'
                  }}>{event.event_name}</h3>
                  <p style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                    lineHeight: '120%',
                    color: '#666666',
                    marginBottom: '8px'
                  }}>{event.genre}</p>
                  <p style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                    lineHeight: '120%',
                    color: '#666666',
                    marginBottom: '4px'
                  }}>
                    {formatDate(event.event_start_date)} 〜 {formatDate(event.event_end_date)}
                  </p>
                  <p style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                    lineHeight: '120%',
                    color: '#666666',
                    marginBottom: '8px'
                  }}>{event.venue_name}</p>
                  <p style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                    lineHeight: '120%',
                    color: '#000000',
                    marginTop: '8px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>{event.lead_text}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>

      {showFilterSheet && (
        <div style={sheetBackdropStyle} role="dialog" aria-modal="true" aria-label="詳細フィルター">
          <div style={sheetStyle}>
            <div style={sheetHandleStyle}></div>
            <div style={sheetHeaderStyle}>
              <h2 style={sheetTitleStyle}>詳細検索</h2>
              <button type="button" onClick={handleCloseFilterSheet} style={sheetCloseButtonStyle}>
                閉じる
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={sheetLabelStyle}>開催期間</label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <input
                    type="date"
                    value={draftPeriodStart}
                    onChange={(e) => setDraftPeriodStart(e.target.value)}
                    style={{ ...sheetInputStyle, flex: 1 }}
                  />
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: 700, color: '#666666' }}>〜</span>
                  <input
                    type="date"
                    value={draftPeriodEnd}
                    onChange={(e) => setDraftPeriodEnd(e.target.value)}
                    style={{ ...sheetInputStyle, flex: 1 }}
                  />
                </div>
              </div>

              <div>
                <label style={sheetLabelStyle}>会場</label>
                <input
                  type="text"
                  value={draftVenue}
                  onChange={(e) => setDraftVenue(e.target.value)}
                  placeholder="会場名や地域名で検索"
                  style={sheetInputStyle}
                />
              </div>

              <p style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '12px',
                lineHeight: '150%',
                color: '#666666',
                marginTop: '4px'
              }}>
                現在募集中のイベントのみ表示しています。
              </p>
            </div>

            <div style={sheetButtonRowStyle}>
              <button type="button" onClick={handleClearFilters} style={sheetSecondaryButtonStyle}>
                条件をクリア
              </button>
              <button type="button" onClick={handleApplyFilters} style={sheetPrimaryButtonStyle}>
                この条件で検索
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
