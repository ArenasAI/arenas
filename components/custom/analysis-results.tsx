import { ExportOptions } from './export-options';
import { InsightsPanel } from './insights-panel';
import { VisualizationPanel } from './visualization-panel';

interface AnalysisResultsProps {
  data: any; // Replace with your data type
  insights: Array<{
    title: string;
    description: string;
    importance: 'high' | 'medium' | 'low';
  }>;
}

export const AnalysisResults = ({ data, insights }: AnalysisResultsProps) => {
  const handleExport = (format: 'csv' | 'excel' | 'image' | 'pdf') => {
    // Implement export logic
    console.log(`Exporting as ${format}`);
  };

  return (
    <div className="space-y-6">
      <VisualizationPanel data={data} />
      <InsightsPanel insights={insights} />
      <ExportOptions onExport={handleExport} data={data} insights={insights} />
    </div>
  );
}; 