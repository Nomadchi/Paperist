-- 1. Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Table Structure
CREATE TABLE IF NOT EXISTS public.collected_articles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id),
  arxiv_id TEXT NOT NULL,
  title TEXT NOT NULL,
  authors JSONB,
  summary TEXT,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tags (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, name)
);

CREATE TABLE IF NOT EXISTS public.article_tags (
  article_id uuid REFERENCES public.collected_articles(id) ON DELETE CASCADE NOT NULL,
  tag_id uuid REFERENCES public.tags(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (article_id, tag_id)
);

-- 3. Enable RLS
ALTER TABLE public.collected_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_tags ENABLE ROW LEVEL SECURITY;

-- 4. Unique arxiv for each user
ALTER TABLE public.collected_articles 
ADD CONSTRAINT unique_user_arxiv_article UNIQUE (user_id, arxiv_id);

-- 5. Tags Policy
DROP POLICY IF EXISTS "Users can manage their own tags" ON public.tags;
CREATE POLICY "Users can manage their own tags" ON public.tags 
FOR ALL USING (auth.uid() = user_id);

-- 6. Article Tags Policy
DROP POLICY IF EXISTS "Users can manage their own article tags" ON public.article_tags;
CREATE POLICY "Users can manage their own article tags" ON public.article_tags 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.tags
    WHERE tags.id = article_tags.tag_id
    AND tags.user_id = auth.uid()
  )
);

-- 7. Collected Articles Policy
DROP POLICY IF EXISTS "Users can view their own collected articles." ON public.collected_articles;
CREATE POLICY "Users can view their own collected articles." ON public.collected_articles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own collected articles." ON public.collected_articles;
CREATE POLICY "Users can insert their own collected articles." ON public.collected_articles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own collected articles." ON public.collected_articles;
CREATE POLICY "Users can update their own collected articles." ON public.collected_articles
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own collected articles." ON public.collected_articles;
CREATE POLICY "Users can delete their own collected articles." ON public.collected_articles
  FOR DELETE USING (auth.uid() = user_id);

