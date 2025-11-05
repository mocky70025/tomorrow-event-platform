'use client'

import { useState } from 'react'
import { supabase, type Organizer } from '@/lib/supabase'

interface RegistrationFormProps {
  userProfile: any
  onRegistrationComplete: () => void
}

export default function RegistrationForm({ userProfile, onRegistrationComplete }: RegistrationFormProps) {
  const [formData, setFormData] = useState({
    company_name: '',
    name: '',
    gender: '男' as '男' | '女' | 'それ以外',
    age: 0,
    phone_number: '',
    email: '',
  })

  const [loading, setLoading] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [showTermsPage, setShowTermsPage] = useState(false)
  const [errors, setErrors] = useState<Record<string, boolean>>({})

  // バリデーション実行
  const validateForm = (): boolean => {
    const newErrors: Record<string, boolean> = {}

    if (!formData.company_name.trim()) newErrors.company_name = true
    if (!formData.name.trim()) newErrors.name = true
    if (!formData.gender) newErrors.gender = true
    if (!formData.age || formData.age < 0) newErrors.age = true
    if (!formData.phone_number.trim()) newErrors.phone_number = true
    if (!formData.email.trim() || !formData.email.includes('@')) newErrors.email = true
    if (!termsAccepted) newErrors.termsAccepted = true

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 利用規約ページから戻ったときのチェック
  const handleBackFromTerms = () => {
    setShowTermsPage(false)
    const isValid = validateForm()
    if (!isValid) {
      setTimeout(() => {
        const firstErrorKey = Object.keys(errors).find(key => errors[key])
        if (firstErrorKey) {
          const errorElement = document.querySelector(`[data-error-field="${firstErrorKey}"]`)
          if (errorElement) {
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }
      }, 100)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      const firstErrorKey = Object.keys(errors).find(key => errors[key])
      if (firstErrorKey) {
        const errorElement = document.querySelector(`[data-error-field="${firstErrorKey}"]`)
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
          const inputElement = errorElement.querySelector('input, select, textarea')
          if (inputElement) {
            (inputElement as HTMLElement).focus()
          }
        }
      }
      return
    }

    setLoading(true)

    try {
      // 重複登録チェック
      const { data: existingUser } = await supabase
        .from('organizers')
        .select('id')
        .eq('line_user_id', userProfile.userId)
        .single()

      if (existingUser) {
        alert('既に登録済みです。')
        return
      }

      const { error } = await supabase
        .from('organizers')
        .insert({
          ...formData,
          line_user_id: userProfile.userId,
          is_approved: false, // 運営側チェック待ち
        })

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      alert('登録が完了しました。運営側の承認をお待ちください。')
      onRegistrationComplete()
    } catch (error) {
      console.error('Registration failed:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      const errorMessage = error instanceof Error ? error.message : '不明なエラー'
      alert(`登録に失敗しました。エラー: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  // 利用規約ページ
  if (showTermsPage) {
    return (
      <div style={{ background: '#F7F7F7', minHeight: '100vh' }}>
        <div className="container mx-auto" style={{ padding: '9px 16px', maxWidth: '394px' }}>
          <h2 style={{ 
            fontFamily: 'Inter, sans-serif',
            fontSize: '20px',
            fontWeight: 700,
            lineHeight: '120%',
            color: '#000000',
            marginBottom: '24px',
            textAlign: 'center',
            paddingTop: '24px'
          }}>
            利用規約
          </h2>
          
          <div style={{
            background: '#FFFFFF',
            boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            minHeight: '400px'
          }}>
            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '16px',
              lineHeight: '150%',
              color: '#666666'
            }}>
              利用規約の内容はこちらに表示されます。
            </p>
          </div>

          <button
            onClick={handleBackFromTerms}
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '16px 24px',
              gap: '10px',
              width: '100%',
              height: '48px',
              background: '#06C755',
              borderRadius: '8px',
              border: 'none',
              fontFamily: 'Inter, sans-serif',
              fontSize: '16px',
              fontWeight: 700,
              lineHeight: '19px',
              color: '#FFFFFF',
              cursor: 'pointer',
              marginBottom: '24px'
            }}
          >
            元のページに戻る
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">新規登録</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">基本情報</h2>
            
            <div className="grid grid-cols-1 gap-4">
              <div data-error-field="company_name">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  会社名 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.company_name}
                  onChange={(e) => {
                    setFormData({ ...formData, company_name: e.target.value })
                    if (errors.company_name) setErrors({ ...errors, company_name: false })
                  }}
                  className={`w-full border rounded-md px-3 py-2 ${errors.company_name ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.company_name && (
                  <p className="text-red-500 text-xs mt-1">入力してください</p>
                )}
              </div>

              <div data-error-field="name">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  名前 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value })
                    if (errors.name) setErrors({ ...errors, name: false })
                  }}
                  className={`w-full border rounded-md px-3 py-2 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">入力してください</p>
                )}
              </div>

              <div data-error-field="gender">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  性別 *
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => {
                    setFormData({ ...formData, gender: e.target.value as any })
                    if (errors.gender) setErrors({ ...errors, gender: false })
                  }}
                  className={`w-full border rounded-md px-3 py-2 ${errors.gender ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="男">男</option>
                  <option value="女">女</option>
                  <option value="それ以外">それ以外</option>
                </select>
                {errors.gender && (
                  <p className="text-red-500 text-xs mt-1">入力してください</p>
                )}
              </div>

              <div data-error-field="age">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  年齢 *
                </label>
                <input
                  type="number"
                  min="0"
                  max="99"
                  required
                  value={formData.age}
                  onChange={(e) => {
                    setFormData({ ...formData, age: parseInt(e.target.value) || 0 })
                    if (errors.age) setErrors({ ...errors, age: false })
                  }}
                  className={`w-full border rounded-md px-3 py-2 ${errors.age ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.age && (
                  <p className="text-red-500 text-xs mt-1">入力してください</p>
                )}
              </div>

              <div data-error-field="phone_number">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  電話番号 *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone_number}
                  onChange={(e) => {
                    setFormData({ ...formData, phone_number: e.target.value })
                    if (errors.phone_number) setErrors({ ...errors, phone_number: false })
                  }}
                  className={`w-full border rounded-md px-3 py-2 ${errors.phone_number ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.phone_number && (
                  <p className="text-red-500 text-xs mt-1">入力してください</p>
                )}
              </div>

              <div data-error-field="email">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メールアドレス *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value })
                    if (errors.email) setErrors({ ...errors, email: false })
                  }}
                  className={`w-full border rounded-md px-3 py-2 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">入力してください</p>
                )}
              </div>
            </div>
          </div>

          {/* 利用規約チェック */}
          <div className="bg-white rounded-lg shadow p-6">
            <label style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                background: termsAccepted ? '#06C755' : '#FFFFFF',
                border: termsAccepted ? 'none' : '1px solid #E5E5E5',
                borderRadius: '4px',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={() => {
                setTermsAccepted(!termsAccepted)
                if (errors.termsAccepted) setErrors({ ...errors, termsAccepted: false })
              }}
              >
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => {
                    setTermsAccepted(e.target.checked)
                    if (errors.termsAccepted) setErrors({ ...errors, termsAccepted: false })
                  }}
                  style={{
                    position: 'absolute',
                    width: '24px',
                    height: '24px',
                    opacity: 0,
                    cursor: 'pointer'
                  }}
                />
                {termsAccepted && (
                  <svg style={{
                    width: '16px',
                    height: '13px',
                    color: '#FFFFFF'
                  }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <span style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '16px',
                lineHeight: '150%',
                color: termsAccepted ? '#06C755' : '#000000'
              }}>
                利用規約に同意する
                <span
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowTermsPage(true)
                  }}
                  style={{
                    color: '#06C755',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    marginLeft: '4px'
                  }}
                >
                  利用規約
                </span>
              </span>
            </label>
            {errors.termsAccepted && (
              <p className="text-red-500 text-xs mt-1">利用規約への同意が必要です</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !termsAccepted}
            className={`w-full text-white font-bold py-3 px-6 rounded-lg transition-colors ${
              loading || !termsAccepted 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-purple-500 hover:bg-purple-600'
            }`}
          >
            {loading ? '登録中...' : '登録する'}
          </button>
        </form>
      </div>
    </div>
  )
}
