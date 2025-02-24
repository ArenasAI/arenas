'use client';

import { Attachment, ChatRequestOptions, CreateMessage, Message } from 'ai';
import cx from 'classnames';
import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  Dispatch,
  SetStateAction,
  ChangeEvent,
  DragEvent,
} from 'react';
import { toast } from 'sonner';
import { useLocalStorage, useWindowSize } from 'usehooks-ts';
import { dela } from '../ui/fonts';
import { cn, sanitizeUIMessages } from '@/lib/utils';

import { ArrowUpIcon, PaperclipIcon, StopIcon, BrainIcon, BrainWithGogglesIcon, RobotWithBookwormHatIcon } from './icons';
import { PreviewAttachment } from './preview-attachment';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';

export function MultimodalInput({
  chatId,
  input,
  setInput,
  isLoading,
  stop,
  attachments,
  setAttachments,
  messages,
  setMessages,
  append,
  handleSubmit,
  isDragging,
  className,
}: {
  chatId: string;
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  stop: () => void;
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  messages: Array<Message>;
  setMessages: Dispatch<SetStateAction<Array<Message>>>;
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
  isDragging:boolean;
  className?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { width } = useWindowSize();

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, []);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
    }
  };

  const [advancedReasoning, setAdvancedReasoning] = useState(false);
  const [research, setResearch] = useState(false);

  const toggleResearch = () => {
    setResearch(!research);
  }

  const toggleAdvancedReasoning = () => {
    setAdvancedReasoning(!advancedReasoning);
  };

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    'input',
    ''
  );

  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      // Prefer DOM value over localStorage to handle hydration
      const finalValue = domValue || localStorageInput || '';
      setInput(finalValue);
      adjustHeight();
    }
    // Only run once after hydration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
    adjustHeight();
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);

  const submitForm = useCallback(() => {
    window.history.replaceState({}, '', `/chat/${chatId}`);

    handleSubmit(undefined, {
      experimental_attachments: attachments,
    });

    setAttachments([]);
    setLocalStorageInput('');

    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [
    attachments,
    handleSubmit,
    setAttachments,
    setLocalStorageInput,
    width,
    chatId,
  ]);


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

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

      setUploadQueue(files.map((file) => file.name));

      try {
        const uploadPromises = files.map((file) => uploadFile(file, chatId));
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
    },
    [setAttachments, chatId]
  );


  const removeAttachment = useCallback(async (attachment: Attachment) => {
    try {
      const response = await fetch(`/api/files/remove`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId,
          path: attachment.name,
          url: attachment.url
        }),
  })

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to remove file');
    }

    setAttachments(current => 
      current.filter(a => a.url !== attachment.url)
    );

    toast.success('File removed successfully');
    } catch (error) {
    console.error('Error removing file:', error);
    toast.error('Failed to remove file');
    }
    }, [chatId, setAttachments]);

  return (
    <div className="relative w-full flex flex-col gap-4">
      <input
        type="file"
        className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
        ref={fileInputRef}
        multiple
        onChange={handleFileChange}
        tabIndex={-1}
      />

      {(attachments.length > 0 || uploadQueue.length > 0) && (
        <div className={cn(
          "flex flex-row gap-2 overflow-x-scroll items-end",
          isDragging && "opacity-50"
        )}>
          {attachments.map((attachment) => (
            <PreviewAttachment key={attachment.url} attachment={attachment} onRemove={()=> removeAttachment(attachment)} />
          ))}

          {uploadQueue.map((filename) => (
            <PreviewAttachment
              key={filename}
              attachment={{
                url: '',
                name: filename,
                contentType: '',
              }}
              isUploading={true}
            />
          ))}
        </div>
      )}

      <Textarea
        ref={textareaRef}
        placeholder="say somethin..."
        value={input}
        onChange={handleInput}
        className={cn(
          'min-h-[24px] max-h-[calc(75dvh)] overflow-hidden resize-none rounded-xl text-base bg-muted transition-all duration-200',
          isDragging && 'scale-102 border-primary',
          className
        )}
        rows={3}
        autoFocus
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();

            if (isLoading) {
              toast.error('Please wait for the model to finish its response!');
            } else {
              submitForm();
            }
          }
        }}
        
      />

      {isLoading ? (
        <Button
          className="rounded-full p-1.5 h-fit absolute bottom-2 right-2 m-0.5 border dark:border-zinc-600"
          onClick={(event) => {
            event.preventDefault();
            stop();
            setMessages((messages) => sanitizeUIMessages(messages));
          }}
        >
          <StopIcon size={14} />
        </Button>
      ) : (
        <Button
          className="rounded-full p-1.5 h-fit absolute bottom-2 right-2 m-0.5 border dark:border-zinc-600"
          onClick={(event) => {
            event.preventDefault();
            submitForm();
          }}
          disabled={input.length === 0 || uploadQueue.length > 0}
        >
          <ArrowUpIcon size={14} />
        </Button>
      )}

      <div>
        <div className="flex gap-2 left-2">
          {/* <Button
            className={`${dela.className} rounded-sm p-1.5 h-fit shadow-sm dark:border-zinc-700`}
            onClick={toggleAdvancedReasoning}
            variant={advancedReasoning ? "default" : "outline"}
            disabled={isLoading}
            title="Toggle Advanced Reasoning"
          >
            <span className="flex items-center gap-1">
              <BrainIcon size={14} />
              reason
            </span>
          </Button> */}

          <Button
            className={`${dela.className} rounded-sm p-1.5 h-fit shadow-sm dark:border-zinc-700`}
            variant="outline"
            onClick={toggleResearch}
            disabled={isLoading}
          >
            <RobotWithBookwormHatIcon />
            deep research
          </Button>

          <Button
            className={`${dela.className} rounded-sm p-1.5 h-fit shadow-sm dark:border-zinc-700`}
            onClick={(event) => {
              event.preventDefault();
              fileInputRef.current?.click();
            }}
            variant="outline"
            disabled={isLoading}
          >
            <PaperclipIcon />
            attach
          </Button>
        </div>
      </div>
    </div>
  );
}