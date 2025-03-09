import { Pinecone } from '@pinecone-database/pinecone'
import { Document, RecursiveCharacterTextSplitter } from '@pinecone-database/doc-splitter'
import { OpenAIEmbeddings } from '@langchain/openai'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"
import { OpenAI } from 'openai'

// Initialize OpenAI for vision tasks
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

// Function to extract text from images using selected model
async function extractTextFromImage(imageBuffer: ArrayBuffer, modelId: string = 'gpt-4-vision-preview'): Promise<string> {
    const base64Image = Buffer.from(imageBuffer).toString('base64')
    
    const response = await openai.chat.completions.create({
        model: modelId,
        messages: [
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: "Please describe the content of this image in detail, focusing on any text, numbers, or data present. If it's a chart or graph, describe the trends and values."
                    },
                    {
                        type: "image_url",
                        image_url: {
                            url: `data:image/jpeg;base64,${base64Image}`
                        }
                    }
                ]
            }
        ],
        max_tokens: 4096
    })

    return response.choices[0].message.content || ''
}

// Function to extract text from PDF
async function extractTextFromPDF(pdfBuffer: ArrayBuffer): Promise<string> {
    const uint8Array = new Uint8Array(pdfBuffer)
    const blob = new Blob([uint8Array], { type: 'application/pdf' })
    const loader = new PDFLoader(blob)
    const docs = await loader.load()
    return docs.map((doc: any) => doc.pageContent).join(' ')
}

// Enhanced text splitter for better chunking
const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
    separators: ["\n\n", "\n", " ", ""], // Order from most to least preferred
})

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

export async function storeDocument(
    fileBuffer: ArrayBuffer,
    fileName: string,
    fileType: string,
    userId: string,
    fileId: string,
    modelId: string = 'gpt-4-vision-preview'
) {
    try {
        let content: string;

        if (fileType.includes('image')) {
            content = await extractTextFromImage(fileBuffer, modelId);
        } else if (fileType.includes('pdf') || fileName.endsWith('.pdf')) {
            content = await extractTextFromPDF(fileBuffer);
        } else if (fileType.includes('csv') || fileName.endsWith('.csv')) {
            const text = new TextDecoder('utf-8').decode(fileBuffer);
            const result = Papa.parse(text, { header: true });
            content = JSON.stringify(result.data);
        } else if (fileType.includes('spreadsheet') || 
                 fileName.endsWith('.xlsx') || 
                 fileName.endsWith('.xls')) {
            const workbook = XLSX.read(fileBuffer, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const data = XLSX.utils.sheet_to_json(worksheet);
            content = JSON.stringify(data);
        } else {
            try {
                content = new TextDecoder('utf-8').decode(fileBuffer);
            } catch (e) {
                throw new Error('Unsupported file type');
            }
        }

        // Split content into chunks using the enhanced splitter
        const docs = await textSplitter.createDocuments([content]);
        
        const embeddings = new OpenAIEmbeddings({
            openAIApiKey: process.env.OPENAI_API_KEY,
        });
        
        const client = await createPineconeClient();
        const indexName = process.env.PINECONE_INDEX_NAME || 'default-index';
        const index = await createPineconeIndex(client, indexName);
            
        // Create vectors with enhanced metadata
        const vectors = await Promise.all(
            docs.map(async (doc: { pageContent: string }, i: number) => {
                const embedding = await embeddings.embedQuery(doc.pageContent);
                return {
                    id: `${fileId}-chunk-${i}`,
                    values: embedding,
                    metadata: {
                        userId,
                        fileId,
                        fileName,
                        documentId: fileId,
                        chunkIndex: i,
                        text: doc.pageContent,
                        fileType: fileType,
                        timestamp: new Date().toISOString(),
                        charCount: doc.pageContent.length,
                    },
                };
            })
        );
        
        // Upsert vectors with improved batching
        const batchSize = 100;
        for (let i = 0; i < vectors.length; i += batchSize) {
            const batch = vectors.slice(i, i + batchSize);
            await index.upsert(batch);
            
            // Add a small delay between batches to avoid rate limits
            if (i + batchSize < vectors.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        return {
            success: true,
            fileId,
            chunkCount: vectors.length,
            fileType: fileType,
            processedAt: new Date().toISOString(),
        };
    } catch (error) {
        console.error('Error storing document in Pinecone:', error);
        throw error;
    }
}

// Enhanced query function with metadata filtering
export const queryDocumentContext = async (
    query: string,
    documentId: string,
    userId: string,
    options: {
        topK?: number;
        fileType?: string;
        dateRange?: { start: Date; end: Date };
    } = {}
) => {
    try {
        const { topK = 5, fileType, dateRange } = options;
        
        const embeddings = new OpenAIEmbeddings({
            openAIApiKey: process.env.OPENAI_API_KEY,
        });
        
        const queryEmbedding = await embeddings.embedQuery(query);
        
        const client = await createPineconeClient();
        const indexName = process.env.PINECONE_INDEX_NAME || 'default-index';
        const index = await createPineconeIndex(client, indexName);
        
        // Build filter based on options
        const filter: any = { documentId, userId };
        if (fileType) filter.fileType = fileType;
        if (dateRange) {
            filter.timestamp = {
                $gte: dateRange.start.toISOString(),
                $lte: dateRange.end.toISOString(),
            };
        }
        
        const queryResponse = await index.query({
            vector: queryEmbedding,
            topK,
            filter,
            includeMetadata: true,
        });
        
        return queryResponse.matches.map((match: any) => ({
            text: match.metadata?.text || '',
            score: match.score,
            metadata: {
                fileName: match.metadata?.fileName,
                fileType: match.metadata?.fileType,
                timestamp: match.metadata?.timestamp,
                chunkIndex: match.metadata?.chunkIndex,
            },
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