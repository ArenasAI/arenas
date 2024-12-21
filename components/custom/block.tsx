import { Attachment, ChatRequestOptions, CreateMessage, Message } from 'ai';
import cx from 'classnames';
import { formatDistance } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
  useMemo,
  memo,
  useRef,
} from 'react';
import { toast } from 'sonner';
import useSWR, { useSWRConfig } from 'swr';
import {
  useCopyToClipboard,
  useDebounceCallback,
  useWindowSize,
} from 'usehooks-ts';

import { fetcher } from '@/lib/utils';

import { DiffView } from './diffview';
import { DocumentSkeleton } from './document-skeleton';
import { Editor } from './editor';
import { CopyIcon, CrossIcon, DeltaIcon, RedoIcon, UndoIcon } from './icons';
import { PreviewMessage } from './message';
import { MultimodalInput } from './multimodal-input';
import { Toolbar } from './toolbar';
import { useScrollToBottom } from './use-scroll-to-bottom';
import { VersionFooter } from './version-footer';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

import type { Document, Suggestion, Vote } from '@/lib/supabase/types';

export interface UIBlock {
  title: string;
  documentId: string;
  content: string;
  isVisible: boolean;
  status: 'streaming' | 'idle';
  boundingBox: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

// Memoize the streaming indicator with better animation
const StreamingIndicator = memo(function StreamingIndicator() {
  return (
    <div className="fixed bottom-0 inset-x-0 bg-gradient-to-t from-background to-transparent h-32 pointer-events-none">
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-1">
        <div className="size-2 rounded-full bg-foreground/50 animate-bounce [animation-delay:-0.3s]" />
        <div className="size-2 rounded-full bg-foreground/50 animate-bounce [animation-delay:-0.15s]" />
        <div className="size-2 rounded-full bg-foreground/50 animate-bounce" />
      </div>
    </div>
  );
});

// Memoize the Editor component wrapper with optimized streaming
const EditorWrapper = memo(
  function EditorWrapper({
    content,
    isCurrentVersion,
    currentVersionIndex,
    status,
    saveContent,
    suggestions,
  }: {
    content: string;
    isCurrentVersion: boolean;
    currentVersionIndex: number;
    status: 'streaming' | 'idle';
    saveContent: (content: string, debounce: boolean) => void;
    suggestions: Suggestion[];
  }) {
    // Use a ref to track content updates
    const contentRef = useRef(content);
    useEffect(() => {
      contentRef.current = content;
    }, [content]);

    return (
      <div className="relative w-full">
        <Editor
          content={content}
          isCurrentVersion={isCurrentVersion}
          currentVersionIndex={currentVersionIndex}
          status={status}
          saveContent={saveContent}
          suggestions={suggestions}
        />
        {status === 'streaming' && <StreamingIndicator />}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison to prevent unnecessary re-renders
    return (
      prevProps.content === nextProps.content &&
      prevProps.status === nextProps.status &&
      prevProps.isCurrentVersion === nextProps.isCurrentVersion &&
      prevProps.currentVersionIndex === nextProps.currentVersionIndex
    );
  }
);

// Memoize the document content getter
const useDocumentContent = (
  documents: Document[] | undefined,
  index: number
) => {
  return useMemo(() => {
    if (!documents) return '';
    if (!documents[index]) return '';
    return documents[index].content ?? '';
  }, [documents, index]);
};

export function Block({
  chatId,
  input,
  setInput,
  handleSubmit,
  isLoading,
  stop,
  attachments,
  setAttachments,
  append,
  block,
  setBlock,
  messages,
  setMessages,
  votes,
}: {
  chatId: string;
  input: string;
  setInput: (input: string) => void;
  isLoading: boolean;
  stop: () => void;
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  block: UIBlock;
  setBlock: Dispatch<SetStateAction<UIBlock>>;
  messages: Array<Message>;
  setMessages: Dispatch<SetStateAction<Array<Message>>>;
  votes: Array<Vote> | undefined;
  append: (
    message: Message | CreateMessage,
    chatRequestOptions?: ChatRequestOptions
  ) => Promise<string | null | undefined>;
  handleSubmit: (
    event?: {
      preventDefault?: () => void;
    },
    chatRequestOptions?: ChatRequestOptions
  ) => void;
}) {
  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  const {
    data: documents,
    isLoading: isDocumentsFetching,
    mutate: mutateDocuments,
  } = useSWR<Array<Document>>(
    block?.documentId && block.status !== 'streaming'
      ? `/api/document?id=${block.documentId}`
      : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
      keepPreviousData: true,
    }
  );

  const { data: suggestions } = useSWR<Array<Suggestion>>(
    documents && block?.documentId && block.status !== 'streaming'
      ? `/api/suggestions?documentId=${block.documentId}`
      : null,
    fetcher,
    {
      dedupingInterval: 10000,
      revalidateOnFocus: false,
      keepPreviousData: true,
    }
  );

  const [mode, setMode] = useState<'edit' | 'diff'>('edit');
  const [document, setDocument] = useState<Document | null>(null);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(-1);

  useEffect(() => {
    if (documents && documents.length > 0) {
      const mostRecentDocument = documents.at(-1);
      console.log('mostRecentDocument', mostRecentDocument);

      if (mostRecentDocument) {
        setDocument(mostRecentDocument);
        setCurrentVersionIndex(documents.length - 1);
        setBlock((currentBlock) => ({
          ...currentBlock,
          content: mostRecentDocument.content ?? '',
        }));
      }
    }
  }, [documents, setBlock]);

  useEffect(() => {
    if (block.status === 'streaming') {
      // Prevent document fetching during streaming
      return;
    }
    mutateDocuments();
  }, [block.status, mutateDocuments]);

  const { mutate } = useSWRConfig();
  const [isContentDirty, setIsContentDirty] = useState(false);

  const handleContentChange = useCallback(
    (updatedContent: string) => {
      if (!block) return;

      mutate<Array<Document>>(
        `/api/document?id=${block.documentId}`,
        async (currentDocuments) => {
          if (!currentDocuments) return undefined;

          const currentDocument = currentDocuments.at(-1);

          if (!currentDocument || !currentDocument.content) {
            setIsContentDirty(false);
            return currentDocuments;
          }

          if (currentDocument.content !== updatedContent) {
            await fetch(`/api/document?id=${block.documentId}`, {
              method: 'POST',
              body: JSON.stringify({
                title: block.title,
                content: updatedContent,
              }),
            });

            setIsContentDirty(false);

            const newDocument = {
              ...currentDocument,
              content: updatedContent,
              createdAt: new Date(),
            };

            return [...currentDocuments, newDocument];
          } else {
            return currentDocuments;
          }
        },
        { revalidate: false }
      );
    },
    [block, mutate]
  );

  // const handleContentChangeCur = useCallback(
  //   (updatedContent: string) => {
  //     if (!block) return;

  //     if (document?.content === updatedContent) return;

  //     mutate<Array<Document>>(
  //       `/api/document?id=${block.documentId}`,
  //       async (currentDocuments) => {
  //         if (!currentDocuments) return undefined;

  //         const currentDocument = currentDocuments.at(-1);
  //         if (!currentDocument) {
  //           setIsContentDirty(false);
  //           return currentDocuments;
  //         }

  //         const newDocument = {
  //           ...currentDocument,
  //           content: updatedContent,
  //           created_at: new Date().toISOString(),
  //         };

  //         setDocument(newDocument);
  //         setIsContentDirty(true);

  //         try {
  //           await fetch(`/api/document?id=${block.documentId}`, {
  //             method: 'POST',
  //             body: JSON.stringify({
  //               title: block.title,
  //               content: updatedContent,
  //             }),
  //           });

  //           setIsContentDirty(false);
  //           return [...currentDocuments, newDocument];
  //         } catch (error) {
  //           setIsContentDirty(false);
  //           return currentDocuments;
  //         }
  //       },
  //       {
  //         revalidate: false,
  //         rollbackOnError: true,
  //       }
  //     );
  //   },
  //   [block, document, mutate]
  // );

  const debouncedHandleContentChange = useDebounceCallback(
    handleContentChange,
    3000
  );

  const saveContent = useCallback(
    (updatedContent: string, debounce: boolean) => {
      if (document && updatedContent !== document.content) {
        setIsContentDirty(true);

        if (debounce) {
          debouncedHandleContentChange(updatedContent);
        } else {
          handleContentChange(updatedContent);
        }
      }
    },
    [document, debouncedHandleContentChange, handleContentChange]
  );

  function getDocumentContentById(index: number) {
    if (!documents) return '';
    if (!documents[index]) return '';
    return documents[index].content ?? '';
  }

  const [restoredContent, setRestoredContent] = useState<string | null>(null);

  const handleVersionChange = (type: 'next' | 'prev' | 'toggle' | 'latest') => {
    if (!documents) return;

    if (type === 'latest') {
      setCurrentVersionIndex(documents.length - 1);
      setMode('edit');
    }

    if (type === 'toggle') {
      setMode((mode) => (mode === 'edit' ? 'diff' : 'edit'));
    }

    if (type === 'prev') {
      if (currentVersionIndex > 0) {
        setCurrentVersionIndex((index) => index - 1);
      }
    } else if (type === 'next') {
      if (currentVersionIndex < documents.length - 1) {
        setCurrentVersionIndex((index) => index + 1);
      }
    }
  };

  const [isToolbarVisible, setIsToolbarVisible] = useState(false);

  /*
   * NOTE: if there are no documents, or if
   * the documents are being fetched, then
   * we mark it as the current version.
   */

  const isCurrentVersion =
    documents && documents.length > 0
      ? currentVersionIndex === documents.length - 1
      : true;

  const { width: windowWidth, height: windowHeight } = useWindowSize();
  const isMobile = windowWidth ? windowWidth < 768 : false;

  const [_, copyToClipboard] = useCopyToClipboard();

  console.log('documents', documents);

  // Memoize current document content
  const currentContent = useDocumentContent(documents, currentVersionIndex);

  // Optimize content display
  const displayContent = useMemo(() => {
    if (block.status === 'streaming') {
      return block.content;
    }
    if (restoredContent && !isCurrentVersion) {
      return restoredContent;
    }
    return isCurrentVersion ? block.content : currentContent;
  }, [
    block.status,
    block.content,
    isCurrentVersion,
    currentContent,
    restoredContent,
  ]);

  return (
    <motion.div
      className="flex flex-row h-dvh w-dvw fixed top-0 left-0 z-50 bg-muted"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { delay: 0.4 } }}
    >
      {!isMobile && (
        <motion.div
          className="relative w-[400px] bg-muted dark:bg-background h-dvh shrink-0"
          initial={{ opacity: 0, x: 10, scale: 1 }}
          animate={{
            opacity: 1,
            x: 0,
            scale: 1,
            transition: {
              delay: 0.2,
              type: 'spring',
              stiffness: 200,
              damping: 30,
            },
          }}
          exit={{
            opacity: 0,
            x: 0,
            scale: 0.95,
            transition: { delay: 0 },
          }}
        >
          <AnimatePresence>
            {!isCurrentVersion && (
              <motion.div
                className="left-0 absolute h-dvh w-[400px] top-0 bg-zinc-900/50 z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            )}
          </AnimatePresence>

          <div className="flex flex-col h-full justify-between items-center gap-4">
            <div
              ref={messagesContainerRef}
              className="flex flex-col gap-4 h-full items-center overflow-y-scroll px-4 pt-20"
            >
              {messages.map((message, index) => (
                <PreviewMessage
                  chatId={chatId}
                  key={message.id}
                  message={message}
                  block={block}
                  setBlock={setBlock}
                  isLoading={isLoading && index === messages.length - 1}
                  vote={
                    votes
                      ? votes.find((vote) => vote.message_id === message.id)
                      : undefined
                  }
                />
              ))}

              <div
                ref={messagesEndRef}
                className="shrink-0 min-w-[24px] min-h-[24px]"
              />
            </div>

            <form className="flex flex-row gap-2 relative items-end w-full px-4 pb-4">
              <MultimodalInput
                chatId={chatId}
                input={input}
                setInput={setInput}
                handleSubmit={handleSubmit}
                isLoading={isLoading}
                stop={stop}
                attachments={attachments}
                setAttachments={setAttachments}
                messages={messages}
                append={append}
                className="bg-background dark:bg-muted"
                setMessages={setMessages}
              />
            </form>
          </div>
        </motion.div>
      )}

      <motion.div
        className="fixed dark:bg-muted bg-background h-dvh flex flex-col shadow-xl overflow-y-scroll"
        initial={
          isMobile
            ? {
                opacity: 0,
                x: 0,
                y: 0,
                width: windowWidth,
                height: windowHeight,
                borderRadius: 50,
              }
            : {
                opacity: 0,
                x: block.boundingBox.left,
                y: block.boundingBox.top,
                height: block.boundingBox.height,
                width: block.boundingBox.width,
                borderRadius: 50,
              }
        }
        animate={
          isMobile
            ? {
                opacity: 1,
                x: 0,
                y: 0,
                width: windowWidth,
                height: '100dvh',
                borderRadius: 0,
                transition: {
                  delay: 0,
                  type: 'spring',
                  stiffness: 200,
                  damping: 30,
                },
              }
            : {
                opacity: 1,
                x: 400,
                y: 0,
                height: windowHeight,
                width: windowWidth ? windowWidth - 400 : 'calc(100dvw-400px)',
                borderRadius: 0,
                transition: {
                  delay: 0,
                  type: 'spring',
                  stiffness: 200,
                  damping: 30,
                },
              }
        }
        exit={{
          opacity: 0,
          scale: 0.5,
          transition: {
            delay: 0.1,
            type: 'spring',
            stiffness: 600,
            damping: 30,
          },
        }}
      >
        <div className="p-2 flex flex-row justify-between items-start">
          <div className="flex flex-row gap-4 items-start">
            <Button
              variant="outline"
              className="h-fit p-2 dark:hover:bg-zinc-700"
              onClick={() => {
                setBlock((currentBlock) => ({
                  ...currentBlock,
                  isVisible: false,
                }));
              }}
            >
              <CrossIcon size={18} />
            </Button>

            <div className="flex flex-col">
              <div className="font-medium">
                {document?.title ?? block.title}
              </div>

              {isContentDirty ? (
                <div className="text-sm text-muted-foreground">
                  Saving changes...
                </div>
              ) : document ? (
                <div className="text-sm text-muted-foreground">
                  {`Updated ${formatDistance(
                    new Date(document.created_at),
                    new Date(),
                    {
                      addSuffix: true,
                    }
                  )}`}
                </div>
              ) : (
                <div className="w-32 h-3 mt-2 bg-muted-foreground/20 rounded-md animate-pulse" />
              )}
            </div>
          </div>

          <div className="flex flex-row gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className="p-2 h-fit dark:hover:bg-zinc-700"
                  onClick={() => {
                    copyToClipboard(block.content);
                    toast.success('Copied to clipboard!');
                  }}
                  disabled={block.status === 'streaming'}
                >
                  <CopyIcon size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy to clipboard</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className="p-2 h-fit dark:hover:bg-zinc-700 !pointer-events-auto relative"
                  onClick={() => {
                    handleVersionChange('prev');
                  }}
                  disabled={
                    currentVersionIndex === 0 || block.status === 'streaming'
                  }
                >
                  {documents?.length &&
                  currentVersionIndex === documents.length - 1 ? (
                    <span className=" absolute -bottom-[21px] text-[9px] text-muted-foreground ">
                      Latest
                    </span>
                  ) : (
                    <span className=" absolute -bottom-[21px] text-[9px] text-muted-foreground ">
                      {documents?.length
                        ? `${currentVersionIndex} / ${documents.length}`
                        : ''}
                    </span>
                  )}
                  <UndoIcon size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="flex flex-col space-y-1">
                <span className="text-[10px] text-muted-foreground">
                  {documents?.length
                    ? `${currentVersionIndex} / ${documents.length}`
                    : ''}
                </span>{' '}
                <p>View Previous version</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className="p-2 h-fit dark:hover:bg-zinc-700 !pointer-events-auto"
                  onClick={() => {
                    handleVersionChange('next');
                  }}
                  disabled={isCurrentVersion || block.status === 'streaming'}
                >
                  <RedoIcon size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>View Next version</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className={cx(
                    'p-2 h-fit !pointer-events-auto dark:hover:bg-zinc-700 relative',
                    {
                      'bg-muted': mode === 'diff',
                      'border border-t-white/10 border-x-white/10 border-b-background shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_1px_3px_rgba(255,255,255,0.1)]':
                        mode === 'diff',
                    }
                  )}
                  onClick={() => {
                    handleVersionChange('toggle');
                  }}
                  disabled={
                    block.status === 'streaming' || currentVersionIndex === 0
                  }
                >
                  {mode === 'diff' ? (
                    <span className="absolute -bottom-[21px] text-[9px] text-muted-foreground">
                      diff
                    </span>
                  ) : (
                    <span className="absolute -bottom-[21px] text-[9px] text-muted-foreground">
                      edit
                    </span>
                  )}
                  <DeltaIcon
                    size={18}
                    className={mode === 'diff' ? 'translate-y-px' : ''}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="flex flex-col space-y-1">
                <span className="text-[10px] text-muted-foreground">
                  {mode === 'diff' ? 'diff mode' : 'edit mode'}
                </span>{' '}
                <p>Toggle mode to {mode === 'diff' ? 'edit' : 'diff'}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="prose dark:prose-invert dark:bg-muted bg-background h-full overflow-y-scroll px-4 py-8 md:p-20 !max-w-full pb-40 items-center">
          <div className="flex flex-row max-w-[600px] mx-auto">
            {isDocumentsFetching && !block.content ? (
              <DocumentSkeleton />
            ) : mode === 'edit' ? (
              <EditorWrapper
                content={displayContent}
                isCurrentVersion={isCurrentVersion}
                currentVersionIndex={currentVersionIndex}
                status={block.status}
                saveContent={saveContent}
                suggestions={isCurrentVersion ? (suggestions ?? []) : []}
              />
            ) : (
              <DiffView
                oldContent={getDocumentContentById(currentVersionIndex - 1)}
                newContent={getDocumentContentById(currentVersionIndex)}
              />
            )}

            {suggestions ? (
              <div className="md:hidden h-dvh w-12 shrink-0" />
            ) : null}

            <AnimatePresence>
              {isCurrentVersion && (
                <Toolbar
                  isToolbarVisible={isToolbarVisible}
                  setIsToolbarVisible={setIsToolbarVisible}
                  append={append}
                  isLoading={isLoading}
                  stop={stop}
                  setMessages={setMessages}
                />
              )}
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence>
          {!isCurrentVersion && (
            <VersionFooter
              block={block}
              currentVersionIndex={currentVersionIndex}
              documents={documents as Document[]}
              handleVersionChange={handleVersionChange}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
