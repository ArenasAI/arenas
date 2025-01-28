export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface chats {
    created_at: string
    id: string
    title: string | null
    updated_at: string
    user_id: string
}

export interface votes {
    chat_id: string
    is_upvoted: boolean
    message_id: string
}

export interface suggestions {
    created_at: string
    description: string | null
    document_created_at: string
    document_id: string
    id: string
    is_resolved: boolean
    original_text: string
    suggested_text: string
    user_id: string
}

export interface documents {
    content: string | null
    created_at: string
    id: string
    title: string
    user_id: string
}

export interface file_uploads {
    bucket_id: string
          chat_id: string
          content_type: string
          created_at: string
          filename: string
          id: string
          original_name: string
          size: number
          storage_path: string
          url: string
          user_id: string
          version: number
}

export interface messages {
    chat_id: string
    content: Json
    created_at: string
    id: string
    role: string
    updated_at: string
}

export interface users {
    created_at: string
    email: string
    id: string
    updated_at: string
}