import React, { useState, useEffect } from 'react';
import { Star, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { supabase } from '@/lib/supabase'; // 导入 supabase 客户端

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
  onCollect: (article: ArxivArticle, tags: string[]) => void; // 更新 onCollect 接收 tags
  onNext: () => void;
}

export const PaperCard: React.FC<PaperCardProps> = ({ article, onCollect, onNext }) => {
  const processedSummary = preprocessLatexText(article.summary); // 预处理摘要
  const [tagInput, setTagInput] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState<boolean>(false);

  // 获取用户已创建的历史标签
  useEffect(() => {
    const fetchUserTags = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('tags')
          .select('name')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching user tags:', error);
        } else if (data) {
          setAvailableTags(data.map(tag => tag.name));
        }
      }
    };
    fetchUserTags();
  }, []);

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);
    setShowTagSuggestions(true);
  };

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !selectedTags.includes(trimmedTag)) {
      setSelectedTags([...selectedTags, trimmedTag]);
      setTagInput('');
      setShowTagSuggestions(false);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      addTag(tagInput);
    }
    if (e.key === 'Backspace' && tagInput === '' && selectedTags.length > 0) {
      setSelectedTags(prevTags => prevTags.slice(0, prevTags.length - 1));
    }
  };

  const filteredTags = availableTags.filter(tag =>
    tag.toLowerCase().includes(tagInput.toLowerCase()) && !selectedTags.includes(tag)
  );

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 w-full max-w-2xl overflow-hidden">
      <div className="p-6 pb-2 flex-none">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 text-left leading-tight">
          {article.title}
        </h3>
        <p className="text-sm text-gray-700 dark:text-gray-300 text-left font-medium">
          {article.authors.join(', ')}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-2 custom-scrollbar">
        <div key={article.id} className="text-sm text-gray-600 dark:text-gray-400 text-left leading-relaxed text-justify prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown 
            remarkPlugins={[remarkMath]} 
            rehypePlugins={[rehypeKatex]}
          >
            {processedSummary}
          </ReactMarkdown>
       </div>
      </div>

      {/* 标签输入和显示区域 */}
      <div className="p-6 pt-4 flex-none bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedTags.map((tag) => (
            <span key={tag} className="flex items-center bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 px-3 py-1 rounded-full text-sm">
              {tag}
              <button onClick={() => removeTag(tag)} className="ml-1 text-blue-800 dark:text-blue-100 hover:text-blue-900 dark:hover:text-blue-200">
                &times;
              </button>
            </span>
          ))}
        </div>
        <div className="relative">
          <input
            type="text"
            value={tagInput}
            onChange={handleTagInputChange}
            onKeyDown={handleKeyDown}
            placeholder="添加标签 (逗号分隔或回车)"
            className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onFocus={() => setShowTagSuggestions(true)}
            onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)} // 延迟隐藏，以便点击建议
          />
          {showTagSuggestions && tagInput.length > 0 && filteredTags.length > 0 && (
            <div className="absolute z-20 w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md mt-1 shadow-lg max-h-48 overflow-y-auto">
              {filteredTags.map((tag) => (
                <div
                  key={tag}
                  className="p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100"
                  onMouseDown={() => addTag(tag)} // 使用 onMouseDown 避免 onBlur 立即触发
                >
                  {tag}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="p-6 pt-4 flex-none bg-white dark:bg-gray-800 z-10">
        <div className="flex space-x-4 justify-start">
          <a
            href={article.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full w-12 h-12 flex items-center justify-center shadow-sm hover:shadow-md transition-all bg-blue-500 hover:bg-blue-600 text-white font-bold text-lg"
            title="查看 PDF"
          >
            P
          </a>
          <button
            onClick={() => {
              // 建立一个临时的标签数组，包含已选中的和当前正在输入的
              let finalTags = [...selectedTags];
              const trimmedInput = tagInput.trim();
              
              // 如果输入框里有内容且不在已选列表中，加进去
              if (trimmedInput && !finalTags.includes(trimmedInput)) {
                finalTags.push(trimmedInput);
                // 可选：同步更新 UI 状态
                setSelectedTags(finalTags);
                setTagInput('');
              }
              
              // 发送完整的标签列表
              onCollect(article, finalTags);
              
              // 收藏成功后清空当前卡片的标签（防止带到下一张卡片）
              setSelectedTags([]);
            }}
            className="rounded-full w-12 h-12 flex items-center justify-center shadow-sm hover:shadow-md transition-all bg-yellow-400 hover:bg-yellow-500"
            title="收藏文章"
          >
            <Star className="text-white w-6 h-6" />
          </button>
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
