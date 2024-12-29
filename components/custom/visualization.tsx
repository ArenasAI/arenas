import dynamic from 'next/dynamic';
import { Data } from 'plotly.js';
import { useState } from 'react';


// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface DataPoint {
  x: number | string;
  y: number;
}

interface DataVisualizationProps {
  data: DataPoint[];
  type: 'line' | 'bar' | 'scatter';
  title?: string;
  xLabel?: string;
  yLabel?: string;
}

export const DataVisualization = ({
  data,
  type,
  title = '',
  xLabel = '',
  yLabel = '',
}: DataVisualizationProps) => {
  const [isLoading, setIsLoading] = useState(true);

  const plotData: Data[] = [{
    x: data.map(point => point.x),
    y: data.map(point => point.y),
    type: type as any,
    mode: type === 'scatter' ? 'markers' : undefined,
  }];

  const layout = {
    title: title,
    xaxis: {
      title: xLabel,
    },
    yaxis: {
      title: yLabel,
    },
    margin: { t: 30 },
  };

  return (
    <div className="w-full h-[400px] relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50">
          <div className="animate-spin rounded-full size-8 border-b-2 border-primary"></div>
        </div>
      )}
      <Plot
        data={plotData}
        layout={layout}
        onAfterPlot={() => setIsLoading(false)}
        className="size-full"
        config={{ responsive: true }}
      />
    </div>
  );
}; 