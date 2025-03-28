'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, FileSpreadsheet, Image as ImageIcon, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface FileItem {
  id: string;
  name: string;
  type: string;
  size: number;
  lastModified: string;
  url: string;
}

export function FileManager() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const saveFiles = (updatedFiles: FileItem[]) => {
    localStorage.setItem('userFiles', JSON.stringify(updatedFiles));
    setFiles(updatedFiles);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles) return;

    setIsUploading(true);
    const newFiles: FileItem[] = [];

    try {
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        const reader = new FileReader();

        reader.onload = (e) => {
          const fileItem: FileItem = {
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            type: file.type,
            size: file.size,
            lastModified: new Date(file.lastModified).toISOString(),
            url: e.target?.result as string,
          };
          newFiles.push(fileItem);
        };

        reader.readAsDataURL(file);
      }

      // Wait for all files to be processed
      await Promise.all(
        newFiles.map(
          (file) =>
            new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.readAsDataURL(new Blob([file.url]));
            })
        )
      );

      saveFiles([...files, ...newFiles]);
      toast.success(`${newFiles.length} file(s) have been uploaded.`);
    } catch (error) {
      toast.error('Error uploading files. Please try again.', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = (fileId: string) => {
    const updatedFiles = files.filter((file) => file.id !== fileId);
    saveFiles(updatedFiles);
    toast.success('File deleted successfully.');
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <ImageIcon className="h-6 w-6" />;
    if (fileType.includes('spreadsheet') || fileType.includes('csv')) return <FileSpreadsheet className="h-6 w-6" />;
    return <FileText className="h-6 w-6" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Input
          type="file"
          multiple
          onChange={handleFileUpload}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload">
          <Button
            variant="outline"
            className={cn('cursor-pointer', isUploading && 'opacity-50')}
            disabled={isUploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? 'Uploading...' : 'Upload Files'}
          </Button>
        </label>
      </div>

      <Card className="p-4">
        <ScrollArea className="h-[600px]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((file) => (
              <Card key={file.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getFileIcon(file.type)}
                    <div>
                      <p className="font-medium truncate max-w-[200px]">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteFile(file.id)}
                    className="h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {file.type.startsWith('image/') && (
                  <div className="mt-4">
                    <Image
                      src={file.url}
                      alt={file.name}
                      width={1000}
                      height={1000}
                      className="w-full h-32 object-contain rounded-md"
                    />
                  </div>
                )}
              </Card>
            ))}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
} 