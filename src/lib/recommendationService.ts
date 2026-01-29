// recommendationService.ts
import { supabase } from './supabase';
import { fetchArxivArticles } from './arxivService';
import { ArxivArticle } from '@/components/PaperCard';

interface InterestGroup {
  score: number;
  keywords: { keyword: string; score: number }[];
}

export const getUserInterests = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_interests')
      .select('*')
      .eq('user_id', userId)
      .order('score', { ascending: false });

    if (error || !data) return {};

    const interestsByCategory: Record<string, InterestGroup> = {};

    data.forEach(item => {
      const { interest_category, interest_keyword, score } = item;
      
      if (!interestsByCategory[interest_category]) {
        interestsByCategory[interest_category] = { score: 0, keywords: [] };
      }
    
      interestsByCategory[interest_category].score += score;

      if (interest_keyword && interest_keyword !== interest_category) {
        interestsByCategory[interest_category].keywords.push({
          keyword: interest_keyword,
          score: score
        });
      }
    });

    Object.keys(interestsByCategory).forEach(cat => {
      interestsByCategory[cat].keywords.sort((a, b) => b.score - a.score);
    });

    return interestsByCategory;
  } catch (error) {
    console.error('Error getting user interests:', error);
    return {};
  }
};


export const getRecommendedPapers = async (userId: string, limit: number = 10) => {
  try {
    
    // 1. Get user interests and collected articles
    const [interestsByCategory, collectedResponse] = await Promise.all([
      getUserInterests(userId),
      supabase.from('collected_articles').select('arxiv_id').eq('user_id', userId)
    ]);

    const collectedIds = new Set(collectedResponse.data?.map(p => p.arxiv_id) || []);

    const categories = Object.keys(interestsByCategory);
    let searchConfigs = [];

    if (categories.length > 0) {
      // top 3 categories by score
      const topCategories = categories
        .sort((a, b) => interestsByCategory[b].score - interestsByCategory[a].score)
        .slice(0, 3);

      searchConfigs = topCategories.map(category => {
        const group = interestsByCategory[category];
        // top 4 keywords by score
        const topKeywords = group.keywords.slice(0, 4).map(k => k.keyword);
        
        
        // use custom mode for arxiv articles fetch api 
        let queryStr = `cat:${category}`;
        if (topKeywords.length > 0) {
          const keywordPart = topKeywords.map(k => `all:"${k}"`).join(' OR ');
          queryStr += ` AND (${keywordPart})`;
        }

        return {
          query: queryStr,
          weight: group.score,
          category
        };
      });
    } else {
      // cold start: default categories
      searchConfigs = [
        { query: 'cat:cs.AI', weight: 1.0, category: 'cs.AI' },
        { query: 'cat:cs.LG', weight: 0.9, category: 'cs.LG' },
        { query: 'cat:cs.CV', weight: 0.8, category: 'cs.CV' }
      ];
    }

    // 2. Parallel fetch arxiv articles for each category
    const fetchPromises = searchConfigs.map(config => 
      fetchArxivArticles({
        query: config.query,
        searchField: 'custom', 
        maxResults: 8, 
        sortBy: 'submittedDate'
      }).then(papers => ({ papers, weight: config.weight }))
    );

    const results = await Promise.all(fetchPromises);

    // 3. Mix, de-duplicate, and re-rank
    const allCandidates: (ArxivArticle & { score: number })[] = [];
    const seenIds = new Set();

    results.forEach(({ papers, weight }) => {
      papers.forEach((paper, index) => {

        const pureId = paper.id.split('v')[0]; 
        if (collectedIds.has(pureId) || collectedIds.has(paper.id)) return;

        if (!seenIds.has(paper.id)) {
          seenIds.add(paper.id);
          
          const rankDecay = 1 / (index + 1); 
          const finalScore = weight * rankDecay;

          allCandidates.push({
            ...paper,
            score: finalScore
          });
        }
      });
    });

    // 5. final sort and limit
    const sortedPapers = allCandidates
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return sortedPapers.map(({ score, ...paper }) => paper);

  } catch (error) {
    console.error('Error generating recommendations:', error);
    return [];
  }
};