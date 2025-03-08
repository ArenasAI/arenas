import React from 'react';
import { UploadStatus } from './upload-status';

export type FileUpload = {
  id: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
};

interface UploadStatusContainerProps {
  uploads: FileUpload[];
  onDismiss: (id: string) => void;
}

export function UploadStatusContainer({ uploads, onDismiss }: UploadStatusContainerProps) {
  if (uploads.length === 0) return null;
  
  return (
    <div className="w-full space-y-2 mb-2">
      {uploads.map((upload) => (
        <UploadStatus
          key={upload.id}
          fileName={upload.fileName}
          progress={upload.progress}
          status={upload.status}
          error={upload.error}
          onDismiss={() => onDismiss(upload.id)}
        />
      ))}
    </div>
  );
}
