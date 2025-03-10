'use client';

import { Attachment, Message } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useState, useEffect, useCallback, DragEvent } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { toast } from 'sonner';
import { ChatHeader } from '@/components/custom/chat-header';
import { Database } from '@/lib/supabase/types';
import { fetcher } from '@/lib/utils';
import { MultimodalInput } from './multimodal-input';
import { createClient } from '@/lib/supabase/client';
import { useArtifactSelector } from '@/hooks/use-artifact';
import { Artifact } from '../artifacts/artifact';
import { Messages } from './messages';

type PreviewData = {
  headers: string[]
  rows: (string[] | Record<string, unknown>)[]
}

type Vote = Database['public']['Tables']['votes']['Row'];

export function Chat({
  id,
  initialMessages,
  selectedModelId,
}: {
  id: string;
  initialMessages: Array<Message>;
  selectedModelId: string;
}) {
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();
  const [tableData, setTableData] = useState<PreviewData | null>(null);
  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    isLoading,
    stop,
    reload,
    data
  } = useChat({
    body: { id, modelId: selectedModelId },
    initialMessages,
    onFinish: () => {
      mutate('/api/history');
    },
    onError: () => {
      toast.error("An error occurred! Please try again later.")
    }
  });

  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  const { data: votes } = useSWR<Array<Vote>>(
    `/api/vote?chatId=${id}`,
    fetcher
  );

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    
    getUser();
  }, [supabase]);
  
  const { mutate } = useSWRConfig();

  const uploadFile = async (file: File, chatId: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('chatId', chatId);

    const isSpreadsheet = file.type.includes('spreadsheet') || 
                       file.type.includes('csv') ||
                       file.name.endsWith('.xlsx') ||
                       file.name.endsWith('.xls') ||
                       file.name.endsWith('.csv');
    try {
      const response = await fetch(`/api/files/upload`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (isSpreadsheet) {
          return {
            url: data.url,
            name: data.path,
            contentType: file.type,
            tableData: data.tableData,
          };
        }
        return {
          url: data.url,
          name: data.path,
          contentType: file.type,
        };
      } else {
        const { error, details } = await response.json();
        console.error('Upload error:', { error, details });
        toast.error(error);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload file, please try again!');
    }
  };

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (
      x <= rect.left ||
      x >= rect.right ||
      y <= rect.top ||
      y >= rect.bottom
    ) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;
    setUploadQueue(files.map((file) => file.name));

    try {
      const uploadPromises = files.map((file) => uploadFile(file, id));
      const uploadedAttachments = await Promise.all(uploadPromises);
      const successfullyUploadedAttachments = uploadedAttachments.filter(
        (attachment): attachment is NonNullable<typeof attachment> =>
          attachment !== undefined
      );

      setAttachments((currentAttachments) => [
        ...currentAttachments,
        ...successfullyUploadedAttachments,
      ]);
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Failed to upload one or more files');
    } finally {
      setUploadQueue([]);
    }
  }, [id, setAttachments]);

  
  return (
    <>
      <div 
        className="flex flex-col min-w-0 h-dvh bg-background"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <ChatHeader 
          chatId={id}
          selectedModelId={selectedModelId}
        />
        
        {isDragging && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm 
                         flex items-center justify-center z-50 pointer-events-none">
            <div className="p-8 rounded-xl border-2 border-dashed border-primary 
                          bg-background/50 shadow-lg">
              <div className="text-2xl font-medium text-primary text-center">
                Drop files here
              </div>
              <p className="text-muted-foreground text-sm mt-2">
                Upload files to chat
              </p>
            </div>
          </div>
        )}

        <Messages
          chatId={id}
          isLoading={isLoading}
          votes={votes}
          messages={messages}
          setMessages={setMessages}
          reload={reload}
          isArtifact={false}
          user={user}
          append={append}
        />

        <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
          {( 
            <MultimodalInput
            chatId={id}
            input={input}
            setInput={setInput}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            stop={stop}
            attachments={attachments}
            setAttachments={setAttachments}
            messages={messages}
            setMessages={setMessages}
            append={append}
            isDragging={isDragging}
          />
          )}
        </form>
      </div>
    </>
  );
}