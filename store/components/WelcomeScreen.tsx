'use client'

import { liff } from '@line/liff'

export default function WelcomeScreen() {
  const handleLogin = () => {
    liff.login()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Tomorrow
          </h1>
          <p className="text-gray-600 mb-8">
            イベント出店者向けプラットフォーム
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            ご利用の流れ
          </h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                1
              </div>
              <p className="text-gray-700">LINEアカウントでログイン</p>
            </div>
            <div className="flex items-start">
              <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                2
              </div>
              <p className="text-gray-700">基本情報と必要書類を登録</p>
            </div>
            <div className="flex items-start">
              <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                3
              </div>
              <p className="text-gray-700">イベント一覧から出店申し込み</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogin}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-lg transition-colors"
        >
          LINEでログイン
        </button>
      </div>
    </div>
  )
}
