import { Message } from "@/lib/supabase/types";
import { generateUUID } from '@/lib/utils';
import { saveChat } from '@/lib/cached/mutations';
import { Attachment as BaseAttachment } from 'ai';

export interface Attachment extends BaseAttachment {
  id: string;
  url: string;
  name: string;
  type: 'file' | 'image' | 'spreadsheet';
  mimeType: string;
  metadata?: Record<string, unknown>;
  previewData?: Array<Array<string | number>>;
  fileId?: string;
  content?: string;
}

export type ChatMessage = Message & {
  attachments?: Attachment[];
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
