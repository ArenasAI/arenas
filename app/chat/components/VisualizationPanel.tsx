import React from 'react';

interface VisualizationPanelProps {
  output: string;
}

const VisualizationPanel: React.FC<VisualizationPanelProps> = ({ output }) => {
  return (
    <div className="mt-4 p-4 bg-white rounded-lg shadow">
      {/* If the output is an image URL */}
      {output.match(/\.(jpeg|jpg|gif|png)$/) ? (
        <img src={output} alt="Visualization" className="max-w-full h-auto" />
      ) : (
        /* If the output is text/data */
        <pre className="whitespace-pre-wrap">{output}</pre>
      )}
    </div>
  );
};

export default VisualizationPanel;
