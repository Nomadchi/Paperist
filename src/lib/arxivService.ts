// lib/arxivService.ts
import { ArxivArticle } from '@/components/PaperCard';

export const CATEGORIES = ['cs.AI', 'cs.CV', 'cs.LG', 'cs.CL'];

export async function fetchArxivArticles(params: {
  query: string;       
  searchField?: 'all' | 'ti' | 'au' | 'abs' | 'cat' | 'custom'; // 新增 custom
  start?: number;
  maxResults?: number;
  sortBy?: 'relevance' | 'lastUpdatedDate' | 'submittedDate';
}): Promise<ArxivArticle[]> {
  
  const { 
    query, 
    searchField = 'custom', // 默认为 custom 以支持复杂查询
    start = 0, 
    maxResults = 10,
    sortBy = 'relevance' 
  } = params;
  
  let finalQuery = query.trim();

  if (searchField !== 'custom') {
    if (searchField === 'ti' && !finalQuery.startsWith('"')) {
      finalQuery = `"${finalQuery}"`;
    }
    finalQuery = `${searchField}:${finalQuery}`;
  }

  const queryParams = new URLSearchParams({
    query: finalQuery,
    sortBy: sortBy,
    sortOrder: 'descending',
    max_results: maxResults.toString(),
    start: start.toString()
  });

  const response = await fetch(`/api/arxiv?${queryParams.toString()}`);

  if (!response.ok) {
    throw new Error(`ArXiv API error: ${response.status}`);
  }

  const xmlText = await response.text();
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, "text/xml");
  const entries = xmlDoc.getElementsByTagName('entry');

  return Array.from(entries).map((entry): ArxivArticle => {
    const links = Array.from(entry.getElementsByTagName('link'));
    const pdfLink = links.find(l => l.getAttribute('title') === 'pdf') || 
                    links.find(l => l.getAttribute('href')?.includes('pdf'));

    return {
      id: entry.getElementsByTagName('id')[0]?.textContent?.split('/').pop() || '',
      title: entry.getElementsByTagName('title')[0]?.textContent?.replace(/\s+/g, ' ').trim() || 'Untitled',
      authors: Array.from(entry.getElementsByTagName('name')).map(n => n.textContent?.trim() || 'Unknown'),
      pdf_url: pdfLink?.getAttribute('href') || '',
      summary: entry.getElementsByTagName('summary')[0]?.textContent?.replace(/\s+/g, ' ').trim() || '',
      category: entry.getElementsByTagName('category')[0]?.getAttribute('term') || 'N/A',
      published: entry.getElementsByTagName('published')[0]?.textContent || '',
    };
  });
}