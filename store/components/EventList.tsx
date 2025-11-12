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
  prefecture: string
  city: string
}

export default function EventList({ userProfile, onBack }: EventListProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showSearchPage, setShowSearchPage] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [prefecture, setPrefecture] = useState('')
  const [city, setCity] = useState('')
  const [formKeyword, setFormKeyword] = useState('')
  const [formPeriodStart, setFormPeriodStart] = useState('')
  const [formPeriodEnd, setFormPeriodEnd] = useState('')
  const [formPrefecture, setFormPrefecture] = useState('')
  const [formCity, setFormCity] = useState('')
  const [hasSearched, setHasSearched] = useState(false)

  const prefectures = [
    '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
    '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
    '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県',
    '岐阜県', '静岡県', '愛知県', '三重県',
    '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県',
    '鳥取県', '島根県', '岡山県', '広島県', '山口県',
    '徳島県', '香川県', '愛媛県', '高知県',
    '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
  ]

  const normalizeForSearch = (value: string) => {
    if (!value) return ''
    let normalized = value.normalize('NFKC')
    normalized = normalized.replace(/[\u30A1-\u30F6]/g, char =>
      String.fromCharCode(char.charCodeAt(0) - 0x60)
    )
    return normalized.toLowerCase()
  }

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
        prefecture,
        city,
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

      const normalizedKeyword = normalizeForSearch(effectiveFilters.keyword)
      if (normalizedKeyword) {
        filteredEvents = filteredEvents.filter(event => {
          const fields = [event.event_name, event.event_description, event.lead_text]
            .filter(Boolean)
            .map(field => normalizeForSearch(field as string))
          return fields.some(field => field.includes(normalizedKeyword))
        })
      }

      const normalizedPrefecture = normalizeForSearch(effectiveFilters.prefecture)
      if (normalizedPrefecture) {
        filteredEvents = filteredEvents.filter(event => {
          const candidates = [event.venue_city, event.venue_address]
            .filter(Boolean)
            .map(field => normalizeForSearch(String(field)))
          return candidates.some(field => field.includes(normalizedPrefecture))
        })
      }

      const normalizedCity = normalizeForSearch(effectiveFilters.city)
      if (normalizedPrefecture && normalizedCity) {
        filteredEvents = filteredEvents.filter(event => {
          const candidates = [event.venue_city, event.venue_town, event.venue_address]
            .filter(Boolean)
            .map(field => normalizeForSearch(String(field)))
          return candidates.some(field => field.includes(normalizedCity))
        })
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

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event)
  }

  const handleOpenSearchPage = () => {
    setFormKeyword(keyword)
    setFormPeriodStart(periodStart)
    setFormPeriodEnd(periodEnd)
    setFormPrefecture(prefecture)
    setFormCity(city)
    setShowSearchPage(true)
  }

  const handleCloseSearchPage = () => {
    setShowSearchPage(false)
  }

  const handlePrefectureChange = (value: string) => {
    setFormPrefecture(value)
    if (!value) {
      setFormCity('')
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const nextKeyword = formKeyword.trim()
    const nextPeriodStart = formPeriodStart
    const nextPeriodEnd = formPeriodEnd
    const nextPrefecture = formPrefecture
    const nextCity = formPrefecture ? formCity.trim() : ''

    setKeyword(nextKeyword)
    setPeriodStart(nextPeriodStart)
    setPeriodEnd(nextPeriodEnd)
    setPrefecture(nextPrefecture)
    setCity(nextCity)
    setHasSearched(true)
    setShowSearchPage(false)

    fetchEvents({
      keyword: nextKeyword,
      periodStart: nextPeriodStart,
      periodEnd: nextPeriodEnd,
      prefecture: nextPrefecture,
      city: nextCity
    })
  }

  const handleClearSearch = () => {
    setFormKeyword('')
    setFormPeriodStart('')
    setFormPeriodEnd('')
    setFormPrefecture('')
    setFormCity('')
    setKeyword('')
    setPeriodStart('')
    setPeriodEnd('')
    setPrefecture('')
    setCity('')
    setHasSearched(false)
    fetchEvents({
      keyword: '',
      periodStart: '',
      periodEnd: '',
      prefecture: '',
      city: ''
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

  const searchEntryWrapperStyle = {
    display: 'flex',
    justifyContent: 'flex-start',
    paddingTop: '24px',
    marginBottom: '16px'
  }

  const searchEntryButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    minHeight: '48px',
    borderRadius: '8px',
    border: '1px solid #E5E5E5',
    background: '#FFFFFF',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    fontFamily: 'Inter, sans-serif',
    fontSize: '16px',
    fontWeight: 700,
    lineHeight: '120%',
    color: '#000000',
    cursor: 'pointer'
  }

  const searchEntryIconStyle = {
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#06C755'
  }

  const searchEntryLabelStyle = {
    lineHeight: '20px',
    whiteSpace: 'nowrap' as const
  }

  const searchCardStyle = {
    background: '#FFFFFF',
    borderRadius: '12px',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px'
  }

  const searchLabelStyle = {
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
    fontWeight: 500,
    lineHeight: '120%',
    color: '#000000'
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

  const rangeRowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%'
  }

  const rangeSeparatorStyle = {
    fontFamily: 'Inter, sans-serif',
    fontSize: '16px',
    fontWeight: 700,
    color: '#666666'
  }

  const selectStyle = {
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

  const actionRowStyle = {
    display: 'flex',
    gap: '12px',
    marginTop: '24px'
  }

  const secondaryButtonStyle = {
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

  const primaryButtonStyle = {
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

  if (showSearchPage) {
    const backButtonStyle = {
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
    }

    return (
      <div style={{ background: '#F7F7F7', minHeight: '100vh' }}>
        <div className="container mx-auto" style={{ padding: '9px 16px', maxWidth: '394px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingTop: '24px' }}>
            <button
              type="button"
              onClick={handleCloseSearchPage}
              style={backButtonStyle}
            >
              ← 戻る
            </button>
            <h1 style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '20px',
              fontWeight: 700,
              lineHeight: '120%',
              color: '#000000'
            }}>検索</h1>
            <div style={{ width: '60px' }}></div>
          </div>

          <form onSubmit={handleSearchSubmit}>
            <div style={searchCardStyle}>
              <div>
                <span style={searchLabelStyle}>キーワード（任意）</span>
                <div style={searchFieldContainerStyle}>
                  <span style={searchIconStyle} aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M11 4a7 7 0 0 1 5.472 11.41l3.559 3.558a1 1 0 0 1-1.414 1.414l-3.558-3.559A7 7 0 1 1 11 4zm0 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10z" fill="currentColor"/>
                    </svg>
                  </span>
                  <input
                    type="search"
                    value={formKeyword}
                    onChange={(e) => setFormKeyword(e.target.value)}
                    placeholder="イベント名や説明文で検索"
                    style={searchInputStyle}
                    aria-label="キーワードで検索"
                  />
                  {formKeyword && (
                    <button
                      type="button"
                      onClick={() => setFormKeyword('')}
                      style={clearButtonStyle}
                      aria-label="キーワードをクリア"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              <div>
                <span style={searchLabelStyle}>開催期間（任意）</span>
                <div style={rangeRowStyle}>
                  <input
                    type="date"
                    value={formPeriodStart}
                    onChange={(e) => setFormPeriodStart(e.target.value)}
                    style={{ ...selectStyle, flex: 1 }}
                  />
                  <span style={rangeSeparatorStyle}>〜</span>
                  <input
                    type="date"
                    value={formPeriodEnd}
                    onChange={(e) => setFormPeriodEnd(e.target.value)}
                    style={{ ...selectStyle, flex: 1 }}
                  />
                </div>
              </div>

              <div>
                <span style={searchLabelStyle}>都道府県（任意）</span>
                <select
                  value={formPrefecture}
                  onChange={(e) => handlePrefectureChange(e.target.value)}
                  style={selectStyle}
                >
                  <option value="">選択してください</option>
                  {prefectures.map((pref) => (
                    <option key={pref} value={pref}>{pref}</option>
                  ))}
                </select>
              </div>

              <div>
                <span style={searchLabelStyle}>市区町村（任意）</span>
                <input
                  type="text"
                  value={formCity}
                  onChange={(e) => setFormCity(e.target.value)}
                  placeholder="市区町村名を入力"
                  style={{
                    ...selectStyle,
                    color: formCity ? '#000000' : '#6B6B6B',
                    background: formPrefecture ? '#FFFFFF' : '#F5F5F5'
                  }}
                  disabled={!formPrefecture}
                />
              </div>
            </div>

            <div style={actionRowStyle}>
              <button type="button" onClick={handleClearSearch} style={secondaryButtonStyle}>
                条件をクリア
              </button>
              <button type="submit" style={primaryButtonStyle}>
                この条件で検索
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <>
      <div style={{ background: '#F7F7F7', minHeight: '100vh' }}>
        <div className="container mx-auto" style={{ padding: '9px 16px', maxWidth: '394px' }}>
        <div style={searchEntryWrapperStyle}>
          <button
            type="button"
            onClick={handleOpenSearchPage}
            style={searchEntryButtonStyle}
          >
            <span style={searchEntryIconStyle} aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M11 4a7 7 0 0 1 5.472 11.41l3.559 3.558a1 1 0 0 1-1.414 1.414l-3.558-3.559A7 7 0 1 1 11 4zm0 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10z" fill="currentColor"/>
              </svg>
            </span>
            <span style={searchEntryLabelStyle}>検索</span>
          </button>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h1 style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '20px',
            fontWeight: 700,
            lineHeight: '120%',
            color: '#000000',
            textAlign: 'center'
          }}>イベント一覧</h1>
        </div>

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
    </>
  )
}
