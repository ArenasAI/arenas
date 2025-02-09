'use client';

import { Attachment, Message } from 'ai';
import { useChat } from 'ai/react';
import { useState, useEffect, useCallback, DragEvent } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

import useSWR, { useSWRConfig } from 'swr';
import { toast } from 'sonner';
import { RuntimeSelector } from './runtime-selector';
import { useWindowSize } from 'usehooks-ts';
import { ChatHeader } from '@/components/custom/chat-header';
import { PreviewMessage, ThinkingMessage } from '@/components/custom/message';
import { useScrollToBottom } from '@/components/custom/use-scroll-to-bottom';
import { votes } from '@/lib/types';
import { fetcher } from '@/lib/utils';
import { UIBlock } from './block'
import { BlockStreamHandler } from './block-stream-handler';
import { MultimodalInput } from './multimodal-input';
import { TablePreview } from './table-preview';
import { Overview } from './overview';
import { createClient } from '@/lib/supabase/client';

type PreviewData = {
  headers: string[]
  rows: (string[] | Record<string, unknown>)[]
}

type Vote = votes;

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
  const [messagesContainerRef, messagesEndRef] = useScrollToBottom<HTMLDivElement>();
  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);

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
    
    // Only set isDragging to false if we're leaving the main container
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

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    
    getUser();
  }, []);
  
  useEffect(() => {
    const isSpreadsheetFile = (filename: string) => { 
      const spreadsheetExtensions = ['.xlsx', '.xls', '.csv']; 
      return spreadsheetExtensions.some(ext => filename.toLowerCase().endsWith(ext)); 
    };

    const processAttachment = async (attachment: any) => { 
      if (attachment && isSpreadsheetFile(attachment.name)) { 
          try { 
            const response = await fetch(attachment.url); 
    // Read data as an array buffer. 
            const buffer = await response.arrayBuffer();
            let parsedData: any;

            if (attachment.name.toLowerCase().endsWith('.csv')) {
              const text = new TextDecoder('utf-8').decode(buffer);
              const result = Papa.parse(text, { header: true });
              parsedData = result.data;
            } else {
              // Process XLSX or XLS file using XLSX library.
              const workbook = XLSX.read(buffer, { type: 'array' });
              const firstSheetName = workbook.SheetNames[0];
              const worksheet = workbook.Sheets[firstSheetName];
              // You can adjust options (such as header) as needed.
              parsedData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            }
            setTableData(parsedData);
          } catch (error) {
             console.error('Error processing spreadsheet:', error);
          }
        }}
    if (attachments.length > 0) { 
      processAttachment(attachments[0]); 
    } 
  }, [attachments]);
  

  const { mutate } = useSWRConfig();
  const [parsedData] = useState<PreviewData | null>(null);

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    isLoading,
    stop,
    data: streamingData,
  } = useChat({
    body: { 
      id, 
      modelId: selectedModelId, 
      parsedData, 
      userId: user?.id,
    },
    initialMessages,
    onFinish: () => {
      mutate('/api/history');
    },
  });

  const { width: windowWidth = 1920, height: windowHeight = 1080 } = useWindowSize();
  const [block, setBlock] = useState<UIBlock>({
    documentId: 'init',
    content: '',
    title: '',
    status: 'idle',
    isVisible: false,
    boundingBox: {
      top: windowHeight / 4,
      left: windowWidth / 4,
      width: 250,
      height: 50,
    },
  });

  const { data: votes } = useSWR<Array<Vote>>(
    `/api/vote?chatId=${id}`,
    fetcher
  );

  return (
    <>
      <div 
        className="flex flex-col min-w-0 h-dvh bg-background"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <ChatHeader selectedModelId={selectedModelId} />
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
        <div
          ref={messagesContainerRef}
          className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-scroll pt-4"
        >
          {messages.length === 0 && <Overview />}
          {tableData && <TablePreview data={tableData} />}


          {messages.map((message, index) => (
            <PreviewMessage
              key={message.id}
              chatId={id}
              message={message}
              block={block}
              setBlock={setBlock}
              isLoading={isLoading && messages.length - 1 === index}
              vote={
                votes
                  ? votes.find((vote) => vote.message_id === message.id)
                  : undefined
              }
            />
          ))}

          {isLoading &&
            messages.length > 0 &&
            messages[messages.length - 1].role === 'user' && (
              <ThinkingMessage />
            )}

          <div
            ref={messagesEndRef}
            className="shrink-0 min-w-[24px] min-h-[24px]"
          />
        </div>
        <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
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
        </form>
      </div>

      <BlockStreamHandler streamingData={streamingData} setBlock={setBlock} />
    </>
  );
}