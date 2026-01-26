import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Star, ArrowRight } from 'lucide-react';

import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// 定义 ArXiv 文章的类型
interface ArxivArticle {
  id: string;
  title: string;
  authors: string[];
  pdf_url: string;
  summary: string;
}

// 预处理 LaTeX 文本格式命令的函数
const preprocessLatexText = (text: string): string => {
  // 替换 \textbf{...} 为 **...** (Markdown bold)
  let processedText = text.replace(/\\textbf\{(.*?)\}/g, '**$1**');
  // 替换 \emph{...} 为 *...* (Markdown italic)
  processedText = processedText.replace(/\\emph\{(.*?)\}/g, '*$1*');
  processedText = processedText.replace(/\\texttt\{(.?)\}/g, '$1');
  return processedText;
};

// PaperCard 组件
interface PaperCardProps {
  article: ArxivArticle;
  onCollect: (article: ArxivArticle) => void;
  onNext: () => void;
}

const PaperCard: React.FC<PaperCardProps> = ({ article, onCollect, onNext }) => {
  const processedSummary = preprocessLatexText(article.summary); // 预处理摘要

  return (
    // 整个卡片容器，占据可用高度，内部 flex 列布局
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 w-full max-w-2xl overflow-hidden">
      
      {/* 上部区域：标题 + 作者 (固定不动) */}
      <div className="p-6 pb-2 flex-none">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 text-left leading-tight">
          {article.title}
        </h3>
        <p className="text-sm text-gray-700 dark:text-gray-300 text-left font-medium">
          {article.authors.join(', ')}
        </p>
      </div>

      {/* 中部区域：摘要 (只有这里会滚动) */}
      {/* flex-1 让它占据剩余所有空间，overflow-y-auto 开启滚动 */}
      <div className="flex-1 overflow-y-auto px-6 py-2 custom-scrollbar">
        {/* 使用 processedSummary */}
        <div key={article.id} className="text-sm text-gray-600 dark:text-gray-400 text-left leading-relaxed text-justify prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown 
            remarkPlugins={[remarkMath]} 
            rehypePlugins={[rehypeKatex]}
          >
            {processedSummary}
          </ReactMarkdown>
       </div>
      </div>

      {/* 底部区域：按钮 (固定在底部) */}
      <div className="p-6 pt-4 flex-none bg-white dark:bg-gray-800 z-10">
        <div className="flex space-x-4 justify-start"> {/* 修改 3: justify-start 靠左对齐 */}
          {/* "View PDF" Button */}
          <a
            href={article.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full w-12 h-12 flex items-center justify-center shadow-sm hover:shadow-md transition-all bg-blue-500 hover:bg-blue-600 text-white font-bold text-lg"
            title="查看 PDF"
          >
            P
          </a>
          {/* "Collect Article" Button */}
          <button
            onClick={() => onCollect(article)}
            className="rounded-full w-12 h-12 flex items-center justify-center shadow-sm hover:shadow-md transition-all bg-yellow-400 hover:bg-yellow-500"
            title="收藏文章"
          >
            <Star className="text-white w-6 h-6" />
          </button>
          {/* "Next Recommendation" Button */}
          <button
            onClick={onNext}
            className="rounded-full w-12 h-12 flex items-center justify-center shadow-sm hover:shadow-md transition-all bg-green-500 hover:bg-green-600"
            title="下一篇推荐"
          >
            <ArrowRight className="text-white w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

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