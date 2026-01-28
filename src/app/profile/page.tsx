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
  onRemoveTag: (articleId: string, tagId: string) => void;
}

const CollectedArticleCard: React.FC<CollectedArticleCardProps> = ({ article, onRemove, onRemoveTag }) => {
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
            <div key={tag.id} className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full text-xs flex items-center">
              <span>{tag.name}</span>
              <button
                onClick={() => onRemoveTag(article.id, tag.id)}
                className="ml-1 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 focus:outline-none"
                title="Remove tag"
              >
                ×
              </button>
            </div>
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

interface TagEditState {
  id: string;
  name: string;
  isEditing: boolean;
}

const ProfilePage: React.FC = () => {
  const [collectedArticles, setCollectedArticles] = useState<(CollectedArticle & { tags: Tag[] })[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedFilterTag, setSelectedFilterTag] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isModifyTagsMode, setIsModifyTagsMode] = useState<boolean>(false);
  const [tagEditStates, setTagEditStates] = useState<TagEditState[]>([]);

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

        // 初始化tag编辑状态
        setTagEditStates(tagsData.map(tag => ({
          id: tag.id,
          name: tag.name,
          isEditing: false
        })));

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

  const handleRemoveTag = async (articleId: string, tagId: string) => {
    try {
      const { error } = await supabase
        .from('article_tags')
        .delete()
        .eq('article_id', articleId)
        .eq('tag_id', tagId);

      if (error) throw error;

      setCollectedArticles(prevArticles => 
        prevArticles.map(article => {
          if (article.id === articleId) {
            return {
              ...article,
              tags: article.tags.filter(t => t.id !== tagId)
            };
          }
          return article;
        })
      );

    } catch (err: any) {
      alert(`Removal Error: ${err.message}`);
    }
  };

  const handleEnterEditTag = (tagId: string) => {
    setTagEditStates(prev => prev.map(tag => 
      tag.id === tagId ? { ...tag, isEditing: true } : tag
    ));
  };

  const handleSaveTagEdit = async (tagId: string, newName: string) => {
    if (!newName.trim()) {
      alert('Tag name cannot be empty');
      return;
    }

    try {
      const { error } = await supabase
        .from('tags')
        .update({ name: newName.trim() })
        .eq('id', tagId);

      if (error) throw error;

      // 更新本地状态
      setTagEditStates(prev => prev.map(tag => 
        tag.id === tagId ? { ...tag, name: newName.trim(), isEditing: false } : tag
      ));

      setAllTags(prev => prev.map(tag => 
        tag.id === tagId ? { ...tag, name: newName.trim() } : tag
      ));

      // 更新文章中的标签名称
      setCollectedArticles(prev => prev.map(article => ({
        ...article,
        tags: article.tags.map(tag => 
          tag.id === tagId ? { ...tag, name: newName.trim() } : tag
        )
      })));

    } catch (err: any) {
      alert(`Edit Error: ${err.message}`);
    }
  };

  const handleCancelTagEdit = (tagId: string) => {
    const originalTag = allTags.find(t => t.id === tagId);
    if (originalTag) {
      setTagEditStates(prev => prev.map(tag => 
        tag.id === tagId ? { ...tag, name: originalTag.name, isEditing: false } : tag
      ));
    }
  };

  const handleConfirmModifications = () => {
    // 检查是否有正在编辑的标签
    const hasEditingTags = tagEditStates.some(tag => tag.isEditing);
    if (hasEditingTags) {
      alert('Please save or cancel all tag edits before exiting modify mode');
      return;
    }

    setIsModifyTagsMode(false);
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

      <div className="flex justify-between items-center mb-5">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Collected Articles</h2>
        {!isModifyTagsMode ? (
          <button
            onClick={() => setIsModifyTagsMode(true)}
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md text-sm font-medium"
          >
            Modify Tags
          </button>
        ) : (
          <button
            onClick={handleConfirmModifications}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md text-sm font-medium"
          >
            Confirm Modifications
          </button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => handleTagFilterClick(null)}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${
            !selectedFilterTag ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
          disabled={isModifyTagsMode}
        >
          All Articles
        </button>
        {allTags.map(tag => {
          const tagEditState = tagEditStates.find(t => t.id === tag.id);
          return (
            <div
              key={tag.id}
              className={`flex items-center rounded-full px-3 py-1 text-sm transition-all ${
                selectedFilterTag === tag.id 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {isModifyTagsMode ? (
                tagEditState?.isEditing ? (
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={tagEditState.name}
                      onChange={(e) => setTagEditStates(prev => prev.map(t => 
                        t.id === tag.id ? { ...t, name: e.target.value } : t
                      ))}
                      className="bg-transparent border border-gray-300 rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-1"
                      autoFocus
                      onBlur={() => handleSaveTagEdit(tag.id, tagEditState.name)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') handleSaveTagEdit(tag.id, tagEditState.name);
                        if (e.key === 'Escape') handleCancelTagEdit(tag.id);
                      }}
                    />
                    <button
                      onClick={() => handleSaveTagEdit(tag.id, tagEditState.name)}
                      className="ml-1 text-green-500 hover:text-green-700 focus:outline-none"
                      title="Save"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => handleCancelTagEdit(tag.id)}
                      className="ml-1 text-red-500 hover:text-red-700 focus:outline-none"
                      title="Cancel"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <span>{tag.name}</span>
                    <button
                      onClick={() => handleEnterEditTag(tag.id)}
                      className="ml-1 text-gray-500 hover:text-blue-500 focus:outline-none"
                      title="Edit tag"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={(e) => handleDeleteTag(e, tag.id)}
                      className="ml-1 text-gray-500 hover:text-red-500 focus:outline-none"
                      title="Delete tag"
                    >
                      ×
                    </button>
                  </div>
                )
              ) : (
                <>
                  <button
                    onClick={() => handleTagFilterClick(tag.id)}
                    className="mr-1 focus:outline-none"
                  >
                    {tag.name}
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>

      {collectedArticles.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">You haven't collected any articles yet</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collectedArticles.map((article) => (
            <CollectedArticleCard key={article.id} article={article} onRemove={handleRemoveArticle} onRemoveTag={handleRemoveTag} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
