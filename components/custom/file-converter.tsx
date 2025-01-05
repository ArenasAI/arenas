import { 
    FileIcon, 
    UploadIcon,
    DownloadIcon 
  } from '@radix-ui/react-icons';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ConversionFormat {
  from: string;
  to: string[];
}

const SUPPORTED_FORMATS: ConversionFormat[] = [
  {
    from: 'svg',
    to: ['png', 'jpg', 'pdf']
  },
  {
    from: 'csv',
    to: ['xlsx', 'json', 'pdf']
  },
  {
    from: 'xlsx',
    to: ['csv', 'json', 'pdf']
  },
  {
    from: 'jpeg',
    to: ['png', 'svg']
  },
  {
    from: 'heic',
    to: ['png', 'svg', 'jpeg']
  }

];

export const FileConverter = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetFormat, setTargetFormat] = useState<string>('');
  const [isConverting, setIsConverting] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setTargetFormat(''); // Reset target format when new file is selected
    }
  };

  const getSourceFormat = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const getAvailableFormats = (sourceFormat: string) => {
    return SUPPORTED_FORMATS.find(format => 
      format.from === sourceFormat
    )?.to || [];
  };

  const handleConvert = async () => {
    if (!selectedFile || !targetFormat) return;

    setIsConverting(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('targetFormat', targetFormat);

      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Conversion failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `converted.${targetFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Conversion error:', error);
      // Add error handling/notification here
    } finally {
      setIsConverting(false);
    }
  };

  const sourceFormat = selectedFile ? getSourceFormat(selectedFile.name) : '';
  const availableFormats = sourceFormat ? getAvailableFormats(sourceFormat) : [];

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">File Converter</h3>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Input
            type="file"
            onChange={handleFileSelect}
            className="flex-1"
            accept={SUPPORTED_FORMATS.map(f => `.${f.from}`).join(',')}
          />
          {selectedFile && (
            <Select
              value={targetFormat}
              onValueChange={setTargetFormat}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Convert to" />
              </SelectTrigger>
              <SelectContent>
                {availableFormats.map(format => (
                  <SelectItem key={format} value={format}>
                    {format.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        {selectedFile && targetFormat && (
          <Button
            onClick={handleConvert}
            disabled={isConverting}
            className="w-full flex items-center gap-2"
          >
            {isConverting ? (
              <>
                <UploadIcon className="animate-spin" />
                Converting...
              </>
            ) : (
              <>
                <DownloadIcon />
                Convert to {targetFormat.toUpperCase()}
              </>
            )}
          </Button>
        )}
      </div>
    </Card>
  );
}; 