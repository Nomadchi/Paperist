// src/app/profile/page.tsx
'use client'; // This is a client component

import React, { useState, useEffect } from 'react';
import { supabase, Database } from '@/lib/supabase'; // 确保路径正确

// 定义收藏文章的类型
type CollectedArticle = Database['public']['Tables']['collected_articles']['Row'];

interface CollectedArticleCardProps {
  article: CollectedArticle;
  onRemove: (id: string) => void;
}

const CollectedArticleCard: React.FC<CollectedArticleCardProps> = ({ article, onRemove }) => {
  return (
    <div className="border border-gray-300 p-4 m-2 rounded-md shadow-sm bg-white dark:bg-gray-800 flex justify-between items-center">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{article.title}</h3>
        {article.authors && typeof article.authors === 'object' && Array.isArray(article.authors) && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            作者: {article.authors.map((a: any) => a.name).join(', ')}
          </p>
        )}
        <a href={article.pdf_url || '#'} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm">
          PDF 链接
        </a>
      </div>
      <button
        onClick={() => onRemove(article.id)}
        className="ml-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
      >
        移除
      </button>
    </div>
  );
};

const ProfilePage: React.FC = () => {
  const [collectedArticles, setCollectedArticles] = useState<CollectedArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null); // 这里我们存储 Supabase 用户对象

  useEffect(() => {
    const fetchUserAndArticles = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
          const { data, error } = await supabase
            .from('collected_articles')
            .select('*')
            .eq('user_id', user.id);

          if (error) {
            throw error;
          }
          setCollectedArticles(data as CollectedArticle[]);
        } else {
          setError('用户未登录。');
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndArticles();
  }, []);

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
