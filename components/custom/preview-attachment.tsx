import { Attachment } from 'ai';
import { LoaderIcon, XIcon } from './icons';
import { X, FileText, Image, FileSpreadsheet, Eye } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

interface PreviewAttachmentProps {
  attachment: Attachment;
  isUploading?: boolean;
  onRemove?: () => void;
  onPreview?: () => void;
}

export function PreviewAttachment({ 
  attachment, 
  isUploading = false, 
  onRemove,
  onPreview
}: PreviewAttachmentProps) {
  const isImage = attachment.contentType?.startsWith('image/');
  const isSpreadsheet = 
    attachment.contentType?.includes('spreadsheet') || 
    attachment.name?.includes('.csv') || 
    attachment.name?.includes('.xlsx') || 
    attachment.name?.includes('.xls')
    // !!attachment.tableData;
  
  const filename = attachment.name?.split('/').pop() || 'File';

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
        {isImage ? (
          <Image size={24} />
        ) : isSpreadsheet ? (
          <FileSpreadsheet size={24} />
        ) : (
          <FileText size={24} />
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
}
