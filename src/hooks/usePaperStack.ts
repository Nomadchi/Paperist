// @/hooks/usePaperStack.ts
import { useState, useCallback, useEffect } from 'react';
import { ArxivArticle } from '@/components/PaperCard';
import { fetchArxivArticles, CATEGORIES } from '@/lib/arxivService';

export const usePaperStack = () => {
  const [articles, setArticles] = useState<ArxivArticle[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- 未来推荐算法逻辑可以在这里扩展 ---
  const getRecommendation = useCallback(async () => {
    setLoading(true);
    try {
      // 策略：随机选取分类和偏移量 (未来可替换为基于 Supabase 历史的推荐)
      const randomCategory = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
      const randomStart = Math.floor(Math.random() * 100);
      
      const newArticles = await fetchArxivArticles({
        category: randomCategory,
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
    refresh: getRecommendation
  };
};