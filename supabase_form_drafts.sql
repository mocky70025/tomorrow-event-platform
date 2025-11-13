-- 下書き保存用テーブル
create table if not exists public.form_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  form_type text not null,
  payload jsonb not null,
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, form_type)
);

-- 既にRLSが有効な場合は、適宜ポリシーを追加してください。

