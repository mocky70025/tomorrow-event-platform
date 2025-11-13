'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { supabase, type Event, type OrganizerProfile, type OrganizerMember } from '@/lib/supabase'
import ImageUpload from './ImageUpload'

interface EventFormProps {
  profile: OrganizerProfile
  currentMember: OrganizerMember
  onEventCreated: (event: Event) => void
  onCancel: () => void
  initialEvent?: Partial<Event> // 編集時に事前入力
}

interface EventFormState {
  event_name: string
  event_name_furigana: string
  genre: string
  is_shizuoka_vocational_assoc_related: boolean
  opt_out_newspaper_publication: boolean
  event_start_date: string
  event_end_date: string
  event_display_period: string
  event_period_notes: string
  event_time: string
  application_start_date: string
  application_end_date: string
  application_display_period: string
  application_notes: string
  ticket_release_start_date: string
  ticket_sales_location: string
  lead_text: string
  event_description: string
  event_introduction_text: string
  venue_name: string
  venue_postal_code: string
  venue_city: string
  venue_town: string
  venue_address: string
  venue_latitude: string
  venue_longitude: string
  homepage_url: string
  related_page_url: string
  contact_name: string
  contact_phone: string
  contact_email: string
  parking_info: string
  fee_info: string
  organizer_info: string
}

interface EventImageState {
  main: string
  additional1: string
  additional2: string
  additional3: string
  additional4: string
}

interface EventFormDraftPayload {
  formData: EventFormState
  imageUrls: EventImageState
}

const SAVE_DEBOUNCE_MS = 800
const EVENT_FORM_DRAFT_TYPE = 'organizer_event_form'

const EVENT_FORM_EMPTY_STATE: EventFormState = {
  event_name: '',
  event_name_furigana: '',
  genre: '',
  is_shizuoka_vocational_assoc_related: false,
  opt_out_newspaper_publication: false,
  event_start_date: '',
  event_end_date: '',
  event_display_period: '',
  event_period_notes: '',
  event_time: '',
  application_start_date: '',
  application_end_date: '',
  application_display_period: '',
  application_notes: '',
  ticket_release_start_date: '',
  ticket_sales_location: '',
  lead_text: '',
  event_description: '',
  event_introduction_text: '',
  venue_name: '',
  venue_postal_code: '',
  venue_city: '',
  venue_town: '',
  venue_address: '',
  venue_latitude: '',
  venue_longitude: '',
  homepage_url: '',
  related_page_url: '',
  contact_name: '',
  contact_phone: '',
  contact_email: '',
  parking_info: '',
  fee_info: '',
  organizer_info: '',
}

const EVENT_IMAGE_INITIAL: EventImageState = {
  main: '',
  additional1: '',
  additional2: '',
  additional3: '',
  additional4: '',
}

const hasEventDraftContent = (payload: EventFormDraftPayload): boolean => {
  const hasFormValue = Object.values(payload.formData).some((value) => {
    if (typeof value === 'string') return value.trim() !== ''
    if (typeof value === 'boolean') return value
    if (typeof value === 'number') return value !== 0
    return false
  })

  if (hasFormValue) return true

  const hasImage = Object.values(payload.imageUrls).some((value) => value.trim() !== '')
  return hasImage
}

