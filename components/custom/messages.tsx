import { ChatRequestOptions, Message, UIMessage } from 'ai';
import { PreviewMessage, ThinkingMessage } from './message';
import { useScrollToBottom } from './use-scroll-to-bottom';
import { Overview } from './overview';
import { Dispatch, memo, SetStateAction } from 'react';
import { Database } from '@/lib/supabase/types';
import equal from 'fast-deep-equal';
import { TablePreview } from './table-preview';
import { useState } from 'react';
import { User } from '@supabase/supabase-js';

type Vote = Database['public']['Tables']['votes']['Row']
type PreviewData = {
  headers: string[]
  rows: (string[] | Record<string, unknown>)[]
}

interface MessagesProps {
  chatId: string;
  isLoading: boolean;
  votes: { chat_id: string; is_upvoted: boolean; message_id: string; }[] | undefined;
  messages: UIMessage[];
  setMessages: (messages: Message[] | ((messages: Message[]) => Message[])) => void;
  reload: (chatRequestOptions?: ChatRequestOptions | undefined) => Promise<string | null | undefined>;
  isArtifact?: boolean;
  user: User | null;
  append: (message: Message) => void;
}

function PureMessages({
  chatId,
  isLoading,
  votes,
  messages,
  setMessages,
  reload,
  user,
  append,
}: MessagesProps) {
  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();
  const [tableData, setTableData] = useState<PreviewData | null>(null);
  return (
    <div
      ref={messagesContainerRef}
      className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-scroll pt-4"
    >
      {messages.length === 0 && <Overview />}
      {tableData && <TablePreview data={tableData} />}
      {messages.map((message, index) => (
        <PreviewMessage
          key={message.id}
          chatId={chatId}
          message={message}
          user={user}
          append={append}
          isLoading={isLoading && messages.length - 1 === index}
          vote={
            votes
              ? votes.find((vote) => vote.message_id === message.id)
              : undefined
          }
          setMessages={setMessages}
          reload={reload}
        />
      ))}

      {isLoading &&
        messages.length > 0 &&
        messages[messages.length - 1].role === 'user' && <ThinkingMessage />}

      <div
        ref={messagesEndRef}
        className="shrink-0 min-w-[24px] min-h-[24px]"
      />
    </div>
  );
}

export const Messages = memo(PureMessages, (prevProps, nextProps) => {
  if (prevProps.isArtifact && nextProps.isArtifact) return true;

  if (prevProps.isLoading !== nextProps.isLoading) return false;
  if (prevProps.isLoading && nextProps.isLoading) return false;
  if (prevProps.messages.length !== nextProps.messages.length) return false;
  if (!equal(prevProps.messages, nextProps.messages)) return false;
  if (!equal(prevProps.votes, nextProps.votes)) return false;

  return true;
});