import { NextResponse } from 'next/server';
import { upload } from '@/lib/cached/storage';
import  createClient from '@/lib/supabase/server';
import { storeDocument } from '@/lib/rag/pinecone';
import { generateUUID } from '@/lib/utils';

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9.-]/g, '_').toLowerCase();
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const chatId = formData.get('chatId') as string;
    const isSpreadsheet = file.type.includes('spreadsheet') || 
                          file.type.includes('csv') ||
                         file.name.endsWith('.xlsx') ||
                         file.name.endsWith('.xls') ||
                         file.name.endsWith('.csv') ||
                         file.name.endsWith('.json') ||
                         file.name.endsWith('.pdf');
                         

    const bucketId = isSpreadsheet ? 'data-files' : 'chat_attachments';

    console.log('Upload request:', {
      fileName: file?.name,
      fileType: file?.type,
      fileSize: file?.size,
      chatId,
      isSpreadsheet
    });

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!chatId) {
      return NextResponse.json(
        { error: 'No chatId provided' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!user) {
      console.error('Authentication failed:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const sanitizedFileName = sanitizeFileName(file.name);
      const filePath = [user.id, chatId, sanitizedFileName];
      const fileId = generateUUID(); // Generate a unique ID for the file

      console.log('Sanitized file details:', {
        originalName: file.name,
        sanitizedName: sanitizedFileName,
        path: filePath.join('/'),
        userId: user.id,
        fileId
      });

      const { data: buckets, error: bucketError } =
        await supabase.storage.listBuckets();
      console.log('Storage buckets:', {
        availableBuckets: buckets?.map((b) => ({
          id: b.id,
          name: b.name,
          public: b.public,
        })),
        error: bucketError,
      });


      if (!buckets?.some((b) => b.id === 'chat_attachments')) {
        console.log('Creating bucket...');
        const { error: createError } = await supabase.storage.createBucket(
          'chat_attachments',
          {
            public: true,
            fileSizeLimit: 52428800,
            allowedMimeTypes: ['image/*', 'application/pdf', 'csv', '.xlsx', '.xls', '.json'],
          }
        );
        if (createError) {
          console.error('Bucket creation error:', createError);
        }
      }

      if (isSpreadsheet && !buckets?.some((b) => b.id === 'data-files')) {
        console.log('Creating data-files bucket...');
        const { error: createError } = await supabase.storage.createBucket(
          'data-files',
          {
            public: true,
            fileSizeLimit: 52428800,
            allowedMimeTypes: [
              'application/vnd.ms-excel', 
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              'text/csv',                                                       
              'application/csv',                                                
              'text/plain',
              'application/json',
              'application/pdf'
            ],
          }
        );
        if (createError) {
          console.error('Bucket creation error:', createError);
          throw createError;
        }
      }
      
      console.log('Attempting file upload:', {
        bucketId,
        fileType: file.type,
        isSpreadsheet,
      });

      const publicUrl = await upload(supabase, {
        file,
        path: filePath,
        bucket: bucketId,
        options: {
          contentType: file.type
        }
      });

      console.log('Upload successful:', { publicUrl });

      const { data: existingFile } = await supabase
        .from('file_uploads')
        .select('url')
        .match({
          user_id: user.id,
          chat_id: chatId,
          storage_path: filePath.join('/'),
          bucket_id: bucketId
        })
        .order('version', { ascending: false })
        .limit(1)
        .single();

      if (existingFile) {
        return NextResponse.json({
          url: existingFile.url,
          path: filePath.join('/'),
          isSpreadsheet
        });
      }

      let pineconeResult = null;
      const parsedData = null;

      if (isSpreadsheet) {
        console.log('Processing spreadsheet for Pinecone indexing');
        
        pineconeResult = await storeDocument(
          await file.arrayBuffer(),
          sanitizedFileName,
          file.type,
          user.id,
          fileId
        );
        
        console.log('Pinecone indexing result:', pineconeResult);
      }

      const { error: dbError } = await supabase.from('file_uploads').insert({
        user_id: user.id,
        chat_id: chatId,
        bucket_id: bucketId,
        storage_path: filePath.join('/'),
        filename: sanitizedFileName,
        original_name: file.name,
        content_type: file.type,
        size: file.size,
        url: publicUrl,
        version: 1, 
        is_spreadsheet: isSpreadsheet
      });

      if (dbError) {
        console.error('Database insert error:', {
          code: dbError.code,
          message: dbError.message,
          details: dbError.details,
          hint: dbError.hint,
        });
        throw dbError;
      }

      console.log('File record created successfully');

      return NextResponse.json({
        url: publicUrl,
        path: filePath.join('/'),
        isSpreadsheet,
        tableData: parsedData,
        pineconeDocumentId: isSpreadsheet ? fileId : null,
      });
    } catch (uploadError: unknown) {
      console.error('Upload error details:', {
        error: uploadError,
        message: uploadError instanceof Error ? uploadError.message : 'Unknown error',
        status: uploadError instanceof Error && 'status' in uploadError ? uploadError.status : undefined,
        statusCode: uploadError instanceof Error && 'statusCode' in uploadError ? uploadError.statusCode : undefined,
        name: uploadError instanceof Error ? uploadError.name : 'Unknown',
        stack: uploadError instanceof Error ? uploadError.stack : undefined,
      });

      if (uploadError instanceof Error && uploadError.message?.includes('row-level security')) {
        console.error('RLS policy violation. Current user:', user);
        const { data: policies } = await supabase
          .from('postgres_policies')
          .select('*')
          .eq('table', 'storage.objects');
        console.log('Current storage policies:', policies);
      }

      return NextResponse.json(
        {
          error: 'File upload failed',
          details: uploadError instanceof Error ? uploadError.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error('Request handler error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}