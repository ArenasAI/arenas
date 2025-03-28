'use client';

import type { ChatRequestOptions, Message } from 'ai';
import type { Attachment } from 'ai';
import cx from 'classnames';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useState } from 'react';

import type { Vote } from '@/lib/supabase/types';
import {
  PencilEditIcon,
  ArenasIcon,
} from './icons';
import { Markdown } from './markdown';
import { MessageActions } from './message-actions';
import { PreviewAttachment } from './preview-attachment';
import equal from 'fast-deep-equal';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { MessageEditor } from './message-editor';
import { MessageReasoning } from './message-reasoning';
import { ChartDisplay } from './chart-display';

interface PreviewData { 
  type: 'file' | 'image' | 'spreadsheet';
  name: string;
  size: number;
  contentType: string;
  lastModified: string;
  dimensions?: { width: number; height: number };
  thumbnail?: string;
  icon?: 'FileText' | 'FileSpreadsheet';
}

interface AttachmentWithPreview extends Attachment {
  preview?: PreviewData;
  url: string;
  name: string;
  contentType: string;
}

type ChartType = 'line' | 'bar' | 'scatter' | 'pie' | 'heatmap';

interface Chart {
  type: ChartType;
  title: string;
  image?: string;
  elements?: Array<{
    label: string;
    value: number;
  }>;
  x_label?: string;
  y_label?: string;
}

interface ToolInvocation {
  toolCallId: string;
  toolName: string;
  state: 'call' | 'result';
  args?: {
    charts?: Chart[];
    [key: string]: unknown;
  };
  result?: {
    charts?: Chart[];
    [key: string]: unknown;
  };
}

const PurePreviewMessage = ({
  chatId,
  message,
  vote,
  isLoading,
  setMessages,
  reload,
}: {
  chatId: string;
  message: Message;
  vote: Vote | undefined;
  isLoading: boolean;
  setMessages: (
    messages: Message[] | ((messages: Message[]) => Message[]),
  ) => void;
  reload: (
    chatRequestOptions?: ChatRequestOptions,
  ) => Promise<string | null | undefined>;
}) => {
  const [mode, setMode] = useState<'view' | 'edit'>('view');

  return (
    <AnimatePresence>
      <motion.div
        className="w-full mx-auto max-w-3xl px-4 group/message"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role={message.role}
      >
        <div
          className={cn(
            'flex gap-4 w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl',
            {
              'w-full': mode === 'edit',
              'group-data-[role=user]/message:w-fit': mode !== 'edit',
            },
          )}
        >
          {message.role === 'assistant' && (
            <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
              <div className="translate-y-px">
                <ArenasIcon size={40}/>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4 w-full">
            {message.experimental_attachments && (
              <div className="flex flex-row justify-end gap-2">
                {(message.experimental_attachments as AttachmentWithPreview[]).map((attachment) => (
                  <PreviewAttachment
                    key={attachment.url}
                    attachment={{
                      ...attachment,
                      preview: attachment.preview || {
                        type: attachment.contentType?.startsWith('image/') ? 'image' : 
                              attachment.contentType?.includes('spreadsheet') || attachment.name?.includes('.csv') || 
                              attachment.name?.includes('.xlsx') || attachment.name?.includes('.xls') ? 'spreadsheet' : 'file',
                        name: attachment.name || 'File',
                        size: 0,
                        contentType: attachment.contentType || '',
                        lastModified: new Date().toISOString(),
                        thumbnail: attachment.url,
                        icon: attachment.contentType?.startsWith('image/') ? undefined :
                              attachment.contentType?.includes('spreadsheet') || attachment.name?.includes('.csv') || 
                              attachment.name?.includes('.xlsx') || attachment.name?.includes('.xls') ? 'FileSpreadsheet' : 'FileText'
                      }
                    }}
                  />
                ))}
              </div>
            )}

            {message.reasoning && (
              <MessageReasoning
                isLoading={isLoading}
                reasoning={message.reasoning}
              />
            )}

            {(message.content || message.reasoning) && mode === 'view' && (
              <div className="flex flex-row gap-2 items-start">
                {message.role === 'user' && (
                  <Tooltip>
                    <TooltipTrigger asChild> 
                      <Button
                        variant="ghost"
                        className="px-2 h-fit rounded-full text-muted-foreground opacity-0 group-hover/message:opacity-100"
                        onClick={() => {
                          setMode('edit');
                        }}
                      >
                        <PencilEditIcon />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit message</TooltipContent>
                  </Tooltip>
                )}

                <div
                  className={cn('flex flex-col gap-4', {
                    'bg-primary text-primary-foreground px-3 py-2 rounded-xl':
                      message.role === 'user',
                  })}
                >
                  <Markdown>{message.content as string}</Markdown>
                </div>
              </div>
            )}

            {message.content && mode === 'edit' && (
              <div className="flex flex-row gap-2 items-start">
                <div className="size-8" />

                <MessageEditor
                  key={message.id}
                  message={message}
                  setMode={setMode}
                  setMessages={setMessages}
                  reload={reload}
                />
              </div>
            )}

            {message.toolInvocations && message.toolInvocations.length > 0 && (
              <div className="flex flex-col gap-4">
                {(message.toolInvocations as ToolInvocation[]).map((toolInvocation) => {
                  const { toolName, toolCallId, state, args, result } = toolInvocation;

                  if (state === 'result' && result) {
                    return (
                      <div key={`result-${toolCallId}`} className="w-full">
                        {toolName === 'visualization' ? (
                          <div className="w-full">
                            <div className="bg-muted p-4 rounded-lg mb-2">
                              <h4 className="text-sm font-medium mb-2">Visualization</h4>
                              <div className="w-full max-w-3xl mx-auto">
                                <ChartDisplay charts={result.charts || []} />
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  }

                  return (
                    <div
                      key={`call-${toolCallId}`}
                      className={cx("w-full", {
                        'animate-pulse': ['visualization', 'cleaning'].includes(toolName),
                      })}
                    >
                      {toolName === 'visualization' ? (
                        <div className="bg-muted p-4 rounded-lg mb-2">
                          <h4 className="text-sm font-medium mb-2">Generating Visualization</h4>
                          <div className="w-full max-w-3xl mx-auto">
                            <ChartDisplay charts={args?.charts || []} />
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}

            {(
              <MessageActions
                chatId={chatId}
                message={message}
                vote={vote}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (prevProps.message.reasoning !== nextProps.message.reasoning)
      return false;
    if (prevProps.message.content !== nextProps.message.content) return false;
    if (
      !equal(
        prevProps.message.toolInvocations,
        nextProps.message.toolInvocations,
      )
    )
      return false;
    if (!equal(prevProps.vote, nextProps.vote)) return false;

    return true;
  },
);

export const ThinkingMessage = () => {
  const role = 'assistant';

  return (
    <motion.div
      className="w-full mx-auto max-w-3xl px-4 group/message "
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 1 } }}
      data-role={role}
    >
      <div
        className={cx(
          'flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl',
          {
            'group-data-[role=user]/message:bg-muted': true,
          },
        )}
      >
        <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border">
          <ArenasIcon size={14} />
        </div>

        <div className="flex flex-col gap-2 w-full">
          <div className="flex flex-col gap-4 text-muted-foreground">
            Thinking...
          </div>
        </div>
      </div>
    </motion.div>
  );
};