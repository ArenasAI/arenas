import { PreviewMessage } from '../custom/message';
import { useScrollToBottom } from '../custom/use-scroll-to-bottom';
import { Database } from '@/lib/supabase/types';
import { ChatRequestOptions, Message } from 'ai';
import { UseChatHelpers } from 'ai/react';
import { memo } from 'react';
import equal from 'fast-deep-equal';
import { UIArtifact } from './artifact';

type Vote = Database['public']['Tables']['votes']['Row']

interface ArtifactMessagesProps {
  chatId: string;
  status: UseChatHelpers['status'];
  votes: Array<Vote> | undefined;
  messages: Array<Message>;
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload'];
  artifactStatus: UIArtifact['status'];
}

function PureArtifactMessages({
  chatId,
  status,
  votes,
  messages,
  setMessages,
  reload,
}: ArtifactMessagesProps) {
  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  return (
    <div
      ref={messagesContainerRef}
      className="flex flex-col gap-4 h-full items-center overflow-y-scroll px-4 pt-20"
    >
      {messages.map((message, index) => (
        <PreviewMessage
          chatId={chatId}
          key={message.id}
          message={message}
          isLoading={status === 'streaming' && index === messages.length - 1}
          vote={
            votes
              ? votes.find((vote) => vote.message_id === message.id)
              : undefined
          }
          setMessages={setMessages}
          reload={reload}
        />
      ))}

      <div
        ref={messagesEndRef}
        className="shrink-0 min-w-[24px] min-h-[24px]"
      />
    </div>
  );
}

function areEqual(
  prevProps: ArtifactMessagesProps,
  nextProps: ArtifactMessagesProps,
) {
  if (
    prevProps.artifactStatus === 'streaming' &&
    nextProps.artifactStatus === 'streaming'
  )
    return true;

  if (prevProps.status !== nextProps.status) return false;
  if (prevProps.status && nextProps.status) return false;
  if (prevProps.messages.length !== nextProps.messages.length) return false;
  if (!equal(prevProps.votes, nextProps.votes)) return false;

  return true;
}

export const ArtifactMessages = memo(PureArtifactMessages, areEqual);
