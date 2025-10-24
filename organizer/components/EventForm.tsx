'use client'

import { useState } from 'react'
import { supabase, type Event, type Organizer } from '@/lib/supabase'

interface EventFormProps {
  organizer: Organizer
  onEventCreated: (event: Event) => void
  onCancel: () => void
}

export default function EventForm({ organizer, onEventCreated, onCancel }: EventFormProps) {
  const [formData, setFormData] = useState({
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
  })

  const [loading, setLoading] = useState(false)
  const [addressLoading, setAddressLoading] = useState(false)

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

    try {
      // 必須フィールドのバリデーション
      if (!formData.event_name.trim()) {
        alert('イベント名称を入力してください。')
        return
      }
      if (!formData.event_name_furigana.trim()) {
        alert('イベント名称フリガナを入力してください。')
        return
      }
      if (!formData.genre) {
        alert('ジャンルを選択してください。')
        return
      }
      if (!formData.event_start_date || formData.event_start_date.trim() === '') {
        alert('イベント開催開始日を入力してください。')
        return
      }
      if (!formData.event_end_date || formData.event_end_date.trim() === '') {
        alert('イベント開催終了日を入力してください。')
        return
      }
      if (!formData.event_display_period.trim()) {
        alert('イベント開催期間(表示用)を入力してください。')
        return
      }
      if (!formData.lead_text.trim()) {
        alert('リード文を入力してください。')
        return
      }
      if (!formData.event_description.trim()) {
        alert('イベント紹介文を入力してください。')
        return
      }
      if (!formData.venue_name.trim()) {
        alert('会場名称を入力してください。')
        return
      }
      if (!formData.contact_name.trim()) {
        alert('問い合わせ先名称を入力してください。')
        return
      }
      if (!formData.contact_phone.trim()) {
        alert('電話番号を入力してください。')
        return
      }

      // 送信データの最終チェック
      const submitData = {
        ...formData,
        organizer_id: organizer.id,
        venue_latitude: formData.venue_latitude ? parseFloat(formData.venue_latitude) : null,
        venue_longitude: formData.venue_longitude ? parseFloat(formData.venue_longitude) : null,
      }

      // 空文字列をnullに変換
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === '') {
          submitData[key] = null
        }
      })

      console.log('Submitting event data:', submitData)

      // Supabase接続テスト
      console.log('Testing Supabase connection...')
      const { data: testData, error: testError } = await supabase
        .from('organizers')
        .select('id')
        .eq('id', organizer.id)
        .single()
      
      if (testError) {
        console.error('Supabase connection test failed:', testError)
        throw new Error(`Supabase接続エラー: ${testError.message}`)
      }
      
      console.log('Supabase connection test successful:', testData)

      const { data, error } = await supabase
        .from('events')
        .insert(submitData)
        .select()
        .single()

      if (error) {
        console.error('Supabase error:', error)
        console.error('Supabase error details:', JSON.stringify(error, null, 2))
        throw new Error(`Supabase error: ${error.message || JSON.stringify(error)}`)
      }

      console.log('Event created successfully:', data)
      onEventCreated(data)
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
      
      alert(`イベントの作成に失敗しました。エラー: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">イベント掲載</h1>
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
                    type="date"
                    required
                    value={formData.event_start_date}
                    onChange={(e) => setFormData({ ...formData, event_start_date: e.target.value })}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                  />
                  <span className="text-gray-500 font-bold">〜</span>
                  <input
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

          {/* 会場情報 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">会場情報</h2>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  会場又は集合場所の名称 *
                </label>
                <input
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
              {loading ? '作成中...' : 'イベントを掲載'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
