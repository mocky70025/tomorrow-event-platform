# Tomorrow Event Platform

イベント出店者・主催者向けプラットフォーム

## プロジェクト構成

```
tomorrow/
├── store/          # 出店者用LIFFアプリ
├── organizer/      # 主催者用LIFFアプリ
├── supabase_schema.sql  # データベーススキーマ
└── vercel.json     # Vercelデプロイ設定
```

## 開発環境セットアップ

1. 依存関係のインストール
```bash
npm run install:all
```

2. 開発サーバー起動
```bash
npm run dev
```

## デプロイ

- 出店者用: `https://your-domain.vercel.app/store`
- 主催者用: `https://your-domain.vercel.app/organizer`

## LINE Bot設定

- 出店者用LINE Bot: エンドポイントURL → `/store`
- 主催者用LINE Bot: エンドポイントURL → `/organizer`
