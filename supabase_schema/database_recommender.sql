-- Database schema for paper recommendation system

-- 1. Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Table Structure

-- User article interactions table
CREATE TABLE IF NOT EXISTS public.user_article_interactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id),
  arxiv_id TEXT NOT NULL,
  interaction_type TEXT NOT NULL, -- 'collect', 'pdf_open'
  interaction_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
  article_title TEXT,
  article_summary TEXT,
  article_category TEXT
);

-- User interests table
CREATE TABLE IF NOT EXISTS public.user_interests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id),
  interest_category TEXT NOT NULL, -- Main category like cs.AI, cs.CV
  interest_keyword TEXT NOT NULL, -- Keyword within the category
  score FLOAT DEFAULT 0.0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, interest_category, interest_keyword)
);

-- 3. Create Indexes
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON public.user_article_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_arxiv_id ON public.user_article_interactions(arxiv_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_type ON public.user_article_interactions(interaction_type);

CREATE INDEX IF NOT EXISTS idx_user_interests_user_id ON public.user_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interests_category ON public.user_interests(interest_category);
CREATE INDEX IF NOT EXISTS idx_user_interests_keyword ON public.user_interests(interest_keyword);

-- 4. Enable RLS
ALTER TABLE public.user_article_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;

-- 5. Create Policies

-- User Article Interactions Policy
CREATE POLICY "Users can view their own interactions" ON public.user_article_interactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interactions" ON public.user_article_interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User Interests Policy
CREATE POLICY "Users can view their own interests" ON public.user_interests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own interests" ON public.user_interests
  FOR ALL USING (auth.uid() = user_id);
