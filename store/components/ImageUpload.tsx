'use client'

import { useState, useRef } from 'react'
import { uploadExhibitorDocument, getPublicUrl } from '@/lib/storage'

interface ImageUploadProps {
  label: string
  documentType: string
  userId: string
  onUploadComplete: (url: string) => void
  onUploadError: (error: string) => void
  currentImageUrl?: string
}

export default function ImageUpload({
  label,
  documentType,
  userId,
  onUploadComplete,
  onUploadError,
  currentImageUrl
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // ファイルサイズチェック（5MB）
    if (file.size > 5 * 1024 * 1024) {
      onUploadError('ファイルサイズは5MB以下にしてください。')
      return
    }

    // ファイル形式チェック
    if (!file.type.startsWith('image/')) {
      onUploadError('画像ファイルを選択してください。')
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
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      
      {previewUrl && (
        <div className="relative">
          <img
            src={previewUrl}
            alt={label}
            className="w-full h-32 object-cover rounded-md border"
          />
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
          >
            ×
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
          id={`file-${documentType}`}
        />
        <label
          htmlFor={`file-${documentType}`}
          className={`flex-1 text-center py-2 px-4 rounded-md border border-gray-300 cursor-pointer transition-colors ${
            uploading 
              ? 'bg-gray-100 cursor-not-allowed' 
              : 'bg-white hover:bg-gray-50'
          }`}
        >
          {uploading ? 'アップロード中...' : 'ファイルを選択'}
        </label>
      </div>
      
      <p className="text-xs text-gray-500">
        対応形式: JPG, PNG, GIF, WebP（最大5MB）
      </p>
    </div>
  )
}
