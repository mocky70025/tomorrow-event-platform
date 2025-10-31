'use client'

import { useState } from 'react'
import { supabase, type Event, type Organizer } from '@/lib/supabase'
import ImageUpload from './ImageUpload'

interface EventFormProps {
  organizer: Organizer
  onEventCreated: (event: Event) => void
  onCancel: () => void
  initialEvent?: Partial<Event> // 編集時に事前入力
}

export default function EventForm({ organizer, onEventCreated, onCancel, initialEvent }: EventFormProps) {
  const [formData, setFormData] = useState({
    event_name: initialEvent?.event_name || '',
    event_name_furigana: (initialEvent as any)?.event_name_furigana || '',
    genre: initialEvent?.genre || '',
    is_shizuoka_vocational_assoc_related: (initialEvent as any)?.is_shizuoka_vocational_assoc_related || false,
    opt_out_newspaper_publication: (initialEvent as any)?.opt_out_newspaper_publication || false,
    event_start_date: (initialEvent?.event_start_date as any) ? String(initialEvent.event_start_date).split('T')[0] : '',
    event_end_date: (initialEvent?.event_end_date as any) ? String(initialEvent.event_end_date).split('T')[0] : '',
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
  })

  const [loading, setLoading] = useState(false)
  const [addressLoading, setAddressLoading] = useState(false)
  const [eventId, setEventId] = useState<string>((initialEvent?.id as string) || '')
  const [imageUrls, setImageUrls] = useState({
    main: initialEvent?.main_image_url || '',
    additional1: (initialEvent as any)?.additional_image1_url || '',
    additional2: (initialEvent as any)?.additional_image2_url || '',
    additional3: (initialEvent as any)?.additional_image3_url || '',
    additional4: (initialEvent as any)?.additional_image4_url || '',
  })

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
          venue_city: result.address1, // 都道府県
          venue_town: result.address2, // 市区町村
          venue_address: result.address3, // 町名
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
        organizer_id: organizer.id,
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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">{eventId ? 'イベント編集' : 'イベント掲載'}</h1>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            キャンセル
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本情報 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">基本情報</h2>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  イベント名称 *
                </label>
                <input
                  id="field-event_name"
                  type="text"
                  required
                  maxLength={50}
                  value={formData.event_name}
                  onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  イベント名称フリガナ *
                </label>
                <input
                  id="field-event_name_furigana"
                  type="text"
                  required
                  maxLength={50}
                  value={formData.event_name_furigana}
                  onChange={(e) => setFormData({ ...formData, event_name_furigana: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ジャンル *
                </label>
                <select
                  id="field-genre"
                  required
                  value={formData.genre}
                  onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">選択してください</option>
                  <option value="祭り・花火大会">祭り・花火大会</option>
                  <option value="音楽・ライブ">音楽・ライブ</option>
                  <option value="スポーツ">スポーツ</option>
                  <option value="文化・芸術">文化・芸術</option>
                  <option value="その他">その他</option>
                </select>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_shizuoka_vocational_assoc_related}
                    onChange={(e) => setFormData({ ...formData, is_shizuoka_vocational_assoc_related: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">静岡県職業教育振興会関係者</span>
                </label>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.opt_out_newspaper_publication}
                    onChange={(e) => setFormData({ ...formData, opt_out_newspaper_publication: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">新聞掲載を希望しない</span>
                </label>
              </div>
            </div>
          </div>

          {/* 開催期間 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">開催期間</h2>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  イベント開催期間 *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="field-event_start_date"
                    type="date"
                    required
                    value={formData.event_start_date}
                    onChange={(e) => setFormData({ ...formData, event_start_date: e.target.value })}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                  />
                  <span className="text-gray-500 font-bold">〜</span>
                  <input
                    id="field-event_end_date"
                    type="date"
                    required
                    value={formData.event_end_date}
                    onChange={(e) => setFormData({ ...formData, event_end_date: e.target.value })}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  イベント開催期間(表示用) *
                </label>
                <input
                  id="field-event_display_period"
                  type="text"
                  required
                  maxLength={50}
                  value={formData.event_display_period}
                  onChange={(e) => setFormData({ ...formData, event_display_period: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="例: 2025年9月20日(土)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  開催時間
                </label>
                <input
                  type="text"
                  value={formData.event_time}
                  onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="例: 14:00~17:00"
                />
              </div>
            </div>
          </div>

          {/* イベント内容 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">イベント内容</h2>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  リード文 *
                </label>
                <textarea
                  id="field-lead_text"
                  required
                  maxLength={100}
                  value={formData.lead_text}
                  onChange={(e) => setFormData({ ...formData, lead_text: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  イベント紹介文 *
                </label>
                <textarea
                  id="field-event_description"
                  required
                  maxLength={250}
                  value={formData.event_description}
                  onChange={(e) => setFormData({ ...formData, event_description: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* イベント画像 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">イベント画像</h2>
            
            <div className="space-y-6">
              <ImageUpload
                label="メイン画像"
                eventId={eventId || 'temp'}
                imageType="main"
                onUploadComplete={(url) => setImageUrls(prev => ({ ...prev, main: url }))}
                onUploadError={(error) => alert(error)}
                currentImageUrl={imageUrls.main}
              />
              
              <ImageUpload
                label="追加画像1"
                eventId={eventId || 'temp'}
                imageType="additional"
                imageIndex={1}
                onUploadComplete={(url) => setImageUrls(prev => ({ ...prev, additional1: url }))}
                onUploadError={(error) => alert(error)}
                currentImageUrl={imageUrls.additional1}
              />
              
              <ImageUpload
                label="追加画像2"
                eventId={eventId || 'temp'}
                imageType="additional"
                imageIndex={2}
                onUploadComplete={(url) => setImageUrls(prev => ({ ...prev, additional2: url }))}
                onUploadError={(error) => alert(error)}
                currentImageUrl={imageUrls.additional2}
              />
              
              <ImageUpload
                label="追加画像3"
                eventId={eventId || 'temp'}
                imageType="additional"
                imageIndex={3}
                onUploadComplete={(url) => setImageUrls(prev => ({ ...prev, additional3: url }))}
                onUploadError={(error) => alert(error)}
                currentImageUrl={imageUrls.additional3}
              />
              
              <ImageUpload
                label="追加画像4"
                eventId={eventId || 'temp'}
                imageType="additional"
                imageIndex={4}
                onUploadComplete={(url) => setImageUrls(prev => ({ ...prev, additional4: url }))}
                onUploadError={(error) => alert(error)}
                currentImageUrl={imageUrls.additional4}
              />
            </div>
          </div>

          {/* 会場情報 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">会場情報</h2>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  会場又は集合場所の名称 *
                </label>
                <input
                  id="field-venue_name"
                  type="text"
                  required
                  value={formData.venue_name}
                  onChange={(e) => setFormData({ ...formData, venue_name: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  郵便番号
                </label>
                <div className="flex gap-2">
                  <input
                    id="field-venue_postal_code"
                    type="text"
                    value={formData.venue_postal_code}
                    onChange={(e) => setFormData({ ...formData, venue_postal_code: e.target.value })}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                    placeholder="1234567"
                    maxLength={7}
                  />
                  <button
                    type="button"
                    onClick={() => fetchAddressFromPostalCode(formData.venue_postal_code)}
                    disabled={addressLoading || formData.venue_postal_code.length !== 7}
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-md transition-colors whitespace-nowrap"
                  >
                    {addressLoading ? '取得中...' : '住所取得'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  市区町村
                </label>
                <input
                  type="text"
                  value={formData.venue_city}
                  onChange={(e) => setFormData({ ...formData, venue_city: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  町名
                </label>
                <input
                  type="text"
                  value={formData.venue_town}
                  onChange={(e) => setFormData({ ...formData, venue_town: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  丁目番地号
                </label>
                <input
                  type="text"
                  value={formData.venue_address}
                  onChange={(e) => setFormData({ ...formData, venue_address: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>
          </div>

          {/* 連絡先情報 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">連絡先情報</h2>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  問い合わせ先名称 *
                </label>
                <input
                  id="field-contact_name"
                  type="text"
                  required
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  電話番号 *
                </label>
                <input
                  id="field-contact_phone"
                  type="tel"
                  required
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-6 rounded-lg transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white py-3 px-6 rounded-lg transition-colors"
            >
              {loading ? (eventId ? '更新中...' : '作成中...') : (eventId ? 'イベントを更新' : 'イベントを掲載')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
