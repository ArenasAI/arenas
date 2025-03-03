import { Message } from "@/lib/supabase/types";
import { generateUUID } from '@/lib/utils';
import createClient from '@/lib/supabase/server';
import { saveChat } from '@/lib/cached/mutations';


export type FileAttachment = {
  id: string;
  url: string;
  name: string;
  type: 'file' | 'image' | 'spreadsheet';
  mimeType: string;
  metadata?: Record<string, unknown>;
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
