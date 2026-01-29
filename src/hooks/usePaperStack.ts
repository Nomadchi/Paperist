// @/hooks/usePaperStack.ts
import { useState, useCallback, useEffect } from 'react';
import { ArxivArticle } from '@/components/PaperCard';
import { fetchArxivArticles, CATEGORIES } from '@/lib/arxivService';
import { getRecommendedPapers } from '@/lib/recommendationService';
import { supabase } from '@/lib/supabase';

export const usePaperStack = () => {
  const [articles, setArticles] = useState<ArxivArticle[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getRecommendation = useCallback(async () => {
    setLoading(true);
    try {
      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      
      let newArticles: ArxivArticle[] = [];
      
      if (user) {
        // Use personalized recommendation
        newArticles = await getRecommendedPapers(user.id, 10);
       
        // If no recommended papers, use random categories
        if (newArticles.length === 0) {
          const randomCategory = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
          const randomStart = Math.floor(Math.random() * 100);
          
          newArticles = await fetchArxivArticles({
            query: randomCategory,
            searchField: "cat",
            start: randomStart,
            maxResults: 10
          });
        }
      } else {
        // For anonymous users, use random categories
        const randomCategory = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
        const randomStart = Math.floor(Math.random() * 100);
        
        newArticles = await fetchArxivArticles({
          query: randomCategory,
          searchField: "cat",
          start: randomStart,
          maxResults: 10
        });
      }

      setArticles(newArticles);
      setCurrentIndex(0);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const injectArticle = useCallback((article: ArxivArticle) => {
    setArticles([article]);
    setCurrentIndex(0);
  }, []);

  const nextArticle = useCallback(() => {
    if (currentIndex < articles.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      getRecommendation();
    }
  }, [currentIndex, articles, getRecommendation]);

  useEffect(() => {
    getRecommendation();
  }, [getRecommendation]);

  return {
    currentArticle: articles[currentIndex],
    loading,
    error,
    nextArticle,
    refresh: getRecommendation,
    injectArticle
  };
};