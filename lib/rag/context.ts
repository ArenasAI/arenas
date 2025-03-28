import { OpenAIEmbeddings } from "@langchain/openai";
import { createPineconeClient } from "./pinecone";

export async function getMatchesFromEmbeddings(embeddings: number[], fileRef: string) {
    const pinecone = await createPineconeClient();
    const index = pinecone.Index('default-index');
    try {
        const fileId = fileRef.split('/').pop()!;
        const results = await index.query({
            topK: 5,
            vector: embeddings,
            includeValues: true,
            includeMetadata: true,
            filter: {
                fileId,
            }
        });
        return results.matches || [];
    } catch (error) {
        console.error('Error getting matches from embeddings:', error);
        return [];
    }
}

async function getEmbeddings(text: string): Promise<number[]> {
    try {
        const embeddings = new OpenAIEmbeddings({
            openAIApiKey: process.env.OPENAI_API_KEY,
        });
        const result = await embeddings.embedQuery(text);
        return result;
    } catch (error) {
        console.error("Error generating embeddings:", error);
        throw new Error("Failed to generate embeddings");
    }
}

export async function getContext(query: string, fileRef: string): Promise<string> {
    try {
        const queryEmbedding = await getEmbeddings(query);
        const matches = await getMatchesFromEmbeddings(queryEmbedding, fileRef);
        
        // Filter for high-quality matches (score >= 0.7)
        const qualifyingDocs = matches.filter((match) => match.score && match.score >= 0.7);
        
        // If no qualifying docs, use top 2 matches regardless of score
        const docsToUse = qualifyingDocs.length > 0 ? qualifyingDocs : matches.slice(0, 2);
        
        // Extract and join text from metadata
        const context = docsToUse
            .map((match) => {
                if (!match.metadata?.text) return '';
                
                // Add metadata context if available
                const metadataContext = [];
                if (match.metadata.documentType) {
                    metadataContext.push(`Type: ${match.metadata.documentType}`);
                }
                if (match.metadata.headers && Array.isArray(match.metadata.headers)) {
                    metadataContext.push(`Columns: ${match.metadata.headers.join(', ')}`);
                }
                if (match.metadata.rowCount) {
                    metadataContext.push(`Total Rows: ${match.metadata.rowCount}`);
                }
                
                const metadataStr = metadataContext.length > 0 
                    ? `\nMetadata: ${metadataContext.join(' | ')}\n`
                    : '';
                
                return `${metadataStr}${match.metadata.text}`;
            })
            .filter(Boolean) // Remove any empty strings
            .join('\n\n');
            
        return context;
    } catch (error) {
        console.error('Error getting context:', error);
        return ''; // Return empty string instead of failing
    }
}