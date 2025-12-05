-- ============================================
-- 簡化版自主學習系統 - 資料庫 Schema v2
-- 適用於 Supabase (PostgreSQL)
-- ============================================

-- 啟用必要擴充套件
create extension if not exists "uuid-ossp";

-- ============================================
-- 1. PROFILES（使用者資料，擴展 auth.users）
-- ============================================
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  nickname text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- 2. SUBJECTS（科目）
-- ============================================
create table public.subjects (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  cover_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- 3. TOPICS（主題/章節）
-- ============================================
create table public.topics (
  id uuid default uuid_generate_v4() primary key,
  subject_id uuid references public.subjects(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  "order" integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- 4. UNITS（單元）
-- ============================================
create table public.units (
  id uuid default uuid_generate_v4() primary key,
  topic_id uuid references public.topics(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  content text,                    -- 文字補充說明
  mindmap_url text,                -- 心智圖圖片網址
  "order" integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- 5. QUESTION_TYPES（題目類型）
-- ============================================
create table public.question_types (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,       -- 程式用識別名稱
  label text not null,             -- 顯示名稱
  created_at timestamptz default now()
);

-- 預設題目類型
insert into public.question_types (name, label) values
  ('true_false', '是非題'),
  ('single_choice', '單選題'),
  ('multiple_choice', '複選題'),
  ('fill_in_blank', '填充題'),
  ('essay', '問答題');

-- ============================================
-- 6. QUESTIONS（練習題）
-- ============================================
create table public.questions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  subject_id uuid references public.subjects(id) on delete cascade not null,
  question_type_id uuid references public.question_types(id) on delete restrict not null,
  content text not null,           -- 題目內容
  options jsonb,                   -- 選項：[{"label": "A", "text": "選項A"}, ...]
  answer jsonb,                    -- 正確答案
  explanation text,                -- 解析說明
  -- 題組相關
  is_group boolean default false,  -- 是否為題組父題
  parent_id uuid references public.questions(id) on delete cascade,
  -- 答題統計
  attempt_count integer default 0,           -- 作答次數
  wrong_count integer default 0,             -- 答錯次數
  last_attempted_at timestamptz,             -- 最後作答時間
  marked_for_review boolean default false,   -- 標記待複習
  --
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- 7. QUESTION_TOPICS（題目與主題多對多關聯）
-- ============================================
create table public.question_topics (
  question_id uuid references public.questions(id) on delete cascade not null,
  topic_id uuid references public.topics(id) on delete cascade not null,
  created_at timestamptz default now(),
  primary key (question_id, topic_id)
);

-- ============================================
-- 8. DECKS（卡片組）
-- ============================================
create table public.decks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- 9. FLASHCARDS（記憶卡片）
-- ============================================
create table public.flashcards (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  unit_id uuid references public.units(id) on delete set null,
  deck_id uuid references public.decks(id) on delete set null,
  front text not null,             -- 卡片正面
  back text not null,              -- 卡片背面
  -- SM-2 間隔重複演算法欄位
  next_review_at timestamptz default now(),
  interval integer default 0,      -- 間隔天數
  ease_factor float default 2.5,   -- 難易度因子
  repetition_count integer default 0,
  --
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- 啟用 Row Level Security (RLS)
-- ============================================
alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.topics enable row level security;
alter table public.units enable row level security;
alter table public.question_types enable row level security;
alter table public.questions enable row level security;
alter table public.question_topics enable row level security;
alter table public.decks enable row level security;
alter table public.flashcards enable row level security;

-- ============================================
-- RLS 政策
-- ============================================

-- Profiles：使用者只能查看和更新自己的資料
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Subjects：使用者只能操作自己的科目
create policy "Users can CRUD own subjects"
  on public.subjects for all
  using (auth.uid() = user_id);

-- Topics：使用者只能操作自己的主題
create policy "Users can CRUD own topics"
  on public.topics for all
  using (auth.uid() = user_id);

-- Units：使用者只能操作自己的單元
create policy "Users can CRUD own units"
  on public.units for all
  using (auth.uid() = user_id);

-- Question Types：所有人可讀取
create policy "Question types are viewable by everyone"
  on public.question_types for select
  using (true);

-- Questions：使用者只能操作自己的題目
create policy "Users can CRUD own questions"
  on public.questions for all
  using (auth.uid() = user_id);

-- Question Topics：透過題目的擁有者判斷
create policy "Users can CRUD own question_topics"
  on public.question_topics for all
  using (
    auth.uid() = (
      select user_id from public.questions where id = question_id
    )
  );

-- Decks：使用者只能操作自己的卡片組
create policy "Users can CRUD own decks"
  on public.decks for all
  using (auth.uid() = user_id);

-- Flashcards：使用者只能操作自己的卡片
create policy "Users can CRUD own flashcards"
  on public.flashcards for all
  using (auth.uid() = user_id);

-- ============================================
-- 函數：處理新用戶註冊
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nickname, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- 觸發器：用戶註冊時自動建立 profile
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- 函數：自動更新 updated_at 欄位
-- ============================================
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 為各表建立 updated_at 觸發器
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute procedure update_updated_at_column();

create trigger update_subjects_updated_at
  before update on public.subjects
  for each row execute procedure update_updated_at_column();

create trigger update_topics_updated_at
  before update on public.topics
  for each row execute procedure update_updated_at_column();

create trigger update_units_updated_at
  before update on public.units
  for each row execute procedure update_updated_at_column();

create trigger update_questions_updated_at
  before update on public.questions
  for each row execute procedure update_updated_at_column();

create trigger update_decks_updated_at
  before update on public.decks
  for each row execute procedure update_updated_at_column();

create trigger update_flashcards_updated_at
  before update on public.flashcards
  for each row execute procedure update_updated_at_column();

-- ============================================
-- 索引（提升查詢效能）
-- ============================================

-- 常用查詢索引
create index idx_subjects_user_id on public.subjects(user_id);
create index idx_topics_subject_id on public.topics(subject_id);
create index idx_topics_user_id on public.topics(user_id);
create index idx_units_topic_id on public.units(topic_id);
create index idx_units_user_id on public.units(user_id);
create index idx_questions_user_id on public.questions(user_id);
create index idx_questions_subject_id on public.questions(subject_id);
create index idx_questions_marked_for_review on public.questions(user_id, marked_for_review) where marked_for_review = true;
create index idx_question_topics_question_id on public.question_topics(question_id);
create index idx_question_topics_topic_id on public.question_topics(topic_id);
create index idx_decks_user_id on public.decks(user_id);
create index idx_flashcards_user_id on public.flashcards(user_id);
create index idx_flashcards_deck_id on public.flashcards(deck_id);
create index idx_flashcards_unit_id on public.flashcards(unit_id);
create index idx_flashcards_next_review on public.flashcards(user_id, next_review_at);