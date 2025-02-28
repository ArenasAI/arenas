'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { VisualizationConfig } from './types';
import { PlotType } from 'plotly.js';

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import('react-plotly.js'), { 
  ssr: false,
  loading: () => <Skeleton className="w-full h-[500px]" />
});

interface DataVisualizationProps {
  data: Plotly.Data[];
  layout?: Partial<Plotly.Layout>;
  config?: Partial<Plotly.Config>;
  className?: string;
  onPlotUpdate?: (figure: { data: Plotly.Data[], layout: Partial<Plotly.Layout> }) => void;
}

export function DataVisualization({ 
  data, 
  layout = {}, 
  config = {}, 
  className = '',
  onPlotUpdate
}: DataVisualizationProps) {
  const [isMounted, setIsMounted] = useState(false);
  
  // Default layout with theme support
  const defaultLayout: Partial<Plotly.Layout> = {
    autosize: true,
    margin: { l: 50, r: 50, t: 50, b: 50 },
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: {
      family: 'var(--font-sans)',
    },
    xaxis: {
      gridcolor: 'rgba(128, 128, 128, 0.2)',
    },
    yaxis: {
      gridcolor: 'rgba(128, 128, 128, 0.2)',
    },
    hovermode: 'closest',
    ...layout
  };

  // Default config
  const defaultConfig: Partial<Plotly.Config> = {
    responsive: true,
    displayModeBar: true,
    modeBarButtonsToAdd: ['toImage'],
    modeBarButtonsToRemove: ['lasso2d', 'select2d'],
    ...config
  };

  // Handle client-side only rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <Skeleton className="w-full h-[500px]" />;
  }

  return (
    <Plot
      data={data}
      layout={defaultLayout}
      config={defaultConfig}
      className={`w-full h-full ${className}`}
      onUpdate={(figure) => {
        if (onPlotUpdate) {
          onPlotUpdate(figure);
        }
      }}
    />
  );
}

// Export a helper function to generate plots from data
export function generatePlotFromData<T extends Record<string, any>>(
  data: T[], 
  xField: keyof T, 
  yField: keyof T, 
  type: PlotType,
  options: {
    title?: string;
    colorField?: keyof T;
    groupBy?: keyof T;
  } = {}
): { data: Plotly.Data[]; layout: Partial<Plotly.Layout> } {
  const { title, colorField, groupBy } = options;
  
  if (!data || data.length === 0) {
    return {
      data: [],
      layout: { title: title || 'No data available' }
    };
  }
  
  if (groupBy) {
    // Group data by the specified field
    const groups = data.reduce((acc, item) => {
      const key = String(item[groupBy]);
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {} as Record<string, T[]>);
    
    // Create a trace for each group
    return {
      data: Object.entries(groups).map(([key, items]) => ({
        type,
        mode: (type === 'scatter' || type === 'scattergl') ? 'lines+markers' : undefined,
        name: key,
        x: items.map(item => item[xField]),
        y: items.map(item => item[yField]),
        marker: { color: colorField ? items.map(item => item[colorField]) : undefined }
      })),
      layout: {
        title,
        xaxis: { title: String(xField) },
        yaxis: { title: String(yField) }
      }
    };
  }
  
  // Simple plot without grouping
  return {
    data: [{
      type,
      mode: (type === 'scatter' || type === 'scattergl') ? 'lines+markers' : undefined,
      x: data.map(item => item[xField]),
      y: data.map(item => item[yField]),
      marker: { color: colorField ? data.map(item => item[colorField]) : undefined }
    }],
    layout: {
      title,
      xaxis: { title: String(xField) },
      yaxis: { title: String(yField) }
    }
  };
}
