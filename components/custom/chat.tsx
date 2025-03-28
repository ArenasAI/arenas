'use client';

import { Attachment, Message } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useState, useCallback, DragEvent } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { toast } from 'sonner';
import { ChatHeader } from '@/components/custom/chat-header';
import { Database } from '@/lib/supabase/types';
import { fetcher } from '@/lib/utils';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import { AnimatePresence, motion } from 'framer-motion';

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
  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const [isDragging, setIsDragging] = useState(false);

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    status,
    stop,
    reload,
  } = useChat({
    body: { id, modelId: selectedModelId },
    initialMessages,
    experimental_throttle: 100,
    onFinish: () => {
      mutate('/api/history');
    },
    onError: () => {
      toast.error("An error occurred! Please try again later.")
    }
  });

  const { data: votes } = useSWR<Array<Vote>>(
    `/api/vote?chatId=${id}`,
    fetcher
  );
  
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

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || 'Upload failed');
      }

      const responseData = await response.json();
      
      if (isSpreadsheet) {
        return {
          url: responseData.url,
          name: responseData.path,
          contentType: file.type,
          tableData: responseData.tableData,
        };
      }
      
      return {
        url: responseData.url,
        name: responseData.path,
        contentType: file.type,
      };
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Failed to upload ${file.name}`);
      return undefined;
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

    try {
      const uploadPromises = files.map((file) => uploadFile(file, id));
      const uploadedAttachments = await Promise.all(uploadPromises);
      const successfullyUploadedAttachments = uploadedAttachments.filter(
        (attachment): attachment is NonNullable<typeof attachment> =>
          attachment !== undefined
      );

      if (successfullyUploadedAttachments.length > 0) {
        setAttachments((currentAttachments) => [
          ...currentAttachments,
          ...successfullyUploadedAttachments,
        ]);
        
        toast.success(`Successfully uploaded ${successfullyUploadedAttachments.length} file(s)`);
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Failed to upload one or more files');
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
          selectedModelId={selectedModelId}
        />
        <AnimatePresence>
          {isDragging && (
            <motion.div
              className="absolute inset-0 bg-background/80 backdrop-blur-sm 
                         flex items-center justify-center z-50 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="p-8 rounded-xl border-2 border-dashed border-primary 
                            bg-background/50 backdrop-blur-sm">
                <p className="text-lg font-medium text-primary">
                  Drop files here to upload
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <Messages 
          messages={messages}
          chatId={id}
          status={status}
          votes={votes}
          setMessages={setMessages}
          reload={reload}
        />
        <MultimodalInput
          chatId={id}
          input={input}
          setInput={setInput}
          status={status}
          stop={stop}
          attachments={attachments}
          setAttachments={setAttachments}
          messages={messages}
          setMessages={setMessages}
          append={append}
          handleSubmit={handleSubmit}
          isDragging={isDragging}
        />
      </div>
    </>
  );
}