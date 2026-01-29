// PaperistBoard.tsx
import React, {useEffect} from 'react';
import { supabase } from '@/lib/supabase';
import { PaperCard, ArxivArticle } from '@/components/PaperCard';
import { usePaperStack } from '@/hooks/usePaperStack';
import { useAuth } from '@/contexts/AuthContext';
import { SEARCH_PAPER_EVENT } from '@/lib/events';

const PaperistBoard: React.FC = () => {
  
  const { currentArticle, loading, error, nextArticle, injectArticle } = usePaperStack();

  useEffect(() => {
   
    const handleSearchSelection = (e: any) => {
      const paper = e.detail as ArxivArticle;
      if (paper) {
        injectArticle(paper);
      }
    };

    window.addEventListener(SEARCH_PAPER_EVENT, handleSearchSelection);
    return () => window.removeEventListener(SEARCH_PAPER_EVENT, handleSearchSelection);
  }, [injectArticle]);

  const handleCollectArticle = async (article: ArxivArticle, tags: string[]) => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert('Please log in first');
      return;
    }

    try {

      // 1. Handle articles: write the collected article into collected_articles and get its ID
      const { data: articleData, error: articleError } = await supabase
        .from('collected_articles')
        .insert([
          {
            user_id: user.id,
            arxiv_id: article.id,
            title: article.title,
            authors: article.authors.map(name => ({ name })), 
            summary: article.summary,
            pdf_url: article.pdf_url,
          },
        ])
        .select();

      if (articleError) {
        throw articleError;
      }

      console.log("insert collected_articles success.");

      const collectedArticleId = articleData[0].id;

      

      // 2. Handle tags: find or create tags and collect tag_id
      if (tags.length > 0) {
      
        const { data: tagsData, error: tagsError } = await supabase
          .from('tags')
          .upsert(
            tags.map(name => ({ user_id: user.id, name })),
            { onConflict: 'user_id, name' } 
          )
          .select('id');
      
        if (tagsError) throw tagsError;
      
        // 3. handle associations
        const articleTagsToInsert = tagsData.map(t => ({
          article_id: collectedArticleId,
          tag_id: t.id,
        }));
      
        const { error: relError } = await supabase
          .from('article_tags')
          .insert(articleTagsToInsert);
      
        if (relError) throw relError;
      }

      alert('Collected Successfully');
    } catch (e: any) {
      alert(`Collection Error: ${e.message}`);
    }
  };

  
  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-white dark:bg-gray-950 overflow-hidden">

      <div className="flex flex-1 overflow-hidden"> 
        <div className="w-1/2 h-full p-6 flex flex-col items-center overflow-hidden">
            {loading && <p className="text-gray-600 dark:text-gray-400 m-auto">Loading...</p>}
            {error && <p className="text-red-500 m-auto">Error: {error}</p>}
            {!loading && !currentArticle && <p className="text-gray-600 dark:text-gray-400 m-auto">No articles</p>}
            
            {!loading && currentArticle && (
               <PaperCard
                 key={currentArticle.id}
                 article={currentArticle}
                 onCollect={handleCollectArticle}
                 onNext={nextArticle}
               />
            )}
        </div>

        <div className="w-1/2 h-full bg-gray-50 dark:bg-gray-950 border-l border-gray-200 dark:border-gray-700 hidden md:block">
        </div>
      </div>
    </div>
  );
};

export default PaperistBoard;
