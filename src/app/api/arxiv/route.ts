// 这是后端代码，运行在服务器上，不受 CORS 限制
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || 'cat:cs.AI';
    
    const arxivUrl = `https://export.arxiv.org/api/query?search_query=${query}&sortBy=submittedDate&sortOrder=descending&max_results=10`;
    
    const response = await fetch(arxivUrl);
    const xmlData = await response.text();
  
    // 直接返回 XML 文本，或者在这里解析成 JSON 后返回
    return new Response(xmlData, {
      headers: { 'Content-Type': 'application/xml' },
    });
  }