// @/lib/arxivService.ts
import { ArxivArticle } from '@/components/PaperCard';

export const CATEGORIES = ['cs.AI', 'cs.CV', 'cs.LG', 'cs.CL'];

export async function fetchArxivArticles(params: {
  category?: string;
  start?: number;
  maxResults?: number;
}): Promise<ArxivArticle[]> {
  const { category = 'cs.AI', start = 0, maxResults = 10 } = params;
  
  const response = await fetch(
    `/api/arxiv?query=cat:${category}&sortBy=submittedDate&sortOrder=descending&max_results=${maxResults}&start=${start}`
  );

  if (!response.ok) {
    throw new Error(`ArXiv API error: ${response.status}`);
  }

  const xmlText = await response.text();
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, "text/xml");
  const entries = xmlDoc.getElementsByTagName('entry');

  return Array.from(entries).map(entry => {
    const pdfLinkElement = Array.from(entry.getElementsByTagName('link')).find(
      link => link.getAttribute('title') === 'pdf'
    );

    return {
      id: entry.getElementsByTagName('id')[0]?.textContent || 'N/A',
      title: entry.getElementsByTagName('title')[0]?.textContent || 'N/A',
      authors: Array.from(entry.getElementsByTagName('name')).map(n => n.textContent || 'Unknown'),
      pdf_url: pdfLinkElement?.getAttribute('href') || 'N/A',
      summary: entry.getElementsByTagName('summary')[0]?.textContent || 'N/A',
    };
  });
}