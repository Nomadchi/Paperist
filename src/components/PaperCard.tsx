import React from 'react';
import { Star, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// 定义 ArXiv 文章的类型
export interface ArxivArticle {
  id: string; // ArXiv 文章的唯一标识符
  title: string;
  authors: string[];
  pdf_url: string;
  summary: string; // 添加 summary 字段
}

// 预处理 LaTeX 文本格式命令的函数
export const preprocessLatexText = (text: string): string => {
  // 替换 \textbf{...} 为 **...** (Markdown bold)
  let processedText = text.replace(/\\textbf\{(.*?)\}/g, '**$1**');
  // 替换 \emph{...} 为 *...* (Markdown italic)
  processedText = processedText.replace(/\\emph\{(.*?)\}/g, '*$1*');
  // 替换 \texttt{...} 为 `...` (Markdown inline code)
  processedText = processedText.replace(/\\texttt\{(.*?)\}/g, '`$1`');
  return processedText;
};

// PaperCard 组件
interface PaperCardProps {
  article: ArxivArticle; // 接收整个文章对象
  onCollect: (article: ArxivArticle) => void;
  onNext: () => void;
}

export const PaperCard: React.FC<PaperCardProps> = ({ article, onCollect, onNext }) => {
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
