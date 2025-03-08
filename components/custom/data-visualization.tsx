import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { Download, Info } from 'lucide-react';
import { toast } from 'sonner';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PieController,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  PieController,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface DataVisualizationProps {
  data: {
    headers: string[];
    rows: (string[] | Record<string, unknown>)[];
  };
  title?: string;
}

export function DataVisualization({ data, title = 'Data Visualization' }: DataVisualizationProps) {
  const [activeChart, setActiveChart] = useState('bar');
  const chartRef = useRef<ChartJS>(null);
  
  // Format data for chart
  const formatChartData = () => {
    if (!data || !data.rows || data.rows.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }

    // For simplicity, we'll use the first column as labels and second column as data
    // This could be enhanced with smarter column detection or user selection
    const isArrayOfArrays = Array.isArray(data.rows[0]);
    
    const labels = isArrayOfArrays 
      ? data.rows.map(row => (row as string[])[0] || 'Unnamed')
      : data.rows.map((row, i) => Object.values(row as Record<string, unknown>)[0]?.toString() || `Item ${i+1}`);
    
    const dataPoints = isArrayOfArrays
      ? data.rows.map(row => {
          const val = (row as string[])[1];
          return typeof val === 'string' ? parseFloat(val) || 0 : (val || 0);
        })
      : data.rows.map(row => {
          const val = Object.values(row as Record<string, unknown>)[1];
          return typeof val === 'string' ? parseFloat(val) || 0 : (Number(val) || 0);
        });
    
    // Generate random colors for pie/bar charts
    const backgroundColors = data.rows.map(() => 
      `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.6)`
    );

    return {
      labels,
      datasets: [
        {
          label: data.headers?.[1] || 'Value',
          data: dataPoints,
          backgroundColor: backgroundColors,
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  const chartData = formatChartData();

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: title,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.parsed.y || context.parsed || 0}`;
          }
        }
      }
    },
  };

  const downloadChart = () => {
    if (chartRef.current) {
      const url = chartRef.current.toBase64Image();
      const link = document.createElement('a');
      link.download = `${title.replace(/\s+/g, '-').toLowerCase()}-${activeChart}-chart.png`;
      link.href = url;
      link.click();
      toast.success('Chart downloaded successfully');
    }
  };

  return (
    <div className="flex flex-col p-4 border rounded-lg bg-card w-full max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">{title}</h3>
        <Button onClick={downloadChart} variant="outline" size="sm">
          <Download size={16} className="mr-2" />
          Download
        </Button>
      </div>

      <Tabs value={activeChart} onValueChange={setActiveChart} className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="bar">Bar Chart</TabsTrigger>
          <TabsTrigger value="line">Line Chart</TabsTrigger>
          <TabsTrigger value="pie">Pie Chart</TabsTrigger>
        </TabsList>
        
        <TabsContent value="bar" className="h-64">
          <Bar 
            data={chartData} 
            options={chartOptions}
            ref={chartRef as any}
          />
        </TabsContent>
        
        <TabsContent value="line" className="h-64">
          <Line 
            data={chartData} 
            options={chartOptions}
            ref={chartRef as any}
          />
        </TabsContent>
        
        <TabsContent value="pie" className="h-64">
          <Pie 
            data={chartData} 
            options={chartOptions}
            ref={chartRef as any}
          />
        </TabsContent>
      </Tabs>
      
      <div className="flex items-center mt-4 text-sm text-muted-foreground">
        <Info size={16} className="mr-2" />
        <span>Hover over chart elements to see detailed data</span>
      </div>
    </div>
  );
} 