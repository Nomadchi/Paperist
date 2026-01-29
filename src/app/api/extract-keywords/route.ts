// src/app/api/extract-keywords/route.ts
import { NextResponse } from 'next/server';
import { pipeline, env } from '@xenova/transformers';
import path from 'path';

env.allowLocalModels = true;
env.allowRemoteModels = false;
env.localModelPath = path.join(process.cwd(), 'public', 'models'); 

const ACADEMIC_STOP_WORDS = new Set(['paper', 'method', 'results', 'proposed', 'approach', 'based', 'using', 'study', 'algorithm', 'system', 'data', 'model', 'models', 'task', 'performance', 'analysis', 'framework']);
const BASIC_STOP_WORDS = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'from', 'as', 'is', 'are', 'of', 'this', 'that', 'it', 'we', 'they', 'can', 'will']);

let extractor: any = null;

async function getExtractor() {
    if (!extractor) {
        try {
            const modelName = 'all-MiniLM-L6-v2';
            
            console.log('Attempting to load model from public/models/all-MiniLM-L6-v2...');

            extractor = await pipeline('feature-extraction', modelName, { 
                quantized: true,
                local_files_only: true 
            });

            console.log('Model loaded successfully!');
        } catch (error) {
            console.error('Final attempt failed:', error);
            throw error;
        }
    }
    return extractor;
}

function cosineSimilarity(vec1: number[], vec2: number[]): number {
    const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
    const norm1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
    const norm2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
    return norm1 * norm2 > 0 ? dotProduct / (norm1 * norm2) : 0;
}

// n-Gram
function generateCandidates(text: string): string[] {
    const words = text.toLowerCase().split(/[^a-zA-Z0-9-]+/).filter(w => w.length > 1);
    const candidates: string[] = [];
    for (let n = 1; n <= 3; n++) {
        for (let i = 0; i <= words.length - n; i++) {
            const nGram = words.slice(i, i + n);
            if (BASIC_STOP_WORDS.has(nGram[0]) || BASIC_STOP_WORDS.has(nGram[nGram.length-1])) continue;
            const phrase = nGram.join(' ');
            if (n === 1 && ACADEMIC_STOP_WORDS.has(phrase)) continue;
            candidates.push(phrase);
        }
    }
    return [...new Set(candidates)];
}

export async function POST(req: Request) {
    try {
        const { title, summary, limit = 8 } = await req.json();
        const text = `${title}. ${summary}`;
        const pipe = await getExtractor();
        
        const candidates = generateCandidates(text);
        if (candidates.length === 0) return NextResponse.json({ keywords: [] });

        const docOutput = await pipe(text, { pooling: 'mean', normalize: true });
        const docVec = Array.from(docOutput.data) as number[];

        const candOutputs = await pipe(candidates, { pooling: 'mean', normalize: true });
        const dim = candOutputs.dims[candOutputs.dims.length - 1];
        
        const scored = candidates.map((word, i) => {
            const wordVec = Array.from(candOutputs.data.slice(i * dim, (i + 1) * dim)) as number[];
            return { word, score: cosineSimilarity(docVec, wordVec) };
        });

        const sorted = scored.sort((a, b) => b.score - a.score);
        const final: string[] = [];
        for (const item of sorted) {
            if (final.length >= limit) break;
            if (!final.some(exist => exist.includes(item.word) || item.word.includes(exist))) {
                final.push(item.word);
            }
        }

        return NextResponse.json({ keywords: final });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Extraction failed' }, { status: 500 });
    }
}