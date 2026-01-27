// src/app/profile/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase, Database } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';


type CollectedArticle = Database['public']['Tables']['collected_articles']['Row'];
type Tag = Database['public']['Tables']['tags']['Row'];


interface CollectedArticleCardProps {
  article: CollectedArticle & { tags: Tag[] };
  onRemove: (id: string) => void;
}

const CollectedArticleCard: React.FC<CollectedArticleCardProps> = ({ article, onRemove }) => {
  return (
    <div className="border border-gray-300 p-4 m-2 rounded-md shadow-sm bg-white dark:bg-gray-800 flex flex-col justify-between">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{article.title}</h3>
        {article.authors && typeof article.authors === 'object' && Array.isArray(article.authors) && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {article.authors.map((a: any) => a.name).join(', ')}
          </p>
        )}
        <a href={article.pdf_url || '#'} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm mt-2 block">
          PDF Link
        </a>
        <div className="flex flex-wrap gap-1 mt-2">
          {article.tags && article.tags.map(tag => (
            <span key={tag.id} className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full text-xs">
              {tag.name}
            </span>
          ))}
        </div>
      </div>
      <button
        onClick={() => onRemove(article.id)}
        className="ml-auto mt-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded self-end"
      >
        Remove
      </button>
    </div>
  );
};

const ProfilePage: React.FC = () => {
  const [collectedArticles, setCollectedArticles] = useState<(CollectedArticle & { tags: Tag[] })[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedFilterTag, setSelectedFilterTag] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const { signOut } = useAuth();

  const fetchUserArticlesAndTags = async (filterTagId: string | null = null) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // get all tags
        const { data: tagsData, error: tagsError } = await supabase
          .from('tags')
          .select('*')
          .eq('user_id', user.id);

        if (tagsError) {
          throw tagsError;
        }
        setAllTags(tagsData as Tag[]);

        // get collected articles

        let query;

        if (filterTagId) { // with specified tags
          query = supabase
            .from('collected_articles')
            .select('*, article_tags!inner(tag_id, tags(*))') 
            .eq('user_id', user.id)
            .eq('article_tags.tag_id', filterTagId);
        } else { // no tags specified
          query = supabase
            .from('collected_articles')
            .select('*, article_tags(tags(*))')
            .eq('user_id', user.id);
        }

        const { data: articlesData, error: articlesError } = await query;

        if (articlesError) {
          throw articlesError;
        }

        const formattedArticles = articlesData.map((article: any) => ({
          ...article,
          tags: article.article_tags.map((at: any) => at.tags),
        }));

        setCollectedArticles(formattedArticles as (CollectedArticle & { tags: Tag[] })[]);
      } else {
        setError('User not logged in');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserArticlesAndTags(selectedFilterTag);
  }, [selectedFilterTag]); 

  const handleRemoveArticle = async (id: string) => {
    try {
      const { error } = await supabase
        .from('collected_articles')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }
      setCollectedArticles(collectedArticles.filter(article => article.id !== id));
      alert('The article is removed');
    } catch (e: any) {
      alert(`Removal Error: ${e.message}`);
    }
  };

  const handleDeleteTag = async (e: React.MouseEvent, tagId: string) => {
    
    e.stopPropagation();
  
    if (!window.confirm('Remove the tag ?')) return;
  
    try {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', tagId);
  
      if (error) throw error;
  
      
      setAllTags(prev => prev.filter(t => t.id !== tagId));
  
      setCollectedArticles(prevArticles => 
        prevArticles.map(article => ({
          ...article,
          tags: article.tags.filter(t => t.id !== tagId)
        }))
      );
  
      if (selectedFilterTag === tagId) {
        setSelectedFilterTag(null);
      }
  
    } catch (err: any) {
      alert(`Removal Error: ${err.message}`);
    }
  };

  const handleTagFilterClick = (tagId: string | null) => {
    setSelectedFilterTag(tagId);
  };

  if (loading) {
    return <p className="p-5 text-gray-600 dark:text-gray-400">Loading...</p>;
  }

  if (error) {
    return <p className="p-5 text-red-500">Error: {error}</p>;
  }

  if (!user) {
    return <p className="p-5 text-gray-600 dark:text-gray-400">Please log in to check your collected articles</p>;
  }

  return (
    <div className="p-5">

      <h2 className="text-2xl font-bold mb-5 text-gray-800 dark:text-gray-200">Collected Articles</h2>
      
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => handleTagFilterClick(null)}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${
            !selectedFilterTag ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          All Articles
        </button>
        {allTags.map(tag => (
          <div
            key={tag.id}
            className={`flex items-center group rounded-full px-3 py-1 text-sm transition-all ${
              selectedFilterTag === tag.id 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
           
            <button
              onClick={() => handleTagFilterClick(tag.id)}
              className="mr-1 focus:outline-none"
            >
              {tag.name}
            </button>
            
            <button
              onClick={(e) => handleDeleteTag(e, tag.id)}
              className={`ml-1 flex items-center justify-center w-4 h-4 rounded-full transition-colors ${
                selectedFilterTag === tag.id 
                  ? 'hover:bg-blue-400 text-blue-100' 
                  : 'hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-400'
              }`}
              title="Delete tag"
            >
              <span className="leading-none text-xs">×</span>
            </button>
          </div>
        ))}
      </div>

      {collectedArticles.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">You haven't collected any articles yet</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collectedArticles.map((article) => (
            <CollectedArticleCard key={article.id} article={article} onRemove={handleRemoveArticle} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
