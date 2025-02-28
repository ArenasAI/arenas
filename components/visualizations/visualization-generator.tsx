'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataVisualization, generatePlotFromData } from './plot';
import Papa from 'papaparse';
import { 
  processCSVData, 
  processExcelData, 
  getNumericColumns, 
  getDateColumns, 
  getCategoricalColumns,
  suggestVisualization,
  getDataContextFromPinecone
} from './data-processor';
import { Loader2, Download, RefreshCw } from 'lucide-react';
import { useCreateVisualization } from '@/lib/hooks/use-visualizations';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

interface VisualizationGeneratorProps {
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  documentId?: string;
  userId?: string;
  query?: string;
  chatId?: string;
}

export function VisualizationGenerator({
  fileUrl,
  fileName,
  fileType,
  documentId,
  userId,
  query,
  chatId
}: VisualizationGeneratorProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plotConfig, setPlotConfig] = useState<{
    type: 'scatter' | 'bar' | 'line' | 'pie';
    xField: string;
    yField: string;
    colorField?: string;
    groupBy?: string;
  } | null>(null);
  
  const [numericColumns, setNumericColumns] = useState<string[]>([]);
  const [dateColumns, setDateColumns] = useState<string[]>([]);
  const [categoricalColumns, setCategoricalColumns] = useState<string[]>([]);
  
  const { mutate: createVisualization, isPending: isSaving } = useCreateVisualization();
  const { data: session } = useSession();
  const user = session?.user;
  
  // Load data from file or Pinecone
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      
      try {
        let processedData: any[] = [];
        
        // If we have a file URL, fetch and process the file
        if (fileUrl) {
          const response = await fetch(fileUrl);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.statusText}`);
          }
          
          if (fileType?.includes('csv') || fileName?.endsWith('.csv')) {
            const text = await response.text();
            processedData = processCSVData(text);
          } else if (
            fileType?.includes('spreadsheet') || 
            fileName?.endsWith('.xlsx') || 
            fileName?.endsWith('.xls')
          ) {
            const buffer = await response.arrayBuffer();
            processedData = processExcelData(buffer);
          }
        } 
        // If we have a document ID and user ID, fetch data from Pinecone
        else if (documentId && userId && query) {
          processedData = await getDataContextFromPinecone(query, documentId, userId);
        }
        
        if (processedData.length === 0) {
          throw new Error('No data found or data is empty');
        }
        
        setData(processedData);
        
        // Infer column types
        setNumericColumns(getNumericColumns(processedData));
        setDateColumns(getDateColumns(processedData));
        setCategoricalColumns(getCategoricalColumns(processedData));
        
        // Suggest visualization
        const suggestion = suggestVisualization(processedData);
        setPlotConfig(suggestion);
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [fileUrl, fileName, fileType, documentId, userId, query]);
  
  
  // Generate plot data and layout
  const plotData = plotConfig && data.length > 0 
    ? generatePlotFromData(
        data, 
        plotConfig.xField, 
        plotConfig.yField, 
        plotConfig.type === 'line' ? 'scatter' : plotConfig.type, 
        { 
          title: `${plotConfig.yField} by ${plotConfig.xField}`,
          colorField: plotConfig.colorField,
          groupBy: plotConfig.groupBy
        }
      ) 
    : null;
  
  // Download data as CSV
  const downloadCSV = () => {
    if (!data.length) return;
    
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${fileName || 'data'}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Download plot as PNG
  const downloadPlot = () => {
    const plotElement = document.querySelector('.js-plotly-plot');
    if (plotElement) {
      // @ts-ignore - Plotly is attached to the window
      window.Plotly.downloadImage(plotElement, {
        format: 'png',
        filename: `${fileName || 'visualization'}_export`,
      });
    }
  };
  
  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading visualization...
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Processing data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Error Loading Visualization</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  if (!data.length || !plotConfig) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>No Data Available</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No data is available for visualization. Please upload a CSV or Excel file.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Data Visualization</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={downloadCSV}>
            <Download className="h-4 w-4 mr-2" />
            Data
          </Button>
          <Button variant="outline" size="sm" onClick={downloadPlot}>
            <Download className="h-4 w-4 mr-2" />
            Image
          </Button>
          <Button 
            className="ml-2"
            onClick={() => {
              if (!user) {
                toast.error('You must be logged in to save visualizations');
                return;
              }
              
              createVisualization({
                chatId: chatId || '',
                title: plotConfig.title || `${plotConfig.yField} by ${plotConfig.xField}`,
                config: {
                  ...plotConfig,
                  data: data
                },
                data: data,
                documentId
              }, {
                onSuccess: () => {
                  toast.success('Visualization saved successfully');
                },
                onError: (error) => {
                  toast.error(`Failed to save visualization: ${error.message}`);
                }
              });
            }}
            disabled={isSaving || !data.length}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Visualization'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="visualization" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="visualization">Visualization</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="visualization" className="h-[500px]">
            {plotData && (
              <DataVisualization 
                data={plotData.data} 
                layout={plotData.layout} 
              />
            )}
          </TabsContent>
          
          <TabsContent value="settings">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Chart Type</label>
                  <Select 
                    value={plotConfig.type} 
                    onValueChange={(value: any) => setPlotConfig({...plotConfig, type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select chart type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scatter">Scatter Plot</SelectItem>
                      <SelectItem value="line">Line Chart</SelectItem>
                      <SelectItem value="bar">Bar Chart</SelectItem>
                      <SelectItem value="pie">Pie Chart</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">X Axis</label>
                  <Select 
                    value={plotConfig.xField} 
                    onValueChange={(value) => setPlotConfig({...plotConfig, xField: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select X axis" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(data[0]).map(key => (
                        <SelectItem key={key} value={key}>{key}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Y Axis</label>
                  <Select 
                    value={plotConfig.yField} 
                    onValueChange={(value) => setPlotConfig({...plotConfig, yField: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Y axis" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(data[0]).map(key => (
                        <SelectItem key={key} value={key}>{key}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Color By (Optional)</label>
                  <Select 
                    value={plotConfig.colorField || ''} 
                    onValueChange={(value) => setPlotConfig({...plotConfig, colorField: value || undefined})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select color field" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {categoricalColumns.map(key => (
                        <SelectItem key={key} value={key}>{key}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Group By (Optional)</label>
                  <Select 
                    value={plotConfig.groupBy || ''} 
                    onValueChange={(value) => setPlotConfig({...plotConfig, groupBy: value || undefined})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select grouping field" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {categoricalColumns.map(key => (
                        <SelectItem key={key} value={key}>{key}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  className="mt-4 w-full"
                  onClick={() => {
                    const suggestion = suggestVisualization(data);
                    setPlotConfig(suggestion);
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Auto-suggest Visualization
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 