import { AnalysisResults } from './analysis-results';
import { FileConverter } from './file-converter';

interface ChatAnalysisProps {
  analysis: {
    data: any;
    insights: Array<{
      title: string;
      description: string;
      importance: 'high' | 'medium' | 'low';
    }>;
  };
}

export const ChatAnalysis = ({ analysis }: ChatAnalysisProps) => {
  return (
    <div className="space-y-6">
      <AnalysisResults 
        data={analysis.data} 
        insights={analysis.insights} 
      />
      <FileConverter />
    </div>
  );
}; 