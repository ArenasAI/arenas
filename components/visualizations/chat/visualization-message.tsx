// components/Chat/VisualizationMessage.tsx
import { useEffect, useState } from 'react';
import { ChartContainer } from './chart-container';

interface VisualizationMessageProps {
  content: {
    id: string;
    chartType: string;
    data: any[];
    options: any;
  };
}

export const VisualizationMessage = ({ content }: VisualizationMessageProps) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="visualization-message">
      {!isVisible ? (
        <button 
          onClick={() => setIsVisible(true)}
          className="show-visualization-btn"
        >
          Show Visualization
        </button>
      ) : (
        <ChartContainer 
          data={content.data}
          type={content.chartType}
          options={content.options}
        />
      )}

      <style jsx>{`
        .visualization-message {
          margin: 1rem 0;
        }

        .show-visualization-btn {
          padding: 0.5rem 1rem;
          background: #0070f3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};
