'use client'

import { useState, useRef } from 'react'
import { uploadExhibitorDocument, getPublicUrl } from '@/lib/storage'

interface ImageUploadProps {
  label: string
  documentType: string
  userId: string
  onUploadComplete: (url: string) => void
  onUploadError: (error: string) => void
  onImageDelete?: () => void
  currentImageUrl?: string
  hasError?: boolean
}

export default function ImageUpload({
  label,
  documentType,
  userId,
  onUploadComplete,
  onUploadError,
  onImageDelete,
  currentImageUrl,
  hasError = false
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 許可する画像形式
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif'
  ]

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // ファイルサイズチェック（5MB）
    if (file.size > 5 * 1024 * 1024) {
      onUploadError('ファイルサイズは5MB以下にしてください。')
      return
    }

    // ファイル形式チェック
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      onUploadError('対応していない画像形式です。JPEG, PNG, GIF, WebP, HEIC形式を選択してください。')
      return
    }

    // プレビュー表示
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // アップロード実行
    setUploading(true)
    try {
      const result = await uploadExhibitorDocument(file, documentType, userId)
      
      if (result.error) {
        onUploadError(`アップロードに失敗しました: ${result.error.message}`)
        setPreviewUrl(null)
      } else if (result.data) {
        const publicUrl = getPublicUrl('exhibitor-documents', result.data.path)
        setPreviewUrl(publicUrl)
        onUploadComplete(publicUrl)
      }
    } catch (error) {
      onUploadError('アップロード中にエラーが発生しました。')
      setPreviewUrl(null)
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = () => {
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    // 親コンポーネントに削除を通知
    if (onImageDelete) {
      onImageDelete()
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-[14px] font-medium text-gray-700">
        {label}
      </label>
      
      {previewUrl ? (
        <div className="relative">
          <img
            src={previewUrl}
            alt={label}
            className="w-full h-64 object-contain rounded-lg border-2 border-[#06C755] bg-gray-50"
          />
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute top-2 right-2 bg-[#FF3B30] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-[#E02E24] transition-colors"
            title="画像を削除"
          >
            ×
          </button>
        </div>
      ) : (
        <div className="relative">
          <div
            className={`w-full h-64 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${
              hasError
                ? 'border-[#FF3B30] bg-red-50'
                : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={allowedTypes.join(',')}
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
              id={`file-${documentType}`}
            />
            <div className="text-gray-400 text-4xl mb-2">+</div>
            <div className="text-[16px] text-gray-600">画像を選択</div>
          </div>
          {hasError && (
            <div className="absolute top-2 right-2 bg-[#FF3B30] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
              ×
            </div>
          )}
        </div>
      )}
      
      {!previewUrl && (
        <p className="text-[12px] text-gray-500">
          対応形式: JPEG, PNG, GIF, WebP, HEIC（最大5MB）
        </p>
      )}
    </div>
  )
}
