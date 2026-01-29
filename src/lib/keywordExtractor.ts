// src/lib/keywordExtractor.ts

export const extractKeywordsAsync = async (title: string, summary: string, limit: number = 8): Promise<string[]> => {
    try {
        const response = await fetch('/api/extract-keywords', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, summary, limit }),
        });

        if (!response.ok) throw new Error('API request failed');
        
        const data = await response.json();
        return data.keywords || [];
    } catch (error) {
        console.error('Calling backend keyword extraction failed:', error);
        return title.toLowerCase().split(/\W+/).filter(w => w.length > 4).slice(0, limit);
    }
};

export const updateUserInterests = async (userId: string, article: any, interactionType: string, supabase: any) => {
    if (!userId || !article) return;
    
    extractKeywordsAsync(article.title, article.summary).then(async (keywords) => {
        const baseScore = interactionType === 'collect' ? 1.0 : 0.5;
        
        for (const keyword of keywords) {
            await supabase
                .from('user_interests')
                .upsert({
                    user_id: userId,
                    interest_category: article.category,
                    interest_keyword: keyword,
                    score: baseScore,
                    last_updated: new Date().toISOString()
                }, {
                    onConflict: 'user_id, interest_category, interest_keyword'
                });
        }
    }).catch(err => console.error("Interests update failed:", err));
};