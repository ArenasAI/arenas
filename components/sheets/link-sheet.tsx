'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { extractSpreadsheetId, isValidGoogleSheetsUrl } from '@/services/google-sheets';

interface LinkSheetProps {
  onSheetLinked?: (spreadsheetId: string) => void;
}

export function LinkSheet({ onSheetLinked }: LinkSheetProps) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidGoogleSheetsUrl(url)) {
      toast.error('Please enter a valid Google Sheets URL');
      return;
    }

    const spreadsheetId = extractSpreadsheetId(url);
    if (!spreadsheetId) {
      toast.error('Could not extract spreadsheet ID from URL');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/sheets/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spreadsheetId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to validate sheet access');
      }

      toast.success('Successfully linked Google Sheet');
      onSheetLinked?.(spreadsheetId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to link sheet');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Input
          type="url"
          placeholder="Enter Google Sheets URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
        <p className="text-sm text-muted-foreground">
          Make sure the sheet is shared with edit access
        </p>
      </div>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Validating...' : 'Link Sheet'}
      </Button>
    </form>
  );
} 