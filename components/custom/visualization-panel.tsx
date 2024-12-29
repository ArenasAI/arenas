import { Card } from '@/components/ui/card';

import { DataVisualization } from './visualization';

interface VisualizationPanelProps {
  data: any; // Replace with your data type
}

export const VisualizationPanel = ({ data }: VisualizationPanelProps) => {
  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Data Visualization</h3>
      <div className="space-y-4">
        <DataVisualization
          data={data}
          type="line"
          title="Trend Analysis"
          xLabel="Time"
          yLabel="Value"
        />
      </div>
    </Card>
  );
}; 