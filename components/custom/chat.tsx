'use client';

import { Attachment, Message } from 'ai';
import { useChat } from 'ai/react';
import { useState } from 'react';
import useSWR, {useSWRConfig} from 'swr';
import { useWindowSize } from 'usehooks-ts';
import { toast } from "sonner";
import { PreviewMessage, ThinkingMessage } from '@/components/custom/message';
import { useScrollToBottom } from '@/components/custom/use-scroll-to-bottom';
import { Database } from '@/lib/supabase/types';
import { constructMetadata, fetcher } from '@/lib/utils';

import { MultimodalInput } from './multimodal-input';
import { UIBlock } from './block';
import { BlockStreamHandler } from './block-stream-handler';
import { Metadata } from 'next';
import { ChatHeader } from './chat-header';

type Vote = Database['public']['Tables']['votes']['Row'];

export const metadata: Metadata = constructMetadata({
  title: 'Chat',
  description: 'start analyzing your data.',
  canonical: '/chat',
});



export function Chat({
  id,
  initialMessages,
  selectedModelId,
}: {
  id: string;
  initialMessages: Array<Message>;
  selectedModelId: string;
}) {
  const { mutate } = useSWRConfig();
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
    api: '/api/v1/chat',
    body: {
      chat_id: id,
      model_id: selectedModelId,
      messages: initialMessages,
    },
    headers: {
      'Content-Type': 'application/json',
    },
    onError: (error) => {
      toast.error("An error occurred!");
      console.error("chat error: ", error);
    },
    onFinish: () => {
      mutate('/api/history');
    },
  });

  const { width: windowWidth = 1920, height: windowHeight = 1080 } = useWindowSize();
  const { data: votes } = useSWR<Array<Vote>>(`/api/vote?chatId=${id}`, fetcher);
  const [messagesContainerRef, messagesEndRef] = useScrollToBottom<HTMLDivElement>();
  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
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

  return (
    <>
      <div className="flex flex-col h-screen overflow-hidden bg-background">
        <div className="flex flex-col flex-1 overflow-hidden mt-16">
        <ChatHeader selectedModelId={selectedModelId} />
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-hidden px-4 md:px-8 py-4"
          >
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((message, index) => (
                <PreviewMessage
                  key={message.id}
                  chatId={id}
                  message={message}
                  isLoading={isLoading && messages.length - 1 === index}
                  vote={votes?.find((vote) => vote.message_id === message.id)}
                  block={block}
                  setBlock={setBlock}
                />
              ))}

              {isLoading &&
                messages.length > 0 &&
                messages[messages.length - 1].role === 'user' && (
                  <ThinkingMessage />
                )}

              <div ref={messagesEndRef} className="h-6" />
            </div>
          </div>

          <div className="bg-background/95 justify-items-center backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <form name='chat' className="max-w-3xl mx-auto p-4 md:p-6 space-y-4">
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
              />
            </form>
          </div>
        </div>

        <BlockStreamHandler streamingData={streamingData} setBlock={setBlock} />
      </div>
    </>
  );
}