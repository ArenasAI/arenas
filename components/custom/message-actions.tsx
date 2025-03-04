import { Message } from 'ai';
import { toast } from 'sonner';
import { useSWRConfig } from 'swr';
import { useCopyToClipboard } from 'usehooks-ts';

import { Vote } from '@/lib/supabase/types';
import { extractDocumentId, generateUUID, getMessageIdFromAnnotations } from '@/lib/utils';
import { User } from '@supabase/supabase-js';
import { CopyIcon, ThumbDownIcon, ThumbUpIcon } from './icons';
import { Button } from '../ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { VisualizationMessage, VisualizationData } from '../visualizations/types';
import { BarChart2 } from 'lucide-react';
import { FileAttachment } from '@/shared/chat';

interface MessageActionsProps {
  chatId: string;
  message: Message;
  vote: { chat_id: string; is_upvoted: boolean; message_id: string; } | undefined;
  isLoading: boolean;
  user: User | null;
  append: (message: Message | VisualizationMessage) => void;
}

export function MessageActions({
  chatId,
  message,
  vote,
  isLoading,
  user,
  append,
}: MessageActionsProps) {
  const { mutate } = useSWRConfig();
  const [_, copyToClipboard] = useCopyToClipboard();

  if (isLoading) return null;
  if (message.role === 'user') return null;
  if (message.toolInvocations && message.toolInvocations.length > 0)
    return null;

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-row gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="py-1 px-2 h-fit text-muted-foreground"
              variant="outline"
              onClick={async () => {
                await copyToClipboard(message.content as string);
                toast.success('Copied to clipboard!');
              }}
            >
              <CopyIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="py-1 px-2 h-fit text-muted-foreground !pointer-events-auto"
              disabled={vote && vote.is_upvoted}
              variant="outline"
              onClick={async () => {
                const messageId = getMessageIdFromAnnotations(message);

                const upvote = fetch('/api/vote', {
                  method: 'PATCH',
                  body: JSON.stringify({
                    chatId,
                    messageId,
                    type: 'up',
                  }),
                });

                toast.promise(upvote, {
                  loading: 'Upvoting Response...',
                  success: () => {
                    mutate<Array<Vote>>(
                      `/api/vote?chatId=${chatId}`,
                      (currentVotes) => {
                        if (!currentVotes) return [];

                        const votesWithoutCurrent = currentVotes.filter(
                          (vote) => vote.message_id !== message.id
                        );

                        return [
                          ...votesWithoutCurrent,
                          {
                            chat_id: chatId,
                            message_id: message.id,
                            is_upvoted: true,
                            updated_at: new Date().toISOString(),
                          },
                        ];
                      },
                      { revalidate: false }
                    );

                    return 'Upvoted Response!';
                  },
                  error: 'Failed to upvote response.',
                });
              }}
            >
              <ThumbUpIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Upvote Response</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="py-1 px-2 h-fit text-muted-foreground !pointer-events-auto"
              variant="outline"
              disabled={vote && !vote.is_upvoted}
              onClick={async () => {
                const messageId = getMessageIdFromAnnotations(message);

                const downvote = fetch('/api/vote', {
                  method: 'PATCH',
                  body: JSON.stringify({
                    chatId,
                    messageId,
                    type: 'down',
                  }),
                });

                toast.promise(downvote, {
                  loading: 'Downvoting Response...',
                  success: () => {
                    mutate<Array<Vote>>(
                      `/api/vote?chatId=${chatId}`,
                      (currentVotes) => {
                        if (!currentVotes) return [];

                        const votesWithoutCurrent = currentVotes.filter(
                          (vote) => vote.message_id !== message.id
                        );

                        return [
                          ...votesWithoutCurrent,
                          {
                            chat_id: chatId,
                            message_id: message.id,
                            is_upvoted: false,
                            updated_at: new Date().toISOString(),
                          },
                        ];
                      },
                      { revalidate: false }
                    );

                    return 'Downvoted Response!';
                  },
                  error: 'Failed to downvote response.',
                });
              }}
            >
              <ThumbDownIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Downvote Response</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                // Get file attachment if any
                const attachment = message.experimental_attachments?.[0];
                
                // Create visualization content
                const visualizationContent = {
                  id: generateUUID(),
                  fileUrl: attachment?.url,
                  fileName: attachment?.name,
                  fileType: attachment?.contentType,
                  documentId: extractDocumentId(message.content as string) || 
                              (attachment as unknown as FileAttachment)?.id || 
                              generateUUID(),
                  userId: user?.id,
                  query: message.content as string
                };
                
                // Add visualization message
                append({
                  id: generateUUID(),
                  role: 'assistant',
                  content: '',
                  visualizationData: visualizationContent
                } as VisualizationMessage);
              }}
              disabled={!message.experimental_attachments?.length && !message.content?.includes('document:')}
            >
              <BarChart2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Generate Visualization</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
