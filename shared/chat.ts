import { Message } from "@/lib/supabase/types";
import { generateUUID } from '@/lib/utils';
import createClient from '@/lib/supabase/server';
import { saveChat } from '@/lib/cached/mutations';
import { Attachment } from 'ai';

export interface FileAttachment extends Attachment {
  id: string;
  url: string;
  name: string;
  type: 'file' | 'image' | 'spreadsheet';
  mimeType: string;
  metadata?: Record<string, unknown>;
  previewData?: Array<Array<string | number>>;
};

export type ChatMessage = Message & {
  attachments?: FileAttachment[];
};

export async function createAndSaveChat(userId: string, title: string) {
  const chatId = generateUUID();
  
  await saveChat({
    id: chatId,
    userId,
    title,
  });

  return chatId;
}
