// @/hooks/usePaperStack.ts
import { useState, useCallback, useEffect } from 'react';
import { ArxivArticle } from '@/components/PaperCard';
import { fetchArxivArticles, CATEGORIES } from '@/lib/arxivService';

export const usePaperStack = () => {
  const [articles, setArticles] = useState<ArxivArticle[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getRecommendation = useCallback(async () => {
    setLoading(true);
    try {

      const randomCategory = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
      const randomStart = Math.floor(Math.random() * 100);
      
      const newArticles = await fetchArxivArticles({
        query: randomCategory,
        searchField: "cat",
        start: randomStart,
        maxResults: 10
      });

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