import type { SupabaseClient } from '@supabase/supabase-js';

export const BUCKET_NAME = 'chat_attachments';

async function ensureBucketExists(client: SupabaseClient) {
  const { data: buckets, error: listError } = await client.storage.listBuckets();
  
  if (listError) {
    console.error('Error listing buckets:', listError);
    throw listError;
  }

  const bucketExists = buckets?.some((bucket) => bucket.id === BUCKET_NAME);

  if (!bucketExists) {
    const { error: createError } = await client.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 52428800, // 50MB in bytes
      allowedMimeTypes: [
        'image/*',
        'application/pdf',
        'text/plain',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
        'application/csv',
        'application/json'
      ],
    });

    if (createError) {
      console.error('Error creating bucket:', createError);
      throw createError;
    }
  }
}

type UploadParams = {
  file: File;
  path: string[];
  bucket?: string;
  options?: {
    contentType?: string;
    [key: string]: unknown;
  }
};

export async function upload(
  client: SupabaseClient,
  { file, path, bucket = BUCKET_NAME, options = {} }: UploadParams
) {
  // Ensure bucket exists before upload
  await ensureBucketExists(client);

  const { error: uploadError } = await client.storage
    .from(bucket)
    .upload(path.join('/'), file, {
      upsert: true,
      cacheControl: '3600',
      contentType: options.contentType || file.type,
      ...options
    });

  if (uploadError) {
    console.error('Storage upload error:', uploadError);
    throw uploadError;
  }

  const { data: publicUrl } = client.storage
    .from(bucket)
    .getPublicUrl(path.join('/'));

  if (!publicUrl?.publicUrl) {
    throw new Error('Failed to generate public URL');
  }

  return publicUrl.publicUrl;
}

type RemoveParams = {
  path: string[];
};

export async function remove(client: SupabaseClient, { path }: RemoveParams) {
  return client.storage
    .from(BUCKET_NAME)
    .remove([decodeURIComponent(path.join('/'))]);
}

type DownloadParams = {
  path: string;
};

export async function download(
  client: SupabaseClient,
  { path }: DownloadParams
) {
  return client.storage.from(BUCKET_NAME).download(path);
}

type ShareParams = {
  path: string;
  expireIn: number;
  options?: {
    download?: boolean;
  };
};

export async function share(
  client: SupabaseClient,
  { path, expireIn, options }: ShareParams
) {
  return client.storage
    .from(BUCKET_NAME)
    .createSignedUrl(path, expireIn, options);
}