'use client'

import { useState, useEffect } from 'react'
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
  onlyRecruiting: boolean
}

export default function EventList({ userProfile, onBack }: EventListProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [venue, setVenue] = useState('')
  const [onlyRecruiting, setOnlyRecruiting] = useState(true)
  const [hasSearched, setHasSearched] = useState(false)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async (overrideFilters?: Partial<SearchFilters>) => {
    setLoading(true)
    try {
      const effectiveFilters: SearchFilters = {
        keyword,
        periodStart,
        periodEnd,
        venue,
        onlyRecruiting,
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

      if (effectiveFilters.onlyRecruiting) {
        const today = new Date().toISOString().split('T')[0]
        query = query.or(`application_end_date.is.null,application_end_date.gte.${today}`)
      }

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

  const handleResetFilters = () => {
    setKeyword('')
    setPeriodStart('')
    setPeriodEnd('')
    setVenue('')
    setOnlyRecruiting(true)
    setHasSearched(false)
    fetchEvents({
      keyword: '',
      periodStart: '',
      periodEnd: '',
      venue: '',
      onlyRecruiting: true
    })
  }

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event)
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

        <div style={{ marginBottom: '24px' }}>
          <button
            type="button"
            onClick={() => setShowFilters(prev => !prev)}
            style={{
              width: '100%',
              height: '48px',
              borderRadius: '8px',
              border: '1px solid #E5E5E5',
              background: '#FFFFFF',
              fontFamily: 'Inter, sans-serif',
              fontSize: '16px',
              fontWeight: 700,
              lineHeight: '19px',
              color: '#000000',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            条件でさがす {showFilters ? '▲' : '▼'}
          </button>
        </div>

        {showFilters && (
          <div style={{
            background: '#FFFFFF',
            boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  lineHeight: '120%',
                  color: '#000000',
                  marginBottom: '10px',
                  display: 'block'
                }}>
                  キーワード
                </label>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="イベント名や説明文で検索"
                  style={{
                    boxSizing: 'border-box',
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
                  }}
                />
              </div>

              <div>
                <label style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  lineHeight: '120%',
                  color: '#000000',
                  marginBottom: '10px',
                  display: 'block'
                }}>
                  開催期間
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                  <input
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    style={{
                      boxSizing: 'border-box',
                      padding: '12px 16px',
                      minHeight: '48px',
                      border: '1px solid #E5E5E5',
                      borderRadius: '8px',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '16px',
                      lineHeight: '150%',
                      color: '#000000',
                      background: '#FFFFFF',
                      flex: 1
                    }}
                  />
                  <span style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '16px',
                    fontWeight: 700,
                    color: '#666666'
                  }}>〜</span>
                  <input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    style={{
                      boxSizing: 'border-box',
                      padding: '12px 16px',
                      minHeight: '48px',
                      border: '1px solid #E5E5E5',
                      borderRadius: '8px',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '16px',
                      lineHeight: '150%',
                      color: '#000000',
                      background: '#FFFFFF',
                      flex: 1
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  lineHeight: '120%',
                  color: '#000000',
                  marginBottom: '10px',
                  display: 'block'
                }}>
                  会場
                </label>
                <input
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="会場名や地域名で検索"
                  style={{
                    boxSizing: 'border-box',
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
                  }}
                />
              </div>

              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '16px',
                lineHeight: '150%',
                color: '#000000'
              }}>
                <input
                  type="checkbox"
                  checked={onlyRecruiting}
                  onChange={(e) => setOnlyRecruiting(e.target.checked)}
                  style={{
                    width: '20px',
                    height: '20px'
                  }}
                />
                募集中のイベントのみ表示
              </label>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
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
                  この条件で検索
                </button>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  style={{
                    width: '120px',
                    height: '48px',
                    background: '#FFFFFF',
                    border: '1px solid #E5E5E5',
                    borderRadius: '8px',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '16px',
                    fontWeight: 700,
                    lineHeight: '19px',
                    color: '#000000',
                    cursor: 'pointer'
                  }}
                >
                  条件をクリア
                </button>
              </div>
            </form>
          </div>
        )}

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
  )
}