export default function EventForm({ profile, currentMember, onEventCreated, onCancel, initialEvent }: EventFormProps) {
  const isDraftEnabled = !initialEvent
  const draftUserKey = currentMember?.line_user_id || profile.id

  const initialFormState = useMemo<EventFormState>(() => ({
    ...EVENT_FORM_EMPTY_STATE,
    event_name: initialEvent?.event_name || '',
    event_name_furigana: (initialEvent as any)?.event_name_furigana || '',
    genre: initialEvent?.genre || '',
    is_shizuoka_vocational_assoc_related: (initialEvent as any)?.is_shizuoka_vocational_assoc_related || false,
    opt_out_newspaper_publication: (initialEvent as any)?.opt_out_newspaper_publication || false,
    event_start_date: (initialEvent?.event_start_date as any) ? String(initialEvent?.event_start_date).split('T')[0] : '',
    event_end_date: (initialEvent?.event_end_date as any) ? String(initialEvent?.event_end_date).split('T')[0] : '',
    event_display_period: initialEvent?.event_display_period || '',
    event_period_notes: (initialEvent as any)?.event_period_notes || '',
    event_time: initialEvent?.event_time || '',
    application_start_date: (initialEvent as any)?.application_start_date ? String((initialEvent as any).application_start_date).split('T')[0] : '',
    application_end_date: (initialEvent as any)?.application_end_date ? String((initialEvent as any).application_end_date).split('T')[0] : '',
    application_display_period: (initialEvent as any)?.application_display_period || '',
    application_notes: (initialEvent as any)?.application_notes || '',
    ticket_release_start_date: (initialEvent as any)?.ticket_release_start_date ? String((initialEvent as any).ticket_release_start_date).split('T')[0] : '',
    ticket_sales_location: (initialEvent as any)?.ticket_sales_location || '',
    lead_text: initialEvent?.lead_text || '',
    event_description: initialEvent?.event_description || '',
    event_introduction_text: (initialEvent as any)?.event_introduction_text || '',
    venue_name: initialEvent?.venue_name || '',
    venue_postal_code: (initialEvent as any)?.venue_postal_code || '',
    venue_city: initialEvent?.venue_city || '',
    venue_town: (initialEvent as any)?.venue_town || '',
    venue_address: (initialEvent as any)?.venue_address || '',
    venue_latitude: (initialEvent as any)?.venue_latitude ? String((initialEvent as any).venue_latitude) : '',
    venue_longitude: (initialEvent as any)?.venue_longitude ? String((initialEvent as any).venue_longitude) : '',
    homepage_url: initialEvent?.homepage_url || '',
    related_page_url: (initialEvent as any)?.related_page_url || '',
    contact_name: (initialEvent as any)?.contact_name || '',
    contact_phone: (initialEvent as any)?.contact_phone || '',
    contact_email: (initialEvent as any)?.contact_email || '',
    parking_info: (initialEvent as any)?.parking_info || '',
    fee_info: (initialEvent as any)?.fee_info || '',
    organizer_info: (initialEvent as any)?.organizer_info || '',
  }), [initialEvent])

  const initialImageState = useMemo<EventImageState>(() => ({
    ...EVENT_IMAGE_INITIAL,
    main: initialEvent?.main_image_url || '',
    additional1: (initialEvent as any)?.additional_image1_url || '',
    additional2: (initialEvent as any)?.additional_image2_url || '',
    additional3: (initialEvent as any)?.additional_image3_url || '',
    additional4: (initialEvent as any)?.additional_image4_url || '',
  }), [initialEvent])

  const [loading, setLoading] = useState(false)
  const [addressLoading, setAddressLoading] = useState(false)
  const [eventId, setEventId] = useState<string>((initialEvent?.id as string) || '')
  const [formData, setFormData] = useState<EventFormState>(initialFormState)
  const [imageUrls, setImageUrls] = useState<EventImageState>(initialImageState)
  const [draftLoaded, setDraftLoaded] = useState(() => !isDraftEnabled)

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastPayloadRef = useRef<string>('')
  const draftExistsRef = useRef(false)
  useEffect(() => {
    setFormData(initialFormState)
    setImageUrls(initialImageState)
  }, [initialFormState, initialImageState])


  const upsertDraft = useCallback(
    async (payload: EventFormDraftPayload) => {
      if (!isDraftEnabled || !draftUserKey) return
      const { error } = await supabase
        .from('form_drafts')
        .upsert(
          {
            user_id: draftUserKey,
            form_type: EVENT_FORM_DRAFT_TYPE,
            payload,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id, form_type' }
        )

      if (error) throw error
      draftExistsRef.current = true
    },
    [draftUserKey, isDraftEnabled]
  )

  const removeDraft = useCallback(async () => {
    if (!isDraftEnabled || !draftUserKey || !draftExistsRef.current) return
    const { error } = await supabase
      .from('form_drafts')
      .delete()
      .eq('user_id', draftUserKey)
      .eq('form_type', EVENT_FORM_DRAFT_TYPE)

    if (error) throw error
    draftExistsRef.current = false
  }, [draftUserKey, isDraftEnabled])

  const scheduleDraftUpsert = useCallback(
    (payload: EventFormDraftPayload) => {
      if (!isDraftEnabled) return

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      saveTimeoutRef.current = setTimeout(async () => {
        saveTimeoutRef.current = null
        try {
          await upsertDraft(payload)
        } catch (error) {
          console.error('Failed to save event form draft:', error)
        }
      }, SAVE_DEBOUNCE_MS)
    },
    [isDraftEnabled, upsertDraft]
  )

  const scheduleDraftDeletion = useCallback(() => {
    if (!isDraftEnabled || !draftExistsRef.current) return

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(async () => {
      saveTimeoutRef.current = null
      try {
        await removeDraft()
      } catch (error) {
        console.error('Failed to delete event form draft:', error)
      }
    }, SAVE_DEBOUNCE_MS)
  }, [isDraftEnabled, removeDraft])
  const handleClearForm = useCallback(() => {
    setFormData(initialFormState)
    setImageUrls(initialImageState)
    lastPayloadRef.current = ''
    if (isDraftEnabled) {
      scheduleDraftDeletion()
    }
    onCancel()
  }, [initialFormState, initialImageState, isDraftEnabled, scheduleDraftDeletion, onCancel])


  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!isDraftEnabled) return
    let isCancelled = false

    const loadDraft = async () => {
      if (!draftUserKey) {
        if (!isCancelled) setDraftLoaded(true)
        return
      }

      try {
        const { data, error } = await supabase
          .from('form_drafts')
          .select('payload')
          .eq('user_id', draftUserKey)
          .eq('form_type', EVENT_FORM_DRAFT_TYPE)
          .limit(1)

        if (error) throw error

        const record = data?.[0]

        if (record?.payload && !isCancelled) {
          const payload = record.payload as Partial<EventFormDraftPayload>
          const restoredFormData: EventFormState = {
            ...EVENT_FORM_EMPTY_STATE,
            ...(payload.formData ?? {}),
          }
          const restoredImages: EventImageState = {
            ...EVENT_IMAGE_INITIAL,
            ...(payload.imageUrls ?? {}),
          }

          setFormData(restoredFormData)
          setImageUrls(restoredImages)

          draftExistsRef.current = true
          lastPayloadRef.current = JSON.stringify({
            formData: restoredFormData,
            imageUrls: restoredImages,
          })
        }
      } catch (error) {
        console.error('Failed to load event form draft:', error)
      } finally {
        if (!isCancelled) setDraftLoaded(true)
      }
    }

    loadDraft()

    return () => {
      isCancelled = true
    }
  }, [draftUserKey, isDraftEnabled])

  useEffect(() => {
    if (!isDraftEnabled || !draftLoaded) return

    const payload: EventFormDraftPayload = {
      formData,
      imageUrls,
    }

    if (!hasEventDraftContent(payload)) {
      lastPayloadRef.current = ''
      scheduleDraftDeletion()
      return
    }

    const serializedPayload = JSON.stringify(payload)
    if (lastPayloadRef.current === serializedPayload) return

    lastPayloadRef.current = serializedPayload
    scheduleDraftUpsert(payload)
  }, [formData, imageUrls, isDraftEnabled, draftLoaded, scheduleDraftUpsert, scheduleDraftDeletion])

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

  const cardStyle = {
    background: '#FFFFFF',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px'
  }

  const sectionTitleStyle = {
    fontFamily: 'Inter, sans-serif',
    fontSize: '16px',
    fontWeight: 700,
    lineHeight: '120%',
    color: '#000000',
    marginBottom: '24px',
    textAlign: 'center' as const
  }

  const fieldsContainerStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
    alignItems: 'center' as const
  }

  const fieldWrapperStyle = {
    width: '100%',
    maxWidth: '330px',
    position: 'relative' as const
  }

  const labelStyle = {
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
    fontWeight: 500,
    lineHeight: '120%',
    color: '#000000',
    marginBottom: '10px',
    display: 'block' as const
  }

  const formFieldStyle = (hasError: boolean, options?: { minHeight?: number }) => ({
    boxSizing: 'border-box' as const,
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: options?.minHeight && options.minHeight > 48 ? 'flex-start' : 'center',
    padding: '12px 16px',
    gap: '10px',
    width: '100%',
    minWidth: 0,
    minHeight: options?.minHeight ?? 56,
    background: '#FFFFFF',
    border: hasError ? '1px solid #FF3B30' : '1px solid #E5E5E5',
    borderRadius: '8px'
  })

  const inputStyle = (hasValue: boolean) => ({
    fontFamily: 'Inter, sans-serif',
    fontSize: '16px',
    lineHeight: '150%',
    color: hasValue ? '#000000' : '#6B6B6B',
    border: 'none',
    outline: 'none',
    width: '100%',
    background: 'transparent',
    textAlign: 'left' as const
  })

  const textareaStyle = (hasValue: boolean) => ({
    fontFamily: 'Inter, sans-serif',
    fontSize: '16px',
    lineHeight: '150%',
    color: hasValue ? '#000000' : '#6B6B6B',
    border: 'none',
    outline: 'none',
    width: '100%',
    background: 'transparent',
    resize: 'none' as const
  })

  const buttonPrimaryStyle = {
    display: 'flex',
    flexDirection: 'row' as const,
    justifyContent: 'center',
    alignItems: 'center',
    padding: '16px 24px',
    gap: '10px',
    width: '100%',
    maxWidth: '157px',
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
  }

  const buttonSecondaryStyle = {
    display: 'flex',
    flexDirection: 'row' as const,
    justifyContent: 'center',
    alignItems: 'center',
    padding: '16px 24px',
    gap: '10px',
    width: '100%',
    maxWidth: '157px',
    height: '48px',
    background: '#FFFFFF',
    borderRadius: '8px',
    border: '1px solid #E5E5E5',
    fontFamily: 'Inter, sans-serif',
    fontSize: '16px',
    fontWeight: 700,
    lineHeight: '19px',
    color: '#000000',
    cursor: 'pointer'
  }

  const rangeContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    padding: '12px 16px',
    minHeight: 56,
    background: '#FFFFFF',
    border: '1px solid #E5E5E5',
    borderRadius: '8px',
    boxSizing: 'border-box' as const,
    minWidth: 0
  }

  const rangeSeparatorStyle = {
    fontFamily: 'Inter, sans-serif',
    fontSize: '16px',
    fontWeight: 700,
    color: '#666666',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 4px'
  }

  // 必須項目のバリデーション（最初の未入力へスクロール＆フォーカス）
  const validateRequired = (): { ok: boolean; message?: string } => {
    const requiredList: Array<{ key: keyof typeof formData; label: string }> = [
      { key: 'event_name', label: 'イベント名称' },
      { key: 'event_name_furigana', label: 'イベント名称フリガナ' },
      { key: 'genre', label: 'ジャンル' },
      { key: 'event_start_date', label: '開催開始日' },
      { key: 'event_end_date', label: '開催終了日' },
      { key: 'event_display_period', label: '開催期間(表示用)' },
      { key: 'lead_text', label: 'リード文' },
      { key: 'event_description', label: 'イベント紹介文' },
      { key: 'venue_name', label: '会場名称' },
      { key: 'contact_name', label: '問い合わせ先名称' },
      { key: 'contact_phone', label: '電話番号' },
    ]

    for (const { key, label } of requiredList) {
      const value = (formData as any)[key]
      if (value === undefined || value === null || String(value).trim() === '') {
        const el = document.getElementById(`field-${String(key)}`)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          ;(el as HTMLInputElement).focus()
        }
        return { ok: false, message: `${label}を入力してください。` }
      }
    }
    
    return { ok: true }
  }


  // 郵便番号から住所を取得する関数
  const fetchAddressFromPostalCode = async (postalCode: string) => {
    if (!postalCode || postalCode.length !== 7) return

    setAddressLoading(true)
    try {
      const response = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${postalCode}`)
      const data = await response.json()
      
      if (data.status === 200 && data.results && data.results.length > 0) {
        const result = data.results[0]
        setFormData(prev => ({
          ...prev,
          venue_city: prefectures.includes(result.address1) ? result.address1 : '',
          venue_town: result.address2 || '',
          venue_address: result.address3 || '',
        }))
      } else {
        alert('郵便番号が見つかりませんでした。')
      }
    } catch (error) {
      console.error('Address fetch error:', error)
      alert('住所の取得に失敗しました。')
    } finally {
      setAddressLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // 更新モードかどうかを明確に判定（initialEventが渡されている or eventIdが存在）
    // tryブロック外で定義してcatchからも参照可能にする
    const isUpdateMode = !!(initialEvent?.id || eventId)
    const targetEventId = initialEvent?.id || eventId

    try {
      // 必須フィールドのバリデーション（未入力項目へスクロール＆フォーカス）
      const result = validateRequired()
      if (!result.ok) {
        alert(result.message)
        return
      }

      // 送信データの最終チェック
      const submitData: any = {
        ...formData,
        organizer_profile_id: profile.id,
        venue_latitude: formData.venue_latitude ? parseFloat(formData.venue_latitude) : null,
        venue_longitude: formData.venue_longitude ? parseFloat(formData.venue_longitude) : null,
      }

      // 作成時のみ、空文字をnullに変換（更新時は既存値を保持したいので変換しない）
      if (!targetEventId) {
        Object.keys(submitData).forEach(key => {
          if (submitData[key] === '') {
            submitData[key] = null
          }
        })
      }

      console.log('Submitting event data:', submitData)

      let finalEvent

      if (isUpdateMode && targetEventId) {
        // 更新フロー: 空文字は上書きしない（既存値保持）。
        const updatePayload: any = {}
        Object.entries(submitData).forEach(([key, value]) => {
          if (value === '' || value === undefined) return // skip empty
          updatePayload[key] = value
        })
        // 画像は指定があるものだけ更新
        if (imageUrls.main) updatePayload.main_image_url = imageUrls.main
        if (imageUrls.additional1) updatePayload.additional_image1_url = imageUrls.additional1
        if (imageUrls.additional2) updatePayload.additional_image2_url = imageUrls.additional2
        if (imageUrls.additional3) updatePayload.additional_image3_url = imageUrls.additional3
        if (imageUrls.additional4) updatePayload.additional_image4_url = imageUrls.additional4

        // 可変でnullを許す日付フィールドは明示的にnullを指定したい場合にのみ対応
        // （UIで空にしただけでは上書きしない方針）

        const { data: updated, error: updateError } = await supabase
          .from('events')
          .update(updatePayload)
          .eq('id', targetEventId)
          .select()
          .single()

        if (updateError) throw updateError
        finalEvent = updated
      } else {
        // 作成フロー
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .insert(submitData)
          .select()
          .single()

        if (eventError) throw eventError
        setEventId(eventData.id)

        const { data: updatedData, error: updateError } = await supabase
          .from('events')
          .update({
            main_image_url: imageUrls.main || null,
            additional_image1_url: imageUrls.additional1 || null,
            additional_image2_url: imageUrls.additional2 || null,
            additional_image3_url: imageUrls.additional3 || null,
            additional_image4_url: imageUrls.additional4 || null,
          })
          .eq('id', eventData.id)
          .select()
          .single()

        if (updateError) throw updateError
        finalEvent = updatedData
      }

      if (!isUpdateMode) {
        try {
          await removeDraft()
          lastPayloadRef.current = ''
          setDraftLoaded(false)
        } catch (draftError) {
          console.error('Failed to clear event form draft after submit:', draftError)
        }
      }

      onEventCreated(finalEvent)
    } catch (error) {
      console.error('Event creation failed:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      
      let errorMessage = '不明なエラー'
      
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'object' && error !== null) {
        // Supabase error objectの場合
        if ('message' in error) {
          errorMessage = String(error.message)
        } else if ('details' in error) {
          errorMessage = String(error.details)
        } else if ('hint' in error) {
          errorMessage = String(error.hint)
        } else {
          errorMessage = JSON.stringify(error)
        }
      }
      
      alert(`イベントの${isUpdateMode ? '更新' : '作成'}に失敗しました。エラー: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#F7F7F7', minHeight: '100vh' }}>
      <div className="container mx-auto" style={{ padding: '9px 16px', maxWidth: '394px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '24px', marginBottom: '24px' }}>
          <button
            type="button"
            onClick={onCancel}
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
          }}>
            {eventId ? 'イベント編集' : 'イベント掲載'}
          </h1>
          <div style={{ width: '60px' }}></div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* 基本情報 */}
          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>基本情報</h2>
            <div style={fieldsContainerStyle}>
              <div style={fieldWrapperStyle}>
                <label style={labelStyle}>イベント名称</label>
                <div style={formFieldStyle(false)}>
                  <input
                    id="field-event_name"
                    type="text"
                    required
                    maxLength={50}
                    value={formData.event_name}
                    onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
                    style={inputStyle(!!formData.event_name)}
                    placeholder="イベント名称を入力"
                  />
                </div>
              </div>

              <div style={fieldWrapperStyle}>
                <label style={labelStyle}>イベント名称フリガナ</label>
                <div style={formFieldStyle(false)}>
                  <input
                    id="field-event_name_furigana"
                    type="text"
                    required
                    maxLength={50}
                    value={formData.event_name_furigana}
                    onChange={(e) => setFormData({ ...formData, event_name_furigana: e.target.value })}
                    style={inputStyle(!!formData.event_name_furigana)}
                    placeholder="イベント名称フリガナを入力"
                  />
                </div>
              </div>

              <div style={fieldWrapperStyle}>
                <label style={labelStyle}>ジャンル</label>
                <div style={formFieldStyle(false)}>
                  <select
                    id="field-genre"
                    required
                    value={formData.genre}
                    onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                    style={{
                      ...inputStyle(!!formData.genre),
                      appearance: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">選択してください</option>
                    <option value="祭り・花火大会">祭り・花火大会</option>
                    <option value="音楽・ライブ">音楽・ライブ</option>
                    <option value="スポーツ">スポーツ</option>
                    <option value="文化・芸術">文化・芸術</option>
                    <option value="その他">その他</option>
                  </select>
                </div>
              </div>

              <div style={{ width: '100%', maxWidth: '330px' }}>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, lineHeight: '120%', color: '#000000', marginBottom: '12px' }}>チェック項目（任意）</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '16px', lineHeight: '150%', color: '#000000' }}>
                    <span style={{
                      width: '24px',
                      height: '24px',
                      background: formData.is_shizuoka_vocational_assoc_related ? '#06C755' : '#FFFFFF',
                      border: formData.is_shizuoka_vocational_assoc_related ? 'none' : '1px solid #E5E5E5',
                      borderRadius: '8px',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <input
                        type="checkbox"
                        checked={formData.is_shizuoka_vocational_assoc_related}
                        onChange={(e) => setFormData({ ...formData, is_shizuoka_vocational_assoc_related: e.target.checked })}
                        style={{ position: 'absolute', width: '24px', height: '24px', opacity: 0, cursor: 'pointer' }}
                      />
                      {formData.is_shizuoka_vocational_assoc_related && (
                        <svg style={{ width: '16px', height: '13px', color: '#FFFFFF' }} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </span>
                    静岡県職業教育振興会関係者
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '16px', lineHeight: '150%', color: '#000000' }}>
                    <span style={{
                      width: '24px',
                      height: '24px',
                      background: formData.opt_out_newspaper_publication ? '#06C755' : '#FFFFFF',
                      border: formData.opt_out_newspaper_publication ? 'none' : '1px solid #E5E5E5',
                      borderRadius: '8px',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <input
                        type="checkbox"
                        checked={formData.opt_out_newspaper_publication}
                        onChange={(e) => setFormData({ ...formData, opt_out_newspaper_publication: e.target.checked })}
                        style={{ position: 'absolute', width: '24px', height: '24px', opacity: 0, cursor: 'pointer' }}
                      />
                      {formData.opt_out_newspaper_publication && (
                        <svg style={{ width: '16px', height: '13px', color: '#FFFFFF' }} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </span>
                    新聞掲載を希望しない
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* 開催期間 */}
          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>開催期間</h2>
            <div style={fieldsContainerStyle}>
              <div style={fieldWrapperStyle}>
                <label style={labelStyle}>イベント開催期間</label>
                <div style={rangeContainerStyle}>
                  <input
                    id="field-event_start_date"
                    type="date"
                    required
                    value={formData.event_start_date}
                    onChange={(e) => setFormData({ ...formData, event_start_date: e.target.value })}
                    style={{ ...inputStyle(!!formData.event_start_date), flex: 1 }}
                  />
                  <span style={rangeSeparatorStyle}>〜</span>
                  <input
                    id="field-event_end_date"
                    type="date"
                    required
                    value={formData.event_end_date}
                    onChange={(e) => setFormData({ ...formData, event_end_date: e.target.value })}
                    style={{ ...inputStyle(!!formData.event_end_date), flex: 1 }}
                  />
                </div>
              </div>

              <div style={fieldWrapperStyle}>
                <label style={labelStyle}>イベント開催期間(表示用)</label>
                <div style={formFieldStyle(false)}>
                  <input
                    id="field-event_display_period"
                    type="text"
                    required
                    maxLength={50}
                    value={formData.event_display_period}
                    onChange={(e) => setFormData({ ...formData, event_display_period: e.target.value })}
                    style={inputStyle(!!formData.event_display_period)}
                    placeholder="2025年9月20日(土) のように入力"
                  />
                </div>
              </div>

              <div style={fieldWrapperStyle}>
                <label style={labelStyle}>開催期間に関する補足（任意）</label>
                <div style={formFieldStyle(false, { minHeight: 96 })}>
                  <textarea
                    value={formData.event_period_notes}
                    onChange={(e) => setFormData({ ...formData, event_period_notes: e.target.value })}
                    style={{ ...textareaStyle(!!formData.event_period_notes), minHeight: '72px' }}
                    placeholder="補足事項があれば入力してください"
                  />
                </div>
              </div>

              <div style={fieldWrapperStyle}>
                <label style={labelStyle}>開催時間（任意）</label>
                <div style={formFieldStyle(false)}>
                  <input
                    type="text"
                    value={formData.event_time}
                    onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                    style={inputStyle(!!formData.event_time)}
                    placeholder="14:00〜17:00 など"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 申し込み期間 */}
          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>申し込み期間（任意）</h2>
            <div style={fieldsContainerStyle}>
              <div style={fieldWrapperStyle}>
                <label style={labelStyle}>申し込み期間（任意）</label>
                <div style={rangeContainerStyle}>
                  <input
                    type="date"
                    value={formData.application_start_date}
                    onChange={(e) => setFormData({ ...formData, application_start_date: e.target.value })}
                    style={{ ...inputStyle(!!formData.application_start_date), flex: 1 }}
                  />
                  <span style={rangeSeparatorStyle}>〜</span>
                  <input
                    type="date"
                    value={formData.application_end_date}
                    onChange={(e) => setFormData({ ...formData, application_end_date: e.target.value })}
                    style={{ ...inputStyle(!!formData.application_end_date), flex: 1 }}
                  />
                </div>
              </div>

              <div style={fieldWrapperStyle}>
                <label style={labelStyle}>申し込み期間(表示用)（任意）</label>
                <div style={formFieldStyle(false)}>
                  <input
                    type="text"
                    value={formData.application_display_period}
                    onChange={(e) => setFormData({ ...formData, application_display_period: e.target.value })}
                    style={inputStyle(!!formData.application_display_period)}
                    placeholder="2025年8月1日〜8月31日 など"
                  />
                </div>
              </div>

              <div style={fieldWrapperStyle}>
                <label style={labelStyle}>申し込みに関する補足（任意）</label>
                <div style={formFieldStyle(false, { minHeight: 96 })}>
                  <textarea
                    value={formData.application_notes}
                    onChange={(e) => setFormData({ ...formData, application_notes: e.target.value })}
                    style={{ ...textareaStyle(!!formData.application_notes), minHeight: '72px' }}
                    placeholder="補足事項があれば入力してください"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* チケット情報 */}
          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>チケット情報（任意）</h2>
            <div style={fieldsContainerStyle}>
              <div style={fieldWrapperStyle}>
                <label style={labelStyle}>チケット発売開始日（任意）</label>
                <div style={formFieldStyle(false)}>
                  <input
                    type="date"
                    value={formData.ticket_release_start_date}
                    onChange={(e) => setFormData({ ...formData, ticket_release_start_date: e.target.value })}
                    style={inputStyle(!!formData.ticket_release_start_date)}
                  />
                </div>
              </div>

              <div style={fieldWrapperStyle}>
                <label style={labelStyle}>チケット販売場所（任意）</label>
                <div style={formFieldStyle(false)}>
                  <input
                    type="text"
                    value={formData.ticket_sales_location}
                    onChange={(e) => setFormData({ ...formData, ticket_sales_location: e.target.value })}
                    style={inputStyle(!!formData.ticket_sales_location)}
                    placeholder="チケット販売場所"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* イベント内容 */}
          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>イベント内容</h2>
            <div style={fieldsContainerStyle}>
              <div style={fieldWrapperStyle}>
                <label style={labelStyle}>リード文</label>
                <div style={formFieldStyle(false, { minHeight: 120 })}>
                  <textarea
                    id="field-lead_text"
                    required
                    maxLength={100}
                    value={formData.lead_text}
                    onChange={(e) => setFormData({ ...formData, lead_text: e.target.value })}
                    style={{ ...textareaStyle(!!formData.lead_text), minHeight: '96px' }}
                  />
                </div>
              </div>

              <div style={fieldWrapperStyle}>
                <label style={labelStyle}>イベント紹介文</label>
                <div style={formFieldStyle(false, { minHeight: 140 })}>
                  <textarea
                    id="field-event_description"
                    required
                    maxLength={250}
                    value={formData.event_description}
                    onChange={(e) => setFormData({ ...formData, event_description: e.target.value })}
                    style={{ ...textareaStyle(!!formData.event_description), minHeight: '120px' }}
                  />
                </div>
              </div>

              <div style={fieldWrapperStyle}>
                <label style={labelStyle}>イベント紹介文（長文）（任意）</label>
                <div style={formFieldStyle(false, { minHeight: 140 })}>
                  <textarea
                    value={formData.event_introduction_text}
                    onChange={(e) => setFormData({ ...formData, event_introduction_text: e.target.value })}
                    style={{ ...textareaStyle(!!formData.event_introduction_text), minHeight: '120px' }}
                    placeholder="イベントの詳細を入力してください"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* イベント画像 */}
          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>イベント画像（任意）</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
              <ImageUpload
                label="メイン画像（任意）"
                eventId={eventId || 'temp'}
                imageType="main"
                onUploadComplete={(url) => setImageUrls(prev => ({ ...prev, main: url }))}
                onUploadError={(error) => alert(error)}
                currentImageUrl={imageUrls.main}
                showFormatNote={false}
                onImageDelete={() => setImageUrls(prev => ({ ...prev, main: '' }))}
              />
              <ImageUpload
                label="追加画像1（任意）"
                eventId={eventId || 'temp'}
                imageType="additional"
                imageIndex={1}
                onUploadComplete={(url) => setImageUrls(prev => ({ ...prev, additional1: url }))}
                onUploadError={(error) => alert(error)}
                currentImageUrl={imageUrls.additional1}
                showFormatNote={false}
                onImageDelete={() => setImageUrls(prev => ({ ...prev, additional1: '' }))}
              />
              <ImageUpload
                label="追加画像2（任意）"
                eventId={eventId || 'temp'}
                imageType="additional"
                imageIndex={2}
                onUploadComplete={(url) => setImageUrls(prev => ({ ...prev, additional2: url }))}
                onUploadError={(error) => alert(error)}
                currentImageUrl={imageUrls.additional2}
                showFormatNote={false}
                onImageDelete={() => setImageUrls(prev => ({ ...prev, additional2: '' }))}
              />
              <ImageUpload
                label="追加画像3（任意）"
                eventId={eventId || 'temp'}
                imageType="additional"
                imageIndex={3}
                onUploadComplete={(url) => setImageUrls(prev => ({ ...prev, additional3: url }))}
                onUploadError={(error) => alert(error)}
                currentImageUrl={imageUrls.additional3}
                showFormatNote={false}
                onImageDelete={() => setImageUrls(prev => ({ ...prev, additional3: '' }))}
              />
              <ImageUpload
                label="追加画像4（任意）"
                eventId={eventId || 'temp'}
                imageType="additional"
                imageIndex={4}
                onUploadComplete={(url) => setImageUrls(prev => ({ ...prev, additional4: url }))}
                onUploadError={(error) => alert(error)}
                currentImageUrl={imageUrls.additional4}
                showFormatNote={false}
                onImageDelete={() => setImageUrls(prev => ({ ...prev, additional4: '' }))}
              />
            </div>
            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '12px',
              lineHeight: '150%',
              color: '#6B6B6B',
              marginTop: '16px',
              textAlign: 'center'
            }}>
              対応形式: JPG, PNG, GIF, WebP（最大10MB）
            </p>
          </div>

          {/* 会場情報 */}
          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>会場情報</h2>
            <div style={fieldsContainerStyle}>
              <div style={fieldWrapperStyle}>
                <label style={labelStyle}>会場又は集合場所の名称</label>
                <div style={formFieldStyle(false)}>
                  <input
                    id="field-venue_name"
                    type="text"
                    required
                    value={formData.venue_name}
                    onChange={(e) => setFormData({ ...formData, venue_name: e.target.value })}
                    style={inputStyle(!!formData.venue_name)}
                  />
                </div>
              </div>

              <div style={fieldWrapperStyle}>
                <label style={labelStyle}>郵便番号（任意）</label>
                <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                  <div style={{ ...formFieldStyle(false), flex: 1 }}>
                    <input
                      id="field-venue_postal_code"
                      type="text"
                      value={formData.venue_postal_code}
                      onChange={(e) => setFormData({ ...formData, venue_postal_code: e.target.value })}
                      style={inputStyle(!!formData.venue_postal_code)}
                      placeholder="1234567"
                      maxLength={7}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => fetchAddressFromPostalCode(formData.venue_postal_code)}
                    disabled={addressLoading || formData.venue_postal_code.length !== 7}
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '14px',
                      fontWeight: 700,
                      lineHeight: '17px',
                      color: '#FFFFFF',
                      background: addressLoading || formData.venue_postal_code.length !== 7 ? '#D9D9D9' : '#06C755',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      cursor: addressLoading || formData.venue_postal_code.length !== 7 ? 'not-allowed' : 'pointer',
                      height: '48px'
                    }}
                  >
                    {addressLoading ? '取得中...' : '住所取得'}
                  </button>
                </div>
              </div>

              <div style={fieldWrapperStyle}>
                <label style={labelStyle}>都道府県（任意）</label>
                <div style={formFieldStyle(false)}>
                  <select
                    value={formData.venue_city}
                    onChange={(e) => setFormData({ ...formData, venue_city: e.target.value })}
                    style={{
                      ...inputStyle(!!formData.venue_city),
                      appearance: 'none',
                      cursor: 'pointer',
                      background: 'transparent'
                    }}
                  >
                    <option value="">選択してください</option>
                    {prefectures.map((prefecture) => (
                      <option key={prefecture} value={prefecture}>{prefecture}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={fieldWrapperStyle}>
                <label style={labelStyle}>市区町村（任意）</label>
                <div style={formFieldStyle(false)}>
                  <input
                    type="text"
                    value={formData.venue_town}
                    onChange={(e) => setFormData({ ...formData, venue_town: e.target.value })}
                    style={inputStyle(!!formData.venue_town)}
                  />
                </div>
              </div>

              <div style={fieldWrapperStyle}>
                <label style={labelStyle}>丁目番地号（任意）</label>
                <div style={formFieldStyle(false)}>
                  <input
                    type="text"
                    value={formData.venue_address}
                    onChange={(e) => setFormData({ ...formData, venue_address: e.target.value })}
                    style={inputStyle(!!formData.venue_address)}
                  />
                </div>
              </div>

              <div style={fieldWrapperStyle}>
                <label style={labelStyle}>緯度（任意）</label>
                <div style={formFieldStyle(false)}>
                  <input
                    type="text"
                    value={formData.venue_latitude}
                    onChange={(e) => setFormData({ ...formData, venue_latitude: e.target.value })}
                    style={inputStyle(!!formData.venue_latitude)}
                    placeholder="34.975 など"
                  />
                </div>
              </div>

              <div style={fieldWrapperStyle}>
                <label style={labelStyle}>経度（任意）</label>
                <div style={formFieldStyle(false)}>
                  <input
                    type="text"
                    value={formData.venue_longitude}
                    onChange={(e) => setFormData({ ...formData, venue_longitude: e.target.value })}
                    style={inputStyle(!!formData.venue_longitude)}
                    placeholder="138.390 など"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* URL情報 */}
          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>URL情報（任意）</h2>
            <div style={fieldsContainerStyle}>
              <div style={fieldWrapperStyle}>
                <label style={labelStyle}>公式サイトURL（任意）</label>
                <div style={formFieldStyle(false)}>
                  <input
                    type="text"
                    value={formData.homepage_url}
                    onChange={(e) => setFormData({ ...formData, homepage_url: e.target.value })}
                    style={inputStyle(!!formData.homepage_url)}
                    placeholder="https://"
                  />
                </div>
              </div>

              <div style={fieldWrapperStyle}>
                <label style={labelStyle}>関連ページURL（任意）</label>
                <div style={formFieldStyle(false)}>
                  <input
                    type="text"
                    value={formData.related_page_url}
                    onChange={(e) => setFormData({ ...formData, related_page_url: e.target.value })}
                    style={inputStyle(!!formData.related_page_url)}
                    placeholder="https://"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 連絡先情報 */}
          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>連絡先情報</h2>
            <div style={fieldsContainerStyle}>
              <div style={fieldWrapperStyle}>
                <label style={labelStyle}>問い合わせ先名称</label>
                <div style={formFieldStyle(false)}>
                  <input
                    id="field-contact_name"
                    type="text"
                    required
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    style={inputStyle(!!formData.contact_name)}
                  />
                </div>
              </div>

              <div style={fieldWrapperStyle}>
                <label style={labelStyle}>電話番号</label>
                <div style={formFieldStyle(false)}>
                  <input
                    id="field-contact_phone"
                    type="tel"
                    required
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    style={inputStyle(!!formData.contact_phone)}
                  />
                </div>
              </div>

              <div style={fieldWrapperStyle}>
                <label style={labelStyle}>メールアドレス（任意）</label>
                <div style={formFieldStyle(false)}>
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    style={inputStyle(!!formData.contact_email)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* その他情報 */}
          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>その他情報（任意）</h2>
            <div style={fieldsContainerStyle}>
              <div style={fieldWrapperStyle}>
                <label style={labelStyle}>駐車場情報（任意）</label>
                <div style={formFieldStyle(false, { minHeight: 96 })}>
                  <textarea
                    value={formData.parking_info}
                    onChange={(e) => setFormData({ ...formData, parking_info: e.target.value })}
                    style={{ ...textareaStyle(!!formData.parking_info), minHeight: '72px' }}
                    placeholder="駐車場に関する情報を入力してください"
                  />
                </div>
              </div>

              <div style={fieldWrapperStyle}>
                <label style={labelStyle}>料金情報（任意）</label>
                <div style={formFieldStyle(false, { minHeight: 96 })}>
                  <textarea
                    value={formData.fee_info}
                    onChange={(e) => setFormData({ ...formData, fee_info: e.target.value })}
                    style={{ ...textareaStyle(!!formData.fee_info), minHeight: '72px' }}
                    placeholder="料金に関する情報を入力してください"
                  />
                </div>
              </div>

              <div style={fieldWrapperStyle}>
                <label style={labelStyle}>主催者情報（任意）</label>
                <div style={formFieldStyle(false, { minHeight: 96 })}>
                  <textarea
                    value={formData.organizer_info}
                    onChange={(e) => setFormData({ ...formData, organizer_info: e.target.value })}
                    style={{ ...textareaStyle(!!formData.organizer_info), minHeight: '72px' }}
                    placeholder="主催者に関する情報を入力してください"
                  />
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '24px', marginBottom: '24px' }}>
            <button
              type="button"
              onClick={handleClearForm}
              style={buttonSecondaryStyle}
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                ...buttonPrimaryStyle,
                background: loading ? '#D9D9D9' : '#06C755',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? (eventId ? '更新中...' : '作成中...') : (eventId ? 'イベント更新' : 'イベント掲載')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
