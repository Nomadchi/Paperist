import React, { useState, useEffect } from 'react';

// 定义 ArXiv 文章的类型
interface ArxivArticle {
  id: string;
  title: string;
  authors: string[];
  pdf_url: string;
  summary: string;
}

// PaperCard 组件，用于显示单篇 ArXiv 文章
interface PaperCardProps {
  title: string;
  authors: string[];
}

const PaperCard: React.FC<PaperCardProps> = ({ title, authors }) => {
  return (
    <div className="border border-gray-300 p-4 m-2 rounded-md shadow-sm hover:shadow-md transition-shadow duration-300 bg-white dark:bg-gray-800">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">作者: {authors.join(', ')}</p>
    </div>
  );
};

// PaperistBoard 主组件
const PaperistBoard: React.FC = () => {
  const [articles, setArticles] = useState<ArxivArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArxivArticles = async () => {
      try {
        const response = await fetch('/api/arxiv?query=cat:cs.AI');
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
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchArxivArticles();
  }, []);

  return (
    <div>
      {/* 导航栏 */}
      <nav className="bg-gray-100 dark:bg-gray-900 p-4 border-b border-gray-200 dark:border-gray-700 flex items-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Paperist</h1>
        {/* 这里可以添加其他导航项，例如搜索栏、用户资料等 */}
      </nav>

      <div className="p-5">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">推荐文章</h2>
        {loading && <p className="text-gray-600 dark:text-gray-400">加载中...</p>}
        {error && <p className="text-red-500">错误: {error}</p>}
        {!loading && articles.length === 0 && <p className="text-gray-600 dark:text-gray-400">没有找到文章。</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.map((article) => (
            <PaperCard key={article.id} title={article.title} authors={article.authors} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PaperistBoard;
