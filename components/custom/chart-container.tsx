'use client';

import React from "react";
import dynamic from 'next/dynamic';

// Import Plotly dynamically with no SSR
const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => <div>Loading chart...</div>
});

interface ChartProps {
  data: Plotly.Data[];
  layout: Partial<Plotly.Layout>;
}

const Chart: React.FC<ChartProps> = ({ data, layout }) => {
  return (
    <div className="w-full h-[500px]">
      <Plot
        data={data}
        layout={{
          ...layout,
          autosize: true,
          margin: { l: 50, r: 50, t: 50, b: 50 },
        }}
        useResizeHandler={true}
        style={{ width: "800px", height: "600px" }}
        config={{ displayModeBar: false }}
      />
    </div>
  );
};

export default Chart;