import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase'; // 导入 Supabase 客户端

import { PaperCard, ArxivArticle } from '@/components/PaperCard'; // 从新文件导入 PaperCard 和 ArxivArticle

// PaperistBoard 主组件
const PaperistBoard: React.FC = () => {
  const [articles, setArticles] = useState<ArxivArticle[]>([]);
  const [currentArticleIndex, setCurrentArticleIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArxivArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const randomCategory = ['cs.AI', 'cs.CV', 'cs.LG', 'cs.CL'][Math.floor(Math.random() * 4)];
      const randomStart = Math.floor(Math.random() * 100); 
      const response = await fetch(`/api/arxiv?query=cat:${randomCategory}&sortBy=submittedDate&sortOrder=descending&max_results=10&start=${randomStart}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const xmlText = await response.text();
      
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "text/xml");
      const entries = xmlDoc.getElementsByTagName('entry');

      const fetchedArticles: ArxivArticle[] = Array.from(entries).map(entry => {
        const id = entry.getElementsByTagName('id')[0]?.textContent || 'N/A';
        const title = entry.getElementsByTagName('title')[0]?.textContent || 'N/A';
        const authors = Array.from(entry.getElementsByTagName('author')).map(
          author => author.getElementsByTagName('name')[0]?.textContent || 'Unknown'
        );
        const pdfLinkElement = Array.from(entry.getElementsByTagName('link')).find(
          link => link.getAttribute('title') === 'pdf'
        );
        const pdf_url = pdfLinkElement?.getAttribute('href') || 'N/A';
        const summary = entry.getElementsByTagName('summary')[0]?.textContent || 'N/A'; 

        return { id, title, authors, pdf_url, summary };
      });

      setArticles(fetchedArticles);
      setCurrentArticleIndex(0);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArxivArticles();
  }, [fetchArxivArticles]);

  const handleCollectArticle = async (article: ArxivArticle) => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert('请先登录才能收藏文章。');
      return;
    }

    try {
      const { error } = await supabase
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
        ]);

      if (error) {
        if (error.code === '23505') {
            alert('您已收藏过这篇文章。');
        } else {
            throw error;
        }
      } else {
        alert('文章收藏成功！');
      }
    } catch (e: any) {
      alert(`收藏文章失败: ${e.message}`);
    }
  };

  const handleNextArticle = () => {
    if (currentArticleIndex < articles.length - 1) {
      setCurrentArticleIndex(prevIndex => prevIndex + 1);
    } else {
      fetchArxivArticles();
    }
  };

  const currentArticle = articles[currentArticleIndex];

  return (
    // 布局结构：全屏，无页面级滚动
    <div className="flex flex-col h-screen bg-white dark:bg-gray-950 overflow-hidden">
      
      {/* 导航栏 */}
      <nav className="flex-none bg-gray-100 dark:bg-gray-900 p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between z-10 shadow-sm relative h-16">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Paperist</h1>
        <div>
          <Link href="/profile" className="text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 text-lg font-medium">
            Profile
          </Link>
        </div>
      </nav>

      {/* 主内容区域 */}
      <div className="flex flex-1 overflow-hidden"> 
        
        {/* 左半部分：文章卡片容器 */}
        {/* h-full 确保左侧面板占据父容器的全部高度，p-6 内部填充 */}
        <div className="w-1/2 h-full p-6 flex flex-col items-center">
            {loading && <p className="text-gray-600 dark:text-gray-400 m-auto">加载中...</p>}
            {error && <p className="text-red-500 m-auto">错误: {error}</p>}
            {!loading && !currentArticle && articles.length === 0 && <p className="text-gray-600 dark:text-gray-400 m-auto">没有找到文章。</p>}
            
            {!loading && currentArticle && (
               // 修改 4: 移除了 justify-center，直接让 Card 填满高度
               // 这样卡片会从顶部开始（距离导航栏近），并一直延伸到底部
               <PaperCard
                 article={currentArticle}
                 onCollect={handleCollectArticle}
                 onNext={handleNextArticle}
               />
            )}
        </div>

        {/* 右半部分：空 */}
        <div className="w-1/2 h-full bg-gray-50 dark:bg-gray-950 border-l border-gray-200 dark:border-gray-700 hidden md:block">
          {/* 这里以后可以放 Chat 窗口或 PDF 预览 */}
        </div>
      </div>
    </div>
  );
};

export default PaperistBoard;