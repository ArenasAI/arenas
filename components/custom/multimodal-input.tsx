'use client';

import type {
  Attachment,
  ChatRequestOptions,
  CreateMessage,
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
import { useLocalStorage, useWindowSize } from 'usehooks-ts';
import { v4 as uuidv4 } from 'uuid';

import { cn, sanitizeUIMessages } from '@/lib/utils';

import { ArrowUpIcon, PaperclipIcon, StopIcon } from './icons';
import { PreviewAttachment } from './preview-attachment';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import equal from 'fast-deep-equal';
import { UploadStatus } from './upload-status';
import { DataTablePreview } from './data-preview';
import { FileAttachment } from '@/shared/chat';
function PureMultimodalInput({
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
  className,
  isDragging,
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
    chatRequestOptions?: ChatRequestOptions,
  ) => Promise<string | null | undefined>;
  handleSubmit: (
    event?: React.FormEvent<HTMLFormElement> | { preventDefault?: () => void },
    chatRequestOptions?: ChatRequestOptions
  ) => void;
  className?: string;
  isDragging: boolean;
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

  const resetHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = '98px';
    }
  };

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    'input',
    '',
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

  // Add file upload tracking state
  const [fileUploads, setFileUploads] = useState<Array<{
    id: string;
    fileName: string;
    progress: number;
    status: 'uploading' | 'processing' | 'complete' | 'error';
    error?: string;
  }>>([]);

  // Add state to track which spreadsheet is being previewed
  const [previewData, setPreviewData] = useState<{
    fileName: string;
    data: Array<Array<string | number>>;
  } | null>(null);

  const submitForm = useCallback(() => {
    window.history.replaceState({}, '', `/chat/${chatId}`);

    handleSubmit(undefined, {
      experimental_attachments: attachments,
    });

    setAttachments([]);
    setLocalStorageInput('');
    resetHeight();

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

  const addFileUpload = (fileName: string) => {
    const id = uuidv4();
    setFileUploads(prev => [...prev, {
      id,
      fileName,
      progress: 0,
      status: 'uploading'
    }]);
    return id;
  };

  const updateFileUpload = (id: string, updates: Partial<typeof fileUploads[0]>) => {
    setFileUploads(prev => 
      prev.map(upload => 
        upload.id === id ? { ...upload, ...updates } : upload
      )
    );
  };

  const removeFileUpload = (id: string) => {
    setFileUploads(prev => prev.filter(upload => upload.id !== id));
  };

  const uploadFile = async (file: File) => {
    const uploadId = addFileUpload(file.name);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('chatId', chatId);

    const isSpreadsheet = file.type.includes('spreadsheet') ||
      file.name.includes('.csv') ||
      file.name.includes('.xlsx') ||
      file.name.includes('.xls');

    try {
      // Update to uploading state
      updateFileUpload(uploadId, { progress: 20 });
      
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        // Update to processing state
        updateFileUpload(uploadId, { progress: 60, status: 'processing' });
        
        const data = await response.json();
        const { url, pathname, contentType } = data;

        // Update to complete state
        updateFileUpload(uploadId, { progress: 100, status: 'complete' });
        
        // Remove the status after a delay
        setTimeout(() => {
          removeFileUpload(uploadId);
        }, 2000);

        if (isSpreadsheet && data.tableData) {
          // If it's a spreadsheet, show the preview
          setPreviewData({
            fileName: file.name,
            data: data.tableData
          });
          
          return {
            url: data.url,
            name: data.path,
            contentType: file.type,
            tableData: data.tableData,
          };
        }

        return {
          url,
          name: pathname,
          contentType: contentType,
        };
      }
      const { error } = await response.json();
      updateFileUpload(uploadId, { 
        status: 'error', 
        progress: 100,
        error: error || 'Upload failed'
      });
      toast.error(error);
      return undefined;
    } catch (error) {
      updateFileUpload(uploadId, { 
        status: 'error', 
        progress: 100,
        error: 'Failed to upload file'
      });
      toast.error('Failed to upload file, please try again!');
      return undefined;
    }
  };

  // Add a function to show preview for an existing attachment
  const showSpreadsheetPreview = useCallback((attachment: FileAttachment) => {
    if (attachment.previewData) {
      setPreviewData({
        fileName: attachment.name?.split('/').pop() || 'Spreadsheet',
        data: attachment.previewData
      });
    }
  }, []);

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

      setUploadQueue(files.map((file) => file.name));

      try {
        const uploadPromises = files.map((file) => uploadFile(file));
        const uploadedAttachments = await Promise.all(uploadPromises);
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment) => attachment !== undefined,
        );

        setAttachments((currentAttachments) => [
          ...currentAttachments,
          ...successfullyUploadedAttachments,
        ]);
      } catch (error) {
        console.error('Error uploading files!', error);
      } finally {
        setUploadQueue([]);
      }
    },
    [setAttachments],
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
      });
    } catch (error) {
      console.error('Error removing attachment!', error);
    }
  }, [chatId]);


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

      {/* Add the file upload status indicators */}
      {fileUploads.length > 0 && (
        <div className="w-full space-y-2 mb-2">
          {fileUploads.map((upload) => (
            <UploadStatus
              key={upload.id}
              fileName={upload.fileName}
              progress={upload.progress}
              status={upload.status}
              error={upload.error}
              onDismiss={() => removeFileUpload(upload.id)}
            />
          ))}
        </div>
      )}

      {/* Add the data preview component */}
      {previewData && (
        <DataTablePreview
          data={previewData.data}
          fileName={previewData.fileName}
          onClose={() => setPreviewData(null)}
        />
      )}

      {(attachments.length > 0 || uploadQueue.length > 0) && (
        <div className={cn(
          "flex flex-row gap-2 overflow-x-scroll items-end",
          isDragging && "opacity-50"
        )}>
          {attachments.map((attachment) => (
            <PreviewAttachment 
              key={attachment.url} 
              attachment={attachment} 
              onRemove={() => removeAttachment(attachment)}
              // onPreview={attachment.tableData ? () => showSpreadsheetPreview(attachment) : undefined}
            />
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
        placeholder="Say somethin..."
        value={input}
        onChange={handleInput}
        className={cx(
          'min-h-[24px] max-h-[calc(75dvh)] overflow-hidden resize-none rounded-2xl !text-base bg-muted pb-10 dark:border-zinc-700',
          isDragging && 'scale-102 border-primary',
          className,
        )}
        rows={2}
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

      <div className="absolute bottom-0 p-2 w-fit flex flex-row justify-start">
        <AttachmentsButton fileInputRef={fileInputRef} isLoading={isLoading} />
      </div>

      <div className="absolute bottom-0 right-0 p-2 w-fit flex flex-row justify-end">
        {isLoading ? (
          <StopButton stop={stop} setMessages={setMessages} />
        ) : (
          <SendButton
            input={input}
            submitForm={submitForm}
            uploadQueue={uploadQueue}
          />
        )}
      </div>
    </div>
  );
}

export const MultimodalInput = memo(
  PureMultimodalInput,
  (prevProps, nextProps) => {
    if (prevProps.input !== nextProps.input) return false;
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (!equal(prevProps.attachments, nextProps.attachments)) return false;

    return true;
  },
);

function PureAttachmentsButton({
  fileInputRef,
  isLoading,
}: {
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  isLoading: boolean;
}) {
  return (
    <Button
      className="rounded-md rounded-bl-lg p-[7px] h-fit dark:border-zinc-700 hover:dark:bg-zinc-900 hover:bg-zinc-200"
      onClick={(event) => {
        event.preventDefault();
        fileInputRef.current?.click();
      }}
      disabled={isLoading}
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