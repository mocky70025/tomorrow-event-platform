'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface OrganizerEditFormProps {
  organizerData: any
  userProfile: any
  onUpdateComplete: (updatedData: any) => void
  onCancel: () => void
}

export default function OrganizerEditForm({
  organizerData,
  userProfile,
  onUpdateComplete,
  onCancel
}: OrganizerEditFormProps) {
  const [formData, setFormData] = useState({
    company_name: organizerData.company_name || '',
    name: organizerData.name || '',
    gender: organizerData.gender || '',
    age: organizerData.age || 0,
    phone_number: organizerData.phone_number || '',
    email: organizerData.email || '',
  })

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, boolean>>({})

  // 全角数字を半角に変換
  const convertToHalfWidth = (str: string): string => {
    return str.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
  }

  // 電話番号のバリデーション
  const validatePhoneNumber = (phone: string): boolean => {
    const halfWidth = convertToHalfWidth(phone.replace(/-/g, ''))
    return /^\d+$/.test(halfWidth) && halfWidth.length >= 10 && halfWidth.length <= 15
  }

  // メールアドレスのバリデーション
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // 年齢のバリデーション
  const validateAge = (age: number): boolean => {
    return age >= 0 && age <= 100
  }

  // フォームフィールドの共通スタイル
  const formFieldStyle = (hasError: boolean) => ({
    boxSizing: 'border-box' as const,
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    padding: '12px 16px',
    gap: '10px',
    width: '100%',
    height: '48px',
    background: '#FFFFFF',
    border: hasError ? '1px solid #FF3B30' : '1px solid #E5E5E5',
    borderRadius: '8px'
  })

  const labelStyle = {
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
    fontWeight: 500,
    lineHeight: '120%',
    color: '#000000',
    marginBottom: '10px',
    display: 'block' as const
  }

  const inputStyle = (hasValue: boolean) => ({
    fontFamily: 'Inter, sans-serif',
    fontSize: '16px',
    lineHeight: '150%',
    color: hasValue ? '#000000' : '#6B6B6B',
    border: 'none',
    outline: 'none',
    width: '100%',
    background: 'transparent'
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (name === 'age') {
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value) || 0
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
    // エラーをクリア
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: false }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // バリデーション
      const newErrors: Record<string, boolean> = {}
      if (!formData.company_name.trim()) newErrors.company_name = true
      if (!formData.name.trim()) newErrors.name = true
      if (!formData.gender) newErrors.gender = true
      if (!validateAge(formData.age)) newErrors.age = true
      if (!formData.phone_number.trim() || !validatePhoneNumber(formData.phone_number)) newErrors.phone_number = true
      if (!formData.email.trim() || !validateEmail(formData.email)) newErrors.email = true

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        const firstErrorKey = Object.keys(newErrors)[0]
        const errorElement = document.querySelector(`[data-error-field="${firstErrorKey}"]`)
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
          const inputElement = errorElement.querySelector('input, select')
          if (inputElement) {
            (inputElement as HTMLElement).focus()
          }
        }
        setLoading(false)
        return
      }

      // 電話番号を半角に変換（ハイフン削除）
      const normalizedPhone = convertToHalfWidth(formData.phone_number.replace(/-/g, ''))

      // 更新データの準備
      const updateData = {
        ...formData,
        phone_number: normalizedPhone,
        updated_at: new Date().toISOString()
      }

      // Supabaseで更新
      const { data, error } = await supabase
        .from('organizers')
        .update(updateData)
        .eq('line_user_id', userProfile.userId)
        .select()
        .single()

      if (error) {
        console.error('Update failed:', error)
        let errorMessage = '不明なエラー'
        if (error instanceof Error) {
          errorMessage = error.message
        } else if (typeof error === 'object' && error !== null) {
          const errorObj = error as any
          if (errorObj.message) {
            errorMessage = String(errorObj.message)
          }
        }
        alert(`登録情報の更新に失敗しました。エラー: ${errorMessage}`)
        return
      }

      alert('登録情報を更新しました')
      onUpdateComplete(data)
    } catch (error) {
      console.error('Update failed:', error)
      alert('登録情報の更新に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#F7F7F7', minHeight: '100vh' }}>
      <div className="container mx-auto" style={{ padding: '9px 16px', maxWidth: '394px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingTop: '24px' }}>
          <button
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
            ← キャンセル
          </button>
          <h1 style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '20px',
            fontWeight: 700,
            lineHeight: '120%',
            color: '#000000'
          }}>登録情報編集</h1>
          <div style={{ width: '60px' }}></div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{
            background: '#FFFFFF',
            boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
              {/* 会社名 */}
              <div style={{ width: '100%', maxWidth: '330px', height: '73px', position: 'relative' }} data-error-field="company_name">
                <label style={labelStyle}>会社名</label>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ ...formFieldStyle(errors.company_name), width: '100%' }}>
                    <input
                      type="text"
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleInputChange}
                      placeholder="株式会社サンプル"
                      style={inputStyle(!!formData.company_name)}
                    />
                  </div>
                </div>
                {errors.company_name && (
                  <p style={{ fontSize: '12px', color: '#FF3B30', marginTop: '4px' }}>入力してください</p>
                )}
              </div>

              {/* 名前 */}
              <div style={{ width: '100%', maxWidth: '330px', height: '73px', position: 'relative' }} data-error-field="name">
                <label style={labelStyle}>名前</label>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ ...formFieldStyle(errors.name), width: '100%' }}>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="山田太郎"
                      style={inputStyle(!!formData.name)}
                    />
                  </div>
                </div>
                {errors.name && (
                  <p style={{ fontSize: '12px', color: '#FF3B30', marginTop: '4px' }}>入力してください</p>
                )}
              </div>

              {/* 性別 */}
              <div style={{ width: '100%', maxWidth: '330px', height: '73px', position: 'relative' }} data-error-field="gender">
                <label style={labelStyle}>性別</label>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                  {(['男性', '女性', 'その他'] as const).map((option) => {
                    const value = option === '男性' ? '男' : option === '女性' ? '女' : 'それ以外'
                    return (
                      <label key={option} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="radio"
                          name="gender"
                          value={value}
                          checked={formData.gender === value}
                          onChange={handleInputChange}
                          style={{
                            width: '20px',
                            height: '20px',
                            border: '1px solid #E5E5E5',
                            accentColor: formData.gender === value ? '#06C755' : undefined
                          }}
                        />
                        <span style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '16px',
                          lineHeight: '150%',
                          color: '#000000'
                        }}>{option}</span>
                      </label>
                    )
                  })}
                </div>
                {errors.gender && (
                  <p style={{ fontSize: '12px', color: '#FF3B30', marginTop: '4px' }}>入力してください</p>
                )}
              </div>

              {/* 年齢 */}
              <div style={{ width: '100%', maxWidth: '330px', height: '73px', position: 'relative' }} data-error-field="age">
                <label style={labelStyle}>年齢</label>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ ...formFieldStyle(errors.age), width: '100%' }}>
                    <input
                      type="number"
                      name="age"
                      min="0"
                      max="100"
                      value={formData.age || ''}
                      onChange={handleInputChange}
                      placeholder="25"
                      style={inputStyle(formData.age > 0)}
                    />
                  </div>
                </div>
                {errors.age && (
                  <p style={{ fontSize: '12px', color: '#FF3B30', marginTop: '4px' }}>入力してください</p>
                )}
              </div>

              {/* 電話番号 */}
              <div style={{ width: '100%', maxWidth: '330px', height: '73px', position: 'relative' }} data-error-field="phone_number">
                <label style={labelStyle}>電話番号</label>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ ...formFieldStyle(errors.phone_number), width: '100%' }}>
                    <input
                      type="tel"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleInputChange}
                      placeholder="01234567890"
                      style={inputStyle(!!formData.phone_number)}
                    />
                  </div>
                </div>
                {errors.phone_number && (
                  <p style={{ fontSize: '12px', color: '#FF3B30', marginTop: '4px' }}>入力してください</p>
                )}
              </div>

              {/* メールアドレス */}
              <div style={{ width: '100%', maxWidth: '330px', height: '73px', position: 'relative' }} data-error-field="email">
                <label style={labelStyle}>メールアドレス</label>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ ...formFieldStyle(errors.email), width: '100%' }}>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="kitchencar@gmail.com"
                      style={inputStyle(!!formData.email)}
                    />
                  </div>
                </div>
                {errors.email && (
                  <p style={{ fontSize: '12px', color: '#FF3B30', marginTop: '4px' }}>入力してください</p>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '24px' }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: '16px 24px',
                background: '#FFFFFF',
                color: '#000000',
                borderRadius: '8px',
                border: '1px solid #E5E5E5',
                fontFamily: 'Inter, sans-serif',
                fontSize: '16px',
                fontWeight: 700,
                lineHeight: '19px',
                cursor: 'pointer',
                flex: 1,
                maxWidth: '157px'
              }}
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '16px 24px',
                background: loading ? '#D9D9D9' : '#06C755',
                color: '#FFFFFF',
                borderRadius: '8px',
                border: 'none',
                fontFamily: 'Inter, sans-serif',
                fontSize: '16px',
                fontWeight: 700,
                lineHeight: '19px',
                cursor: loading ? 'not-allowed' : 'pointer',
                flex: 1,
                maxWidth: '157px'
              }}
            >
              {loading ? '更新中...' : '更新'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

