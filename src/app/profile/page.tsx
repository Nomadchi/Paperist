// src/app/profile/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { supabase, Database } from '@/lib/supabase';

// 定义收藏文章的类型
type CollectedArticle = Database['public']['Tables']['collected_articles']['Row'];
type Tag = Database['public']['Tables']['tags']['Row'];

interface CollectedArticleCardProps {
  article: CollectedArticle & { tags: Tag[] }; // 添加 tags 属性
  onRemove: (id: string) => void;
}

const CollectedArticleCard: React.FC<CollectedArticleCardProps> = ({ article, onRemove }) => {
  return (
    <div className="border border-gray-300 p-4 m-2 rounded-md shadow-sm bg-white dark:bg-gray-800 flex flex-col justify-between">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{article.title}</h3>
        {article.authors && typeof article.authors === 'object' && Array.isArray(article.authors) && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            作者: {article.authors.map((a: any) => a.name).join(', ')}
          </p>
        )}
        <a href={article.pdf_url || '#'} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm mt-2 block">
          PDF 链接
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
        移除
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

  const fetchUserArticlesAndTags = async (filterTagId: string | null = null) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // 获取所有标签
        const { data: tagsData, error: tagsError } = await supabase
          .from('tags')
          .select('*')
          .eq('user_id', user.id);

        if (tagsError) {
          throw tagsError;
        }
        setAllTags(tagsData as Tag[]);

        // 获取收藏文章及关联标签
        let query;

        if (filterTagId) {
          query = supabase
            .from('collected_articles')
            .select('*, article_tags!inner(tag_id, tags(*))') 
            .eq('user_id', user.id)
            .eq('article_tags.tag_id', filterTagId);
        } else {
          query = supabase
            .from('collected_articles')
            .select('*, article_tags(tags(*))')
            .eq('user_id', user.id);
        }

        const { data: articlesData, error: articlesError } = await query;

        if (articlesError) {
          throw articlesError;
        }

        // 整理数据结构
        const formattedArticles = articlesData.map((article: any) => ({
          ...article,
          tags: article.article_tags.map((at: any) => at.tags),
        }));

        setCollectedArticles(formattedArticles as (CollectedArticle & { tags: Tag[] })[]);
      } else {
        setError('用户未登录。');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserArticlesAndTags(selectedFilterTag);
  }, [selectedFilterTag]); // 当筛选标签变化时重新获取数据

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
      alert('文章已移除！');
    } catch (e: any) {
      alert(`移除文章失败: ${e.message}`);
    }
  };

  const handleTagFilterClick = (tagId: string | null) => {
    setSelectedFilterTag(tagId);
  };

  if (loading) {
    return <p className="p-5 text-gray-600 dark:text-gray-400">加载中...</p>;
  }

  if (error) {
    return <p className="p-5 text-red-500">错误: {error}</p>;
  }

  if (!user) {
    return <p className="p-5 text-gray-600 dark:text-gray-400">请登录以查看您的收藏文章。</p>;
  }

  return (
    <div className="p-5">
      <h2 className="text-2xl font-bold mb-5 text-gray-800 dark:text-gray-200">我的收藏文章</h2>
      
      {/* 标签过滤栏 */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => handleTagFilterClick(null)}
          className={`px-3 py-1 rounded-full text-sm ${!selectedFilterTag ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
        >
          所有文章
        </button>
        {allTags.map(tag => (
          <button
            key={tag.id}
            onClick={() => handleTagFilterClick(tag.id)}
            className={`px-3 py-1 rounded-full text-sm ${selectedFilterTag === tag.id ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
          >
            {tag.name}
          </button>
        ))}
      </div>

      {collectedArticles.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">您还没有收藏任何文章。</p>
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
