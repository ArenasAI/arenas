import { NextResponse } from 'next/server';

import { upload } from '@/db/storage';
import { createClient } from '@/lib/supabase/server';

import type { Database } from '@/lib/supabase/types';

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9.-]/g, '_').toLowerCase();
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const chatId = formData.get('chatId') as string;

    console.log('Upload request:', {
      fileName: file?.name,
      fileType: file?.type,
      fileSize: file?.size,
      chatId,
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

    // Log auth status
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    console.log('Auth status:', {
      isAuthenticated: !!user,
      userId: user?.id,
      authError,
    });

    if (!user) {
      console.error('Authentication failed:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      // Create folder structure with user ID for RLS
      const sanitizedFileName = sanitizeFileName(file.name);
      const filePath = [user.id, chatId, sanitizedFileName];

      console.log('Sanitized file details:', {
        originalName: file.name,
        sanitizedName: sanitizedFileName,
        path: filePath.join('/'),
        userId: user.id,
      });

      // Ensure bucket exists
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

      // Create bucket if it doesn't exist
      if (!buckets?.some((b) => b.id === 'chat_attachments')) {
        console.log('Creating bucket...');
        const { error: createError } = await supabase.storage.createBucket(
          'chat_attachments',
          {
            public: true,
            fileSizeLimit: 52428800,
            allowedMimeTypes: ['image/*', 'application/pdf'],
          }
        );
        if (createError) {
          console.error('Bucket creation error:', createError);
        }
      }

      const publicUrl = await upload(supabase, {
        file,
        path: filePath,
      });

      console.log('Upload successful:', { publicUrl });

      // Check if file already exists
      const { data: existingFile } = await supabase
        .from('file_uploads')
        .select('url')
        .match({
          user_id: user.id,
          chat_id: chatId,
          storage_path: filePath.join('/'),
        })
        .order('version', { ascending: false })
        .limit(1)
        .single();

      if (existingFile) {
        // Return the existing file URL
        return NextResponse.json({
          url: existingFile.url,
          path: filePath.join('/'),
        });
      }

      // Insert new file record
      const { error: dbError } = await supabase.from('file_uploads').insert({
        user_id: user.id,
        chat_id: chatId,
        bucket_id: 'chat_attachments',
        storage_path: filePath.join('/'),
        filename: sanitizedFileName,
        original_name: file.name,
        content_type: file.type,
        size: file.size,
        url: publicUrl,
        version: 1, // Will be auto-incremented by trigger if needed
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
      });
    } catch (uploadError: any) {
      console.error('Upload error details:', {
        error: uploadError,
        message: uploadError.message,
        status: uploadError.status,
        statusCode: uploadError.statusCode,
        name: uploadError.name,
        stack: uploadError.stack,
      });

      if (uploadError.message?.includes('row-level security')) {
        // Log RLS details
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
          details: uploadError.message,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Request handler error:', {
      error,
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
