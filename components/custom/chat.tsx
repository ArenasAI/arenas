'use client';

import { Attachment, Message } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { toast } from 'sonner';
import { ChatHeader } from '@/components/custom/chat-header';
import { Database } from '@/lib/supabase/types';
import { fetcher } from '@/lib/utils';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';

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
    body: {
      chatId: id, 
      modelId: selectedModelId,
      messages: initialMessages,
    },
    maxSteps: 5,
    api: '/api/chat',
    initialMessages,
    streamProtocol: 'data',
    experimental_throttle: 100,
    onFinish: () => {
      mutate(`/history`);
    },
    onError: (error) => {
      console.error("Chat error:", error);
      if (error.message.includes("Too many requests")) {
        toast.error("Too many requests, please try again later!")
      } else {
        toast.error("An error occurred. Please try again.")
      }
    },
  });

  const { data: votes } = useSWR<Array<Vote>>(
    `/api/vote?chatId=${id}`,
    fetcher
  );
  
  const { mutate } = useSWRConfig();

  return (
    <>
      <div 
        className="flex flex-col min-w-0 h-dvh bg-background"
      >
        <ChatHeader 
          selectedModelId={selectedModelId}
        />
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
        />
      </div>
    </>
  );
}