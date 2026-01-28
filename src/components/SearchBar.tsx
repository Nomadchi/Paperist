// src/components/SearchBar.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { fetchArxivArticles } from '@/lib/arxivService';
import { ArxivArticle } from '@/components/PaperCard';
import { emitPaperSelected } from '@/lib/events';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ArxivArticle[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 防抖搜索逻辑
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length > 2) {
        setIsLoading(true);
        try {
          
            const isId = /^\d{4}\.\d{4,5}/.test(query);
      
            const data = await fetchArxivArticles({
              query: query,
              searchField: isId ? 'id' : 'ti',
              maxResults: 5,
            });

          setResults(data);
          setIsOpen(true);

        } catch (error) {
          console.error("Search failed:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 500); // 500ms debouncing

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (paper: ArxivArticle) => {
    console.log("Selected Paper:", paper);
    emitPaperSelected(paper);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div className="relative w-full" ref={searchRef}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length > 2 && setIsOpen(true)}
          placeholder="Search Title or ID (e.g. 2301.12345)..."
          className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
        />
        {isLoading && (
          <div className="absolute right-3 top-2.5 animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-[60] max-h-[400px] overflow-y-auto overflow-x-hidden">
          {results.length > 0 ? (
            results.map((paper) => (
              <div
                key={paper.id}
                onClick={() => handleSelect(paper)}
                className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 line-clamp-1">
                  {paper.title}
                </p>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-mono">
                    {paper.id.split('/').pop()}
                  </p>
                  <p className="text-[10px] text-gray-400 truncate ml-4 italic">
                    {paper.authors[0]} et al.
                  </p>
                </div>
              </div>
            ))
          ) : (
            !isLoading && <div className="p-4 text-sm text-gray-400 text-center">No results found.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;