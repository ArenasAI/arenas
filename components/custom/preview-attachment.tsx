import { Attachment } from 'ai';
import { X, FileText, FileSpreadsheet, Eye } from 'lucide-react';
import Image from 'next/image';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { memo } from 'react';

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

interface PreviewAttachmentProps {
  attachment: Attachment & {
    preview?: PreviewData;
  };
  isUploading?: boolean;
  onRemove?: () => void;
  onPreview?: () => void;
}

const getDefaultPreview = (attachment: Attachment): PreviewData => ({
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
});

export const PreviewAttachment = memo(function PreviewAttachment({ 
  attachment, 
  isUploading = false, 
  onRemove,
  onPreview
}: PreviewAttachmentProps) {
  const preview = attachment.preview || getDefaultPreview(attachment);
  const filename = preview.name.split('/').pop() || 'File';

  return (
    <div className={cn(
      "relative group flex flex-col items-center justify-center p-2 border rounded-md bg-muted/50 min-w-[100px] max-w-[150px]",
      isUploading && "opacity-70"
    )}>
      <div className="absolute top-1 right-1 flex gap-1">
        {onPreview && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-70 hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
          >
            <Eye size={14} />
          </Button>
        )}
        
        {onRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-70 hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <X size={14} />
          </Button>
        )}
      </div>
      
      <div className="flex items-center justify-center h-10 w-10 mb-2">
        {preview.type === 'image' ? (
          <div className="relative w-full h-full">
            <Image
              src={preview.thumbnail || attachment.url}
              alt={filename}
              fill
              className="object-cover rounded-md"
              sizes="(max-width: 150px) 100vw, 150px"
            />
          </div>
        ) : (
          preview.icon === 'FileSpreadsheet' ? (
            <FileSpreadsheet className="h-8 w-8 text-blue-500" />
          ) : (
            <FileText className="h-8 w-8 text-gray-500" />
          )
        )}
      </div>
      
      <div className="text-xs text-center truncate w-full">
        {filename}
      </div>
      
      {isUploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-md">
          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      )}
    </div>
  );
});
