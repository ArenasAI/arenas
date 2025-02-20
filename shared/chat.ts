import { Message } from "@/lib/supabase/types";

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