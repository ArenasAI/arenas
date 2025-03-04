import { Pinecone } from '@pinecone-database/pinecone'
import { Document } from '@pinecone-database/doc-splitter'
import { OpenAIEmbeddings } from '@langchain/openai'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'

export async function createPineconeClient() {
    return new Pinecone({
        apiKey: process.env.PINECONE_API_KEY || '',
    });
}

export const createPineconeIndex = async (client: Pinecone, indexName: string) => {
    const existingIndexes = await client.listIndexes();
    
    // Check if the index exists in the response
    const indexExists = existingIndexes.indexes?.some(index => index.name === indexName);
    
    if (!indexExists) {
        console.log(`Index ${indexName} does not exist. Creating index...`);
        await client.createIndex({
            name: indexName,
            dimension: 1536, 
            metric: 'cosine',
            spec: {
                serverless: {
                    cloud: 'aws',
                    region: 'us-east-1'
                }
            }
        });
        
        console.log(`Index ${indexName} created successfully`);
    } else {
        console.log(`Index ${indexName} already exists`);
    }
    
    return client.index(indexName);
}

export const updatePinecone = async (client: Pinecone, indexName: string, docs: Document[]) => {
    const index = client.Index(indexName)
    console.log("retrieved index of ", index)

    for (const doc of docs) {
        const txtPath = doc.metadata.source
        const text = doc.pageContent
        
        const chunks = splitTextIntoChunks(text, 1000)

        const embeddings = new OpenAIEmbeddings({
            openAIApiKey: process.env.OPENAI_API_KEY,
        })

        const vectors = await Promise.all(
            chunks.map(async (chunk, i) => {
                const embedding = await embeddings.embedQuery(chunk)
                return {
                    id: `${txtPath}-chunk-${i}`,
                    values: embedding,
                    metadata: {
                        text: chunk,
                    },
                }
            })
        )
        const batchSize = 100
        let batch:any = [];
        for (let i = 0; i < vectors.length; i += batchSize) {
            const chunk = chunks[i];
            batch.push(vectors[i]);
            if (batch.length === batchSize || i === vectors.length - 1) {
                await index.upsert(batch);
                batch = [];
            }
        }


    }
}

// Add this helper function to get the Pinecone index
async function getIndex() {
    const client = await createPineconeClient();
    const indexName = process.env.PINECONE_INDEX_NAME || 'default-index';
    return await createPineconeIndex(client, indexName);
}

export async function storeDocument(
    fileBuffer: ArrayBuffer,
    fileName: string,
    fileType: string,
    userId: string,
    fileId: string
) {
    try {
        let content: string;

        if (fileType.includes('csv') || fileName.endsWith('.csv')) {
            const text = new TextDecoder('utf-8').decode(fileBuffer);
            const result = Papa.parse(text, { header: true });
            content = JSON.stringify(result.data);
        } else if (
            fileType.includes('spreadsheet') || 
            fileName.endsWith('.xlsx') || 
            fileName.endsWith('.xls')
        ) {
            const workbook = XLSX.read(fileBuffer, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const data = XLSX.utils.sheet_to_json(worksheet);
            content = JSON.stringify(data);
        } else {
            throw new Error('Unsupported file type');
        }
        
        const embeddings = new OpenAIEmbeddings({
            openAIApiKey: process.env.OPENAI_API_KEY,
        });
        
        const textChunks = splitTextIntoChunks(content, 1000);
        
        const client = await createPineconeClient();
        const indexName = process.env.PINECONE_INDEX_NAME || 'default-index';
        const index = await createPineconeIndex(client, indexName);
            
        // Create vectors from chunks
        const vectors = await Promise.all(
            textChunks.map(async (chunk, i) => {
                const embedding = await embeddings.embedQuery(chunk);
                return {
                    id: `${fileId}-chunk-${i}`,
                    values: embedding,
                    metadata: {
                        userId,
                        fileId,
                        fileName,
                        documentId: fileId, // Add documentId for consistency with query function
                        chunkIndex: i,
                        text: chunk,
                    },
                };
            })
        );
        
        // Upsert vectors to Pinecone in batches to avoid rate limits
        const batchSize = 100;
        for (let i = 0; i < vectors.length; i += batchSize) {
            const batch = vectors.slice(i, i + batchSize);
            await index.upsert(batch);
        }
        
        return {
            success: true,
            fileId,
            chunkCount: textChunks.length,
        };
    } catch (error) {
        console.error('Error storing document in Pinecone:', error);
        throw error;
    }
}

export const queryDocumentContext = async (
    query: string,
    documentId: string,
    userId: string,
    topK: number = 5
) => {
    try {
        const embeddings = new OpenAIEmbeddings({
            openAIApiKey: process.env.OPENAI_API_KEY,
        });
        
        const queryEmbedding = await embeddings.embedQuery(query);
        
        const client = await createPineconeClient();
        const indexName = process.env.PINECONE_INDEX_NAME || 'default-index';
        const index = await createPineconeIndex(client, indexName);
        
        const queryResponse = await index.query({
            vector: queryEmbedding,
            topK,
            filter: { documentId, userId },
            includeMetadata: true,
        });
        
        return queryResponse.matches.map((match: any) => ({
            text: match.metadata?.text || '',
            score: match.score,
        }));
    } catch (error) {
        console.error('Error querying document context from Pinecone:', error);
        throw error;
    }
}

export const deleteDocumentFromPinecone = async (documentId: string) => {
    try {
        const client = await createPineconeClient();
        const indexName = process.env.PINECONE_INDEX_NAME || 'default-index';
        const index = await createPineconeIndex(client, indexName);
        
        // Delete all vectors with the matching documentId
        await index.deleteMany({ documentId });
        return { success: true };
    } catch (error) {
        console.error('Error deleting document from Pinecone:', error);
        throw error;
    }
}

// Improved function to split text into chunks
function splitTextIntoChunks(text: string, chunkSize: number): string[] {
    const chunks: string[] = [];
    try {
        const data = JSON.parse(text);
        if (Array.isArray(data)) {
            // For arrays (like CSV data), chunk by rows
            for (let i = 0; i < data.length; i += 20) {
                const chunk = data.slice(i, i + 20);
                chunks.push(JSON.stringify(chunk));
            }
        } else if (typeof data === 'object') {
            // For objects, stringify the whole object
            chunks.push(text);
        } else {
            // For simple values, just use the text
            chunks.push(text);
        }
    } catch (e) {
        // If not valid JSON, split by character count
        for (let i = 0; i < text.length; i += chunkSize) {
            chunks.push(text.substring(i, i + chunkSize));
        }
    }
    
    return chunks;
}