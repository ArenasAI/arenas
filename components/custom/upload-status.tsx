import React from 'react';
import { Progress } from '@/components/ui/progress';
import { X } from 'lucide-react';

interface UploadStatusProps {
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
  onDismiss: () => void;
}

export function UploadStatus({ 
  fileName, 
  progress, 
  status, 
  error, 
  onDismiss 
}: UploadStatusProps) {
  return (
    <div className="w-full p-2 mb-2 bg-secondary/50 rounded-md">
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center">
          <span className="text-sm font-medium truncate max-w-[200px]">
            {fileName}
          </span>
          <span className="ml-2 text-xs text-muted-foreground">
            {status === 'uploading' && 'Uploading...'}
            {status === 'processing' && 'Processing...'}
            {status === 'complete' && 'Complete'}
            {status === 'error' && 'Error'}
          </span>
        </div>
        <button 
          onClick={onDismiss}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
      
      <Progress 
        value={progress} 
        className={`h-1.5 ${status === 'error' ? 'bg-destructive/30' : ''}`}
      />
      
      {error && (
        <p className="text-xs text-destructive mt-1">{error}</p>
      )}
    </div>
  );
}
