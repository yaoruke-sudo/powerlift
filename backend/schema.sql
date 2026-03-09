-- PowerLift 数据库 Schema
-- 在 Supabase SQL Editor 中执行此脚本以创建所有表

-- 用户基本信息
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT '用户',
  height NUMERIC NOT NULL DEFAULT 175,
  weight NUMERIC NOT NULL DEFAULT 70,
  bmi NUMERIC NOT NULL DEFAULT 22.9,
  avatar_url TEXT,
  training_start_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 训练会话
CREATE TABLE IF NOT EXISTS workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  display_date TEXT NOT NULL,
  duration INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 运动条目
CREATE TABLE IF NOT EXISTS exercise_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  chinese_name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 每组记录
CREATE TABLE IF NOT EXISTS set_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID REFERENCES exercise_entries(id) ON DELETE CASCADE,
  weight NUMERIC NOT NULL,
  reps INTEGER NOT NULL,
  is_pr BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PR 记录（个人最佳）
CREATE TABLE IF NOT EXISTS pr_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  exercise_type TEXT NOT NULL,
  max_weight NUMERIC NOT NULL,
  achieved_at DATE DEFAULT CURRENT_DATE,
  UNIQUE(user_id, exercise_type)
);

-- 用户照片
CREATE TABLE IF NOT EXISTS user_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  date DATE NOT NULL,
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 为常用查询创建索引
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_id ON workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_date ON workout_sessions(date);
CREATE INDEX IF NOT EXISTS idx_exercise_entries_session_id ON exercise_entries(session_id);
CREATE INDEX IF NOT EXISTS idx_set_records_exercise_id ON set_records(exercise_id);
CREATE INDEX IF NOT EXISTS idx_pr_records_user_id ON pr_records(user_id);
CREATE INDEX IF NOT EXISTS idx_user_photos_user_id ON user_photos(user_id);

-- 关闭 RLS（简化开发，单用户模式）
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE set_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE pr_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_photos ENABLE ROW LEVEL SECURITY;

-- 允许 anon 角色完全访问（开发阶段）
CREATE POLICY "allow_all_user_profiles" ON user_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_workout_sessions" ON workout_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_exercise_entries" ON exercise_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_set_records" ON set_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_pr_records" ON pr_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_user_photos" ON user_photos FOR ALL USING (true) WITH CHECK (true);
