// PaperistBoard.tsx
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PaperCard, ArxivArticle } from '@/components/PaperCard';
import { usePaperStack } from '@/hooks/usePaperStack';

const PaperistBoard: React.FC = () => {
  const router = useRouter();
  const { currentArticle, loading, error, nextArticle } = usePaperStack();

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
      const tagIds: string[] = [];
      for (const tagName of tags) {
        console.log(tagName);
        const { data: existingTag, error: fetchTagError } = await supabase
          .from('tags')
          .select('id')
          .eq('user_id', user.id)
          .eq('name', tagName)
          .single();

        if (fetchTagError && fetchTagError.code !== 'PGRST116') {
          console.error('Error fetching tag:', fetchTagError);
          throw fetchTagError;
        }

        let tagId: string;
        if (existingTag) {
          tagId = existingTag.id;
        } else {
          const { data: newTagData, error: newTagError } = await supabase
            .from('tags')
            .insert([{ user_id: user.id, name: tagName }])
            .select('id')
            .single();

          if (newTagError) {
            console.error('Error creating new tag:', newTagError);
            throw newTagError;
          }
          tagId = newTagData.id;
        }
        tagIds.push(tagId);
      }

      // 3. Handle association: create an association of articles with tags in a article_tags table
      if (tagIds.length > 0) {
        const articleTagsToInsert = tagIds.map(tagId => ({
          article_id: collectedArticleId,
          tag_id: tagId,
        }));
        
        const { error: articleTagError } = await supabase
          .from('article_tags')
          .insert(articleTagsToInsert);

        if (articleTagError) {
          console.error('Error inserting article tags:', articleTagError);
          throw articleTagError;
        }
      }

      alert('Collected Successfully');
    } catch (e: any) {
      alert(`Collection Error: ${e.message}`);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.push('/');
    } else {
      alert('Logout Error: ' + error.message);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-950 overflow-hidden">
      
      <nav className="flex-none bg-gray-100 dark:bg-gray-900 p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between z-10 shadow-sm relative h-16">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Paperist</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleLogout}
            className="text-gray-800 dark:text-gray-200 hover:text-red-600 dark:hover:text-red-400 text-lg font-medium"
          >
            Logout
          </button>
          <Link href="/profile" className="text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 text-lg font-medium">
            Profile
          </Link>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden"> 
        <div className="w-1/2 h-full p-6 flex flex-col items-center">
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
