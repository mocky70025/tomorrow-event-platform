'use client'

import { useState } from 'react'
import { supabase, type OrganizerProfile, type OrganizerMember, type OrganizerMemberRole } from '@/lib/supabase'

interface InviteRegistrationFormProps {
  userProfile: any
  onBack: () => void
  onRegistrationComplete: (profile: OrganizerProfile, member: OrganizerMember) => void
}

type GenderOption = '' | '男' | '女' | 'それ以外'

interface InviteFormState {
  invite_code: string
  name: string
  gender: GenderOption
  age: number
  phone_number: string
  email: string
}

const INITIAL_STATE: InviteFormState = {
  invite_code: '',
  name: '',
  gender: '',
  age: 0,
  phone_number: '',
  email: '',
}

const convertToHalfWidth = (str: string): string => {
  return str.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
}

const validatePhoneNumber = (phone: string): boolean => {
  if (!phone.trim()) return true
  const halfWidth = convertToHalfWidth(phone.replace(/-/g, ''))
  return /^\d+$/.test(halfWidth) && halfWidth.length >= 10 && halfWidth.length <= 15
}

const validateEmail = (email: string): boolean => {
  if (!email.trim()) return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const validateAge = (age: number): boolean => {
  if (!age) return true
  return age >= 0 && age <= 100
}

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

export default function InviteRegistrationForm({ userProfile, onBack, onRegistrationComplete }: InviteRegistrationFormProps) {
  const [formData, setFormData] = useState<InviteFormState>({ ...INITIAL_STATE })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, boolean>>({})

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

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: false }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors: Record<string, boolean> = {}
    if (!formData.invite_code.trim()) newErrors.invite_code = true
    if (!formData.name.trim()) newErrors.name = true
    if (!validateAge(formData.age)) newErrors.age = true
    if (!validatePhoneNumber(formData.phone_number)) newErrors.phone_number = true
    if (!validateEmail(formData.email)) newErrors.email = true

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
      return
    }

    setLoading(true)

    try {
      const { data: existingMember, error: existingError } = await supabase
        .from('organizer_members')
        .select('id')
        .eq('line_user_id', userProfile.userId)
        .maybeSingle()

      if (existingError) throw existingError
      if (existingMember) {
        alert('すでに主催者として登録されています。')
        return
      }

      const normalizedCode = formData.invite_code.trim().toUpperCase()

      const { data: invitationData, error: invitationError } = await supabase
        .from('organizer_invitations')
        .select('*, organizer_profiles(*)')
        .eq('code', normalizedCode)
        .limit(1)
        .maybeSingle()

      if (invitationError) throw invitationError

      if (!invitationData) {
        alert('招待コードが見つかりません。入力内容をご確認ください。')
        return
      }

      if (invitationData.used_at) {
        alert('この招待コードはすでに使用されています。')
        return
      }

      if (invitationData.expires_at && new Date(invitationData.expires_at) < new Date()) {
        alert('この招待コードの有効期限が切れています。')
        return
      }

      const profile = invitationData.organizer_profiles as OrganizerProfile
      if (!profile) {
        alert('招待コードに紐づく主催者情報が見つかりません。')
        return
      }

      const normalizedPhone = formData.phone_number.trim()
        ? convertToHalfWidth(formData.phone_number.replace(/-/g, ''))
        : null

      const role = (invitationData.role || 'editor') as OrganizerMemberRole

      const { data: memberData, error: memberError } = await supabase
        .from('organizer_members')
        .insert({
          organizer_profile_id: profile.id,
          line_user_id: userProfile.userId,
          name: formData.name,
          gender: formData.gender || null,
          age: formData.age || null,
          phone_number: normalizedPhone,
          email: formData.email,
          role,
          is_primary: false,
        })
        .select()
        .single()

      if (memberError || !memberData) {
        throw memberError
      }

      const { error: markUsedError } = await supabase
        .from('organizer_invitations')
        .update({ used_at: new Date().toISOString(), status: 'used' })
        .eq('id', invitationData.id)

      if (markUsedError) {
        console.error('Failed to mark invitation as used:', markUsedError)
      }

      alert('招待コードを利用して登録しました。')
      onRegistrationComplete(profile, memberData)
    } catch (error) {
      console.error('Invite registration failed:', error)
      const message = error instanceof Error ? error.message : '不明なエラーが発生しました'
      alert(`登録に失敗しました。エラー: ${message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#F7F7F7', minHeight: '100vh' }}>
      <div className="container mx-auto" style={{ padding: '9px 16px', maxWidth: '394px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingTop: '24px' }}>
          <button
            onClick={onBack}
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
            招待コードから登録
          </h1>
          <div style={{ width: '60px' }}></div>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            background: '#FFFFFF',
            boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
            borderRadius: '12px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}
        >
          <div data-error-field="invite_code">
            <label style={labelStyle}>招待コード</label>
            <div style={formFieldStyle(!!errors.invite_code)}>
              <input
                name="invite_code"
                type="text"
                value={formData.invite_code}
                onChange={handleInputChange}
                placeholder="8桁のコードを入力"
                style={inputStyle(!!formData.invite_code)}
                maxLength={16}
              />
            </div>
          </div>

          <div data-error-field="name">
            <label style={labelStyle}>お名前</label>
            <div style={formFieldStyle(!!errors.name)}>
              <input
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="山田太郎"
                style={inputStyle(!!formData.name)}
              />
            </div>
          </div>

          <div data-error-field="gender">
            <label style={labelStyle}>性別（任意）</label>
            <div style={formFieldStyle(!!errors.gender)}>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                style={inputStyle(!!formData.gender)}
              >
                <option value="">選択してください</option>
                <option value="男">男性</option>
                <option value="女">女性</option>
                <option value="それ以外">その他</option>
              </select>
            </div>
          </div>

          <div data-error-field="age">
            <label style={labelStyle}>年齢（任意）</label>
            <div style={formFieldStyle(!!errors.age)}>
              <input
                name="age"
                type="number"
                min={0}
                max={100}
                value={formData.age || ''}
                onChange={handleInputChange}
                placeholder="例: 35"
                style={inputStyle(!!formData.age)}
              />
            </div>
          </div>

          <div data-error-field="phone_number">
            <label style={labelStyle}>電話番号（任意）</label>
            <div style={formFieldStyle(!!errors.phone_number)}>
              <input
                name="phone_number"
                type="tel"
                value={formData.phone_number}
                onChange={handleInputChange}
                placeholder="例: 09012345678"
                style={inputStyle(!!formData.phone_number)}
              />
            </div>
          </div>

          <div data-error-field="email">
            <label style={labelStyle}>メールアドレス</label>
            <div style={formFieldStyle(!!errors.email)}>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="example@example.com"
                style={inputStyle(!!formData.email)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '16px 24px',
              gap: '10px',
              width: '100%',
              height: '48px',
              background: loading ? '#D9D9D9' : '#06C755',
              borderRadius: '8px',
              border: 'none',
              fontFamily: 'Inter, sans-serif',
              fontSize: '16px',
              fontWeight: 700,
              lineHeight: '19px',
              color: '#FFFFFF',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '登録しています…' : '招待コードで登録'}
          </button>
        </form>
      </div>
    </div>
  )
}

