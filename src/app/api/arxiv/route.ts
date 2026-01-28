
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || 'cat:cs.AI';
    
    const arxivUrl = `https://export.arxiv.org/api/query?search_query=${query}&sortBy=submittedDate&sortOrder=descending&max_results=10`;
    
    const response = await fetch(arxivUrl);
    const xmlData = await response.text();
  
    
    return new Response(xmlData, {
      headers: { 'Content-Type': 'application/xml' },
    });
  }