import { NextResponse } from 'next/server';
import { upload } from '@/lib/cached/storage';
import  createClient from '@/lib/supabase/server';
import { generateUUID } from '@/lib/utils';

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9.-]/g, '_').toLowerCase();
}

const ALLOWED_MIME_TYPES = [
  'image/*', 
  'application/pdf', 
  'text/plain',
  'application/vnd.ms-excel', 
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',                                                       
  'application/csv',                                                
  'application/json'
];

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const chatId = formData.get('chatId') as string;
    const isSpreadsheet = file.type.includes('spreadsheet') || 
                          file.type.includes('csv') ||
                          file.name.endsWith('.xlsx') ||
                          file.name.endsWith('.xls') ||
                          file.name.endsWith('.json') ||
                          file.name.endsWith('.pdf') || 
                          file.name.endsWith('.txt');

    const bucketId = isSpreadsheet ? 'data-files' : 'chat_attachments';

    console.log('Upload request:', {
      fileName: file?.name,
      fileType: file?.type,
      fileSize: file?.size,
      chatId,
      isSpreadsheet,
      bucketId
    });

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Please upload a different format.',
        allowedTypes: ALLOWED_MIME_TYPES,
        receivedType: file.type
      }, { status: 400 });
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
      const fileId = generateUUID();
      const sanitizedFileName = sanitizeFileName(file.name);
      const filePath = [user.id, chatId, sanitizedFileName];

      console.log('Sanitized file details:', {
        originalName: file.name,
        sanitizedName: sanitizedFileName,
        path: filePath.join('/'),
        userId: user.id,
        fileId,
        bucketId
      });

      const { data: buckets, error: bucketError } =
        await supabase.storage.listBuckets();
      
      if (bucketError) {
        console.error('Error listing buckets:', bucketError);
        throw bucketError;
      }

      console.log('Storage buckets:', {
        availableBuckets: buckets?.map((b) => ({
          id: b.id,
          name: b.name,
          public: b.public,
        })),
      });

      // Ensure required bucket exists
      if (!buckets?.some((b) => b.id === bucketId)) {
        console.log(`Creating ${bucketId} bucket...`);
        const { error: createError } = await supabase.storage.createBucket(
          bucketId,
          {
            public: true,
            fileSizeLimit: 52428800,
            allowedMimeTypes: ALLOWED_MIME_TYPES,
          }
        );
        if (createError) {
          console.error(`Error creating ${bucketId} bucket:`, createError);
          throw createError;
        }
      }
      
      console.log('Attempting file upload:', {
        bucketId,
        fileType: file.type,
        isSpreadsheet,
        filePath: filePath.join('/')
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
        is_spreadsheet: isSpreadsheet,
        preview_data: {
          type: isSpreadsheet ? 'spreadsheet' : file.type.startsWith('image/') ? 'image' : 'file',
          name: file.name,
          size: file.size,
          contentType: file.type,
          lastModified: new Date().toISOString(), 
          dimensions: isSpreadsheet ? null : null, 
          thumbnail: file.type.startsWith('image/') ? publicUrl : null,
          icon: !file.type.startsWith('image/') ? 
            (isSpreadsheet ? 'FileSpreadsheet' : 'FileText') : 
            null
        }
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
        fileId,
        preview: {
          type: isSpreadsheet ? 'spreadsheet' : file.type.startsWith('image/') ? 'image' : 'file',
          name: file.name,
          size: file.size,
          contentType: file.type,
          lastModified: new Date().toISOString(),
          dimensions: isSpreadsheet ? null : null,
          thumbnail: file.type.startsWith('image/') ? publicUrl : null,
          icon: !file.type.startsWith('image/') ? 
            (isSpreadsheet ? 'FileSpreadsheet' : 'FileText') : 
            null
        }
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