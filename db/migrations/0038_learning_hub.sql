-- 0038_learning_hub.sql
-- Learning Hub: articles, videos, trainings with enrollments, and community groups with memberships.

CREATE TABLE learning_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  snippet TEXT,
  read_time TEXT NOT NULL,
  author TEXT NOT NULL,
  tag TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'ta')),
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_learning_articles_lang_pub ON learning_articles (language, is_published, created_at DESC);

CREATE TABLE learning_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  duration TEXT NOT NULL,
  author TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'ta')),
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_learning_videos_lang_pub ON learning_videos (language, is_published, created_at DESC);

CREATE TABLE learning_trainings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  training_date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT,
  mode TEXT NOT NULL CHECK (mode IN ('IN_FIELD', 'ONLINE_WEBINAR')),
  location TEXT NOT NULL,
  instructor TEXT NOT NULL,
  capacity INT CHECK (capacity IS NULL OR capacity > 0),
  language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'ta')),
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_learning_trainings_date ON learning_trainings (training_date, is_published);

CREATE TABLE learning_training_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id UUID NOT NULL REFERENCES learning_trainings(id) ON DELETE CASCADE,
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_training_farmer UNIQUE (training_id, farmer_id)
);

CREATE INDEX idx_learning_enrollments_farmer ON learning_training_enrollments (farmer_id);
CREATE INDEX idx_learning_enrollments_training ON learning_training_enrollments (training_id);

CREATE TABLE learning_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_learning_groups_category ON learning_groups (category);

CREATE TABLE learning_group_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES learning_groups(id) ON DELETE CASCADE,
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_group_farmer UNIQUE (group_id, farmer_id)
);

CREATE INDEX idx_learning_memberships_farmer ON learning_group_memberships (farmer_id);
CREATE INDEX idx_learning_memberships_group ON learning_group_memberships (group_id);
