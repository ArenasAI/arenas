// components/visualizations/InteractivePlot.tsx
'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface DataPoint {
  timestamp: string;
  value: number;
  category: string;
}

interface InteractivePlotProps {
  initialData?: DataPoint[];
  title?: string;
  subscriptionChannel?: string;
}

export function InteractivePlot({ 
  initialData = [], 
  title = 'Real-time Data',
  subscriptionChannel = 'data_updates'
}: InteractivePlotProps) {
  const [data, setData] = useState<DataPoint[]>(initialData);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const supabase = createClient();

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(subscriptionChannel)
      .on('postgres_changes', 
        {
          event: '*',
          schema: 'public',
          table: 'data_points'
        }, 
        (payload) => {
          setData(currentData => [...currentData, payload.new as DataPoint]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [subscriptionChannel]);

  // Data transformation for plotting
  const plotData = React.useMemo(() => {
    const filteredData = selectedCategory 
      ? data.filter(d => d.category === selectedCategory)
      : data;

    return [{
      type: 'scatter',
      mode: 'lines+markers',
      x: filteredData.map(d => new Date(d.timestamp)),
      y: filteredData.map(d => d.value),
      marker: { color: 'blue' },
      name: selectedCategory || 'All Categories'
    }];
  }, [data, selectedCategory]);

  // Plot layout with dark/light mode support
  const layout: Partial<Plotly.Layout> = {
    title: title,
    autosize: true,
    height: 500,
    margin: { l: 50, r: 50, t: 50, b: 50 },
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    xaxis: {
      title: 'Time',
      gridcolor: 'rgba(128, 128, 128, 0.2)',
    },
    yaxis: {
      title: 'Value',
      gridcolor: 'rgba(128, 128, 128, 0.2)',
    },
    hovermode: 'closest'
  };

  const config: Partial<Plotly.Config> = {
    responsive: true,
    displayModeBar: true,
    modeBarButtonsToRemove: ['lasso2d', 'select2d']
  };

  // Get unique categories for filter
  const categories = [...new Set(data.map(d => d.category))];

  return (
    <div className="w-full space-y-4">
      {/* Category Filter */}
      <div className="flex gap-2 items-center">
        <span className="text-sm text-muted-foreground">Filter by category:</span>
        <select 
          className="bg-background border border-border rounded-md px-2 py-1"
          value={selectedCategory || ''}
          onChange={(e) => setSelectedCategory(e.target.value || null)}
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Plot */}
      <div className="w-full h-[500px] bg-background border border-border rounded-lg p-4">
        <Plot
          data={plotData}
          layout={layout}
          config={config}
          className="w-full h-full"
          onHover={(event) => {
            // Handle hover events
            console.log('Hover:', event);
          }}
          onClick={(event) => {
            // Handle click events
            console.log('Click:', event);
          }}
        />
      </div>

      {/* Stats or Additional Info */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-background border border-border rounded-lg">
          <h3 className="text-sm font-medium">Total Points</h3>
          <p className="text-2xl">{data.length}</p>
        </div>
        <div className="p-4 bg-background border border-border rounded-lg">
          <h3 className="text-sm font-medium">Average Value</h3>
          <p className="text-2xl">
            {(data.reduce((acc, d) => acc + d.value, 0) / data.length).toFixed(2)}
          </p>
        </div>
        <div className="p-4 bg-background border border-border rounded-lg">
          <h3 className="text-sm font-medium">Categories</h3>
          <p className="text-2xl">{categories.length}</p>
        </div>
      </div>
    </div>
  );
}
