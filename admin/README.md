# Tomorrow - 運営管理システム

イベントプラットフォームの運営管理システムです。

## 機能

- **主催者承認**: 主催者登録の承認・却下
- **イベント管理**: 作成されたイベントの一覧表示
- **出店申し込み管理**: 出店申し込みの承認・却下

## セットアップ

1. 環境変数を設定
```bash
cp .env.example .env.local
```

2. 依存関係をインストール
```bash
npm install
```

3. 開発サーバーを起動
```bash
npm run dev
```

4. ブラウザで http://localhost:3002 を開く

## 環境変数

- `NEXT_PUBLIC_SUPABASE_URL`: SupabaseのURL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabaseの匿名キー

## デプロイ

Vercelでデプロイする場合、環境変数を設定してからデプロイしてください。
