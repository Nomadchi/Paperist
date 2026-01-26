-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- Create collected articles table
CREATE TABLE IF NOT EXISTS collected_articles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id),
  arxiv_id TEXT NOT NULL,
  title TEXT NOT NULL,
  authors JSONB,
  summary TEXT,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE collected_articles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for collected articles
CREATE POLICY "Users can view their own collected articles." ON public.collected_articles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own collected articles." ON public.collected_articles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collected articles." ON public.collected_articles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collected articles." ON public.collected_articles
  FOR DELETE USING (auth.uid() = user_id);
