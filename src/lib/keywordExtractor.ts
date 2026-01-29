// Keyword extraction utility for paper recommendation

/**
 * Extract keywords from paper title and summary
 * @param title Paper title
 * @param summary Paper summary
 * @returns Array of extracted keywords
 */
export const extractKeywords = (title: string, summary: string): string[] => {
  // Combine title and summary
  const text = `${title} ${summary}`;
  
  // Remove LaTeX commands and special characters
  const cleanedText = text
    .replace(/\\[a-zA-Z]+\{[^}]+\}/g, '') // Remove LaTeX commands
    .replace(/[{}()\[\]\\]/g, ' ') // Remove special characters
    .replace(/[^a-zA-Z0-9\s]/g, ' ') // Remove non-alphanumeric characters
    .toLowerCase();
  
  // Split into words
  const words = cleanedText.split(/\s+/).filter(word => word.length > 2); // Filter out short words
  
  // Common stop words to remove
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'from', 'as',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'of', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
    'can', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
    'which', 'who', 'whom', 'whose', 'what', 'when', 'where', 'why', 'how'
  ]);
  
  // Remove stop words
  const meaningfulWords = words.filter(word => !stopWords.has(word));
  
  // Count word frequencies
  const wordFreq = new Map<string, number>();
  meaningfulWords.forEach(word => {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
  });
  
  // Sort words by frequency
  const sortedWords = Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word);
  
  // Return top 10 keywords
  return sortedWords.slice(0, 10);
};

/**
 * Convert keywords to arXiv API search parameters
 * @param keywords Extracted keywords
 * @returns Array of search parameters
 */
export const keywordsToSearchParams = (keywords: string[]): string[] => {
  // Convert keywords to search terms
  return keywords.map(keyword => `ti:${keyword} OR abs:${keyword}`);
};

/**
 * Update user interests based on article interaction
 * @param userId User ID
 * @param article Article data
 * @param interactionType Type of interaction
 * @param supabase Supabase client
 */
export const updateUserInterests = async (userId: string, article: any, interactionType: string, supabase: any) => {
  if (!userId || !article) return;
  
  try {
    const baseScore = interactionType === 'collect' ? 1.0 : 0.5;
    
   
    const keywords = extractKeywords(article.title, article.summary);
    
    for (const keyword of keywords) {
      await supabase
        .from('user_interests')
        .upsert(
          {
            user_id: userId,
            interest_category: article.category, // Main category like cs.AI
            interest_keyword: keyword, // Keyword within the category
            score: baseScore,
            last_updated: new Date().toISOString()
          },
          {
            onConflict: 'user_id, interest_category, interest_keyword',
            update: 'score = user_interests.score + excluded.score, last_updated = excluded.last_updated'
          }
        );
    }
  
    
  } catch (error) {
    console.error('Error updating user interests:', error);
  }
};
