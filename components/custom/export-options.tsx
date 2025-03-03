import { 
    FileIcon, 
    TableIcon, 
    ImageIcon,
    FileTextIcon,
    DownloadIcon
  } from '@radix-ui/react-icons';
  
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import createClient from '@/lib/supabase/server';


interface ExportOptionsProps {
  onExport: (format: 'csv' | 'excel' | 'image' | 'pdf') => void;
  data: any;
  insights: Array<{
    title: string;
    description: string;  
    importance: 'high' | 'medium' | 'low';
  }>;
}

export const ExportOptions = ({ onExport, data, insights }: ExportOptionsProps) => {
  const handlePdfExport = async () => {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('Unauthorized');
    }
    try {
      const response = await fetch(`${process.env.ARENAS_SERVER}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          data,
          insights,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) throw new Error('Failed to generate report');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analysis-report-${new Date().toISOString()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('PDF generation error:', error);
    }
  };

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Export Results</h3>
      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={() => onExport('csv')}
          className="flex items-center gap-2"
        >
          <FileIcon className="h-4 w-4" />
          CSV
        </Button>
        <Button
          variant="outline"
          onClick={() => onExport('excel')}
          className="flex items-center gap-2"
        >
          <TableIcon className="h-4 w-4" />
          Excel
        </Button>
        <Button
          variant="outline"
          onClick={() => onExport('image')}
          className="flex items-center gap-2"
        >
          <ImageIcon className="h-4 w-4" />
          Image
        </Button>
        <Button
          variant="default"
          onClick={handlePdfExport}
          className="flex items-center gap-2"
        >
          <FileTextIcon className="h-4 w-4" />
          PDF Report
        </Button>
      </div>
    </Card>
  );
}; 