import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

import { PaperCard, ArxivArticle } from '@/components/PaperCard';

const PaperistBoard: React.FC = () => {
  const [articles, setArticles] = useState<ArxivArticle[]>([]);
  const [currentArticleIndex, setCurrentArticleIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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

  const handleCollectArticle = async (article: ArxivArticle, tags: string[]) => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert('请先登录才能收藏文章。');
      return;
    }

    try {
      // 1. 插入文章到 collected_articles 表
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
        .select(); // 确保返回插入的文章数据，以便获取其 id

      if (articleError) {
        if (articleError.code === '23505') {
            alert('您已收藏过这篇文章。');
        } else {
            throw articleError;
        }
        return; // 如果文章插入失败，则停止后续操作
      }


      console.log("insert collected_articles success.");

      const collectedArticleId = articleData[0].id;

      

      // 2. 处理标签：查找或创建，并收集 tag_id
      const tagIds: string[] = [];
      for (const tagName of tags) {
        // 尝试查找现有标签
        console.log(tagName);
        const { data: existingTag, error: fetchTagError } = await supabase
          .from('tags')
          .select('id')
          .eq('user_id', user.id)
          .eq('name', tagName)
          .single();

        if (fetchTagError && fetchTagError.code !== 'PGRST116') { // PGRST116 表示没有找到行
          console.error('Error fetching tag:', fetchTagError);
          throw fetchTagError;
        }

        let tagId: string;
        if (existingTag) {
          tagId = existingTag.id;
        } else {
          // 如果标签不存在，则创建新标签
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

      // 3. 在 article_tags 表中创建文章与标签的关联
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
          // 这里可以考虑回滚 collected_articles 的插入，以确保事务原子性
          // 但 Supabase 客户端本身不直接支持事务，需要依赖后端函数
          throw articleTagError;
        }
      }

      alert('文章收藏成功！');
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

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.push('/');
    } else {
      alert('登出失败: ' + error.message);
    }
  };

  const currentArticle = articles[currentArticleIndex];

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
            {loading && <p className="text-gray-600 dark:text-gray-400 m-auto">加载中...</p>}
            {error && <p className="text-red-500 m-auto">错误: {error}</p>}
            {!loading && !currentArticle && articles.length === 0 && <p className="text-gray-600 dark:text-gray-400 m-auto">没有找到文章。</p>}
            
            {!loading && currentArticle && (
               <PaperCard
                 article={currentArticle}
                 onCollect={handleCollectArticle}
                 onNext={handleNextArticle}
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
