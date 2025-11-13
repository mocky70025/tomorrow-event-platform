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

-- ============================================================
-- 主催者ロール／招待機能向けテーブル群
-- ============================================================

create table if not exists public.organizer_profiles (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  lead_text text,
  contact_phone text,
  contact_email text,
  postal_code text,
  address_prefecture text,
  address_city text,
  address_line text,
  website_url text,
  is_approved boolean not null default false,
  approval_notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.organizer_members (
  id uuid primary key default gen_random_uuid(),
  organizer_profile_id uuid not null references public.organizer_profiles(id) on delete cascade,
  line_user_id text not null,
  name text not null,
  email text,
  phone_number text,
  role text not null default 'owner', -- owner | editor | viewer
  is_primary boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organizer_profile_id, line_user_id)
);

create table if not exists public.organizer_invitations (
  id uuid primary key default gen_random_uuid(),
  organizer_profile_id uuid not null references public.organizer_profiles(id) on delete cascade,
  code text not null,
  role text not null default 'editor',
  expires_at timestamptz,
  used_at timestamptz,
  status text not null default 'active', -- active | used | revoked | expired
  created_by_member_id uuid references public.organizer_members(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (organizer_profile_id, code)
);

-- 旧 organizers テーブルからの移行を想定しているため、
-- マイグレーション時には organizer_profiles / organizer_members へのデータ移行が必要です。

