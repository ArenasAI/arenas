import type { SupabaseClient } from '@supabase/supabase-js';

export const BUCKET_NAME = 'chat_attachments';

async function ensureBucketExists(client: SupabaseClient) {
  const { data: buckets } = await client.storage.listBuckets();
  const bucketExists = buckets?.some((bucket) => bucket.name === BUCKET_NAME);

  if (!bucketExists) {
    const { error } = await client.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 52428800, // 50MB in bytes
      allowedMimeTypes: ['image/*', 'application/pdf'],
    });

    if (error) {
      throw error;
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
  { file, path, bucket = 'chat-attachments', options = {} }: UploadParams
) {
  // Ensure bucket exists before upload
  await ensureBucketExists(client);

  const { error } = await client.storage
    .from(bucket)
    .upload(path.join('/'), file, {
      upsert: true,
      cacheControl: '3600',
      contentType: options.contentType || file.type,
      ...options
    });

  if (error) {
    console.error('Storage upload error:', error);
    throw error;
  }

  const { data: publicUrl } = client.storage
    .from(bucket)
    .getPublicUrl(path.join('/'));

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