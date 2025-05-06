'use client';

import type {
  Attachment,
  Message,
} from 'ai';
import cx from 'classnames';
import type React from 'react';
import {
  useRef,
  useEffect,
  useState,
  useCallback,
  type Dispatch,
  type SetStateAction,
  type ChangeEvent,
  memo,
} from 'react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

import { cn, sanitizeUIMessages } from '@/lib/utils';

import { ArrowUpIcon, PaperclipIcon, StopIcon } from './icons';
import { PreviewAttachment } from './preview-attachment';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import equal from 'fast-deep-equal';
import { UseChatHelpers } from 'ai/react';

interface MultimodalInputProps {
  chatId: string;
  input: UseChatHelpers['input'];
  setInput: UseChatHelpers['setInput'];
  status: UseChatHelpers['status'];
  stop: () => void;
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  messages: Array<Message>;
  setMessages: Dispatch<SetStateAction<Array<Message>>>;
  append: UseChatHelpers['append'];
  handleSubmit: UseChatHelpers['handleSubmit'];
  className?: string;
  remainingMessages?: number;
}

function PureMultimodalInput({
  chatId,
  input,
  setInput,
  status,
  stop,
  attachments,
  setAttachments,
  setMessages,
  handleSubmit,
  className,
  remainingMessages,
}: MultimodalInputProps) {

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileList | undefined>(undefined);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const resetHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = '98px';
    }
  };

  const handlePaste = (event: React.ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (items) {
      const files = Array.from(items).map((item) => item.getAsFile()).filter((file) => file !== null);
      if (files.length > 0) {
        const validFiles = files.filter(
          (file) => file.type.startsWith('image/') || file.type.startsWith('text/csv') || file.type.startsWith('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        );

        if (validFiles.length === files.length) {
          const dataTransfer = new DataTransfer();
          validFiles.forEach((file) => dataTransfer.items.add(file));
          event.preventDefault();
          fileInputRef.current?.click();
          setTimeout(() => {
            fileInputRef.current?.dispatchEvent(new Event('change', { bubbles: true }));
          }, 0);
        }
      }
    }
  };

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
    adjustHeight();
  };

  const [fileUploads, setFileUploads] = useState<Array<{
    id: string;
    fileName: string;
    progress: number;
    status: 'uploading' | 'processing' | 'complete' | 'error';
    error?: string;
  }>>([]);

  const submitForm = useCallback(() => {
    if (attachments.length > 0) {
      handleSubmit(undefined, {
        experimental_attachments: attachments.map(att => ({
          url: att.url,
          name: att.name,
          contentType: att.contentType
        }))
      });
    } else {
      handleSubmit();
    }

    // Clear state after submission
    setFiles(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setAttachments([]);
    resetHeight();
  }, [attachments, handleSubmit, setAttachments]);

  const addFileUpload = useCallback((fileName: string) => {
    const id = uuidv4();
    setFileUploads(prev => [...prev, {
      id,
      fileName,
      progress: 0,
      status: 'uploading'
    }]);
    return id;
  }, []);

  const updateFileUpload = useCallback((id: string, updates: Partial<typeof fileUploads[0]>) => {
    setFileUploads(prev => 
      prev.map(upload => 
        upload.id === id ? { ...upload, ...updates } : upload
      )
    );
  }, []);

  const removeFileUpload = useCallback((id: string) => {
    setFileUploads(prev => prev.filter(upload => upload.id !== id));
  }, []);

  const uploadFile = useCallback(async (file: File) => {
    const uploadId = addFileUpload(file.name);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('chatId', chatId);

    try {
      updateFileUpload(uploadId, { progress: 20 });
      
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || 'Upload failed');
      }

      const data = await response.json();
      updateFileUpload(uploadId, { progress: 60, status: 'processing' });

      // Ensure consistent attachment structure
      const attachment = {
        url: data.url,
        name: data.path,
        contentType: file.type
      };

      updateFileUpload(uploadId, { progress: 100, status: 'complete' });
      setTimeout(() => removeFileUpload(uploadId), 2000);

      return attachment;
    } catch (error) {
      updateFileUpload(uploadId, { 
        status: 'error', 
        progress: 100,
        error: error instanceof Error ? error.message : 'Failed to upload file'
      });
      throw error;
    }
  }, [chatId, addFileUpload, updateFileUpload, removeFileUpload]);

  const handleFileChange = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;

    const newFiles = Array.from(event.target.files);
    setFiles(event.target.files);
    
    try {
      const uploadedAttachments = await Promise.all(
        newFiles.map(file => uploadFile(file))
      );

      setAttachments(prev => [...prev, ...uploadedAttachments]);
      toast.success(`Successfully uploaded ${uploadedAttachments.length} file(s)`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload one or more files');
    }
  }, [setAttachments, uploadFile]);

  const removeAttachment = useCallback(async (attachment: Attachment) => {
    try {
      await fetch(`/api/files/remove`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId,
          path: attachment.name,
          url: attachment.url
        }),
      });
    } catch (error) {
      console.error('Error removing attachment!', error);
    }
  }, [chatId]);


  return (
    <div className="relative w-[calc(100%-2rem)] max-w-3xl mx-auto py-10 flex flex-col gap-4">
      <input
        type="file"
        className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
        ref={fileInputRef}
        multiple
        onChange={handleFileChange}
        tabIndex={-1}
      />

      <div className="relative">
        {(attachments.length > 0 || files) && (
          <div className={cn(
            "flex flex-row gap-2 overflow-x-scroll items-end mb-2"
          )}>
            {attachments.map((attachment) => (
              <PreviewAttachment 
                key={attachment.url} 
                attachment={attachment} 
                onRemove={() => removeAttachment(attachment)}
              />
            ))}

            {files && Array.from(files).map((file) => (
              <PreviewAttachment
                key={file.name}
                attachment={{
                  url: '',
                  name: file.name,
                  contentType: file.type,
                }}
                isUploading={true}
              />
            ))}
          </div>
        )}

        {typeof remainingMessages === 'number' && remainingMessages < Infinity && (
          <div className="absolute top-2 right-2 text-xs text-muted-foreground">
            {remainingMessages} messages remaining
          </div>
        )}

        <Textarea
          ref={textareaRef}
          placeholder="Say somethin..."
          value={input}
          onChange={handleInput}
          onPaste={handlePaste}
          className={cx(
            'min-h-[24px] max-h-[calc(75dvh)] overflow-hidden resize-none rounded-2xl !text-base pb-10 border-zinc-200 dark:border-zinc-400',
            className,
          )}
          rows={2}
          autoFocus
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();

              if (status !== 'ready') {
                toast.error('Please wait for the model to finish its response!');
              } else {
                submitForm();
              }
            }
          }}
        />

        <div className="absolute bottom-2 left-2">
          <AttachmentsButton fileInputRef={fileInputRef} status={status} />
        </div>

        <div className="absolute bottom-2 right-2">
          {status === 'submitted' ? (
            <StopButton stop={stop} setMessages={setMessages} />
          ) : (
            <SendButton
              input={input}
              submitForm={submitForm}
              uploadQueue={fileUploads.map(upload => upload.id)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export const MultimodalInput = memo(
  PureMultimodalInput,
  (prevProps, nextProps) => {
    if (prevProps.input !== nextProps.input) return false;
    if (prevProps.status !== nextProps.status) return false;
    if (!equal(prevProps.attachments, nextProps.attachments)) return false;
    if (prevProps.remainingMessages !== nextProps.remainingMessages) return false;
    return true;
  },
);

function PureAttachmentsButton({
  fileInputRef,
  status,
}: {
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  status: UseChatHelpers['status'];
}) {
  return (
    <Button
      className="rounded-md rounded-bl-lg p-[7px] h-fit dark:border-zinc-700 hover:dark:bg-zinc-900 hover:bg-zinc-200"
      onClick={(event) => {
        event.preventDefault();
        fileInputRef.current?.click();
      }}
      disabled={status !== 'ready'}
      variant="ghost"
    >
      <PaperclipIcon size={14} />
    </Button>
  );
}

const AttachmentsButton = memo(PureAttachmentsButton);

function PureStopButton({
  stop,
  setMessages,
}: {
  stop: () => void;
  setMessages: Dispatch<SetStateAction<Array<Message>>>;
}) {
  return (
    <Button
      className="rounded-full p-1.5 h-fit border dark:border-zinc-600"
      onClick={(event) => {
        event.preventDefault();
        stop();
        setMessages((messages) => sanitizeUIMessages(messages));
      }}
    >
      <StopIcon size={14} />
    </Button>
  );
}

const StopButton = memo(PureStopButton);

function PureSendButton({
  submitForm,
  input,
  uploadQueue,
}: {
  submitForm: () => void;
  input: string;
  uploadQueue: Array<string>;
}) {
  return (
    <Button
      data-testid="send-button"
      className="rounded-full p-1.5 h-fit border dark:border-zinc-600"
      onClick={(event) => {
        event.preventDefault();
        submitForm();
      }}
      disabled={input.length === 0 || uploadQueue.length > 0}
    >
      <ArrowUpIcon size={14} />
    </Button>
  );
}

const SendButton = memo(PureSendButton, (prevProps, nextProps) => {
  if (prevProps.uploadQueue.length !== nextProps.uploadQueue.length)
    return false;
  if (prevProps.input !== nextProps.input) return false;
  return true;
});