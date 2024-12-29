import { Card } from '@/components/ui/card';

interface Insight {
  title: string;
  description: string;
  importance: 'high' | 'medium' | 'low';
}

interface InsightsPanelProps {
  insights: Insight[];
}

export const InsightsPanel = ({ insights }: InsightsPanelProps) => {
  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Key Insights</h3>
      <div className="space-y-4">
        {insights.map((insight, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg border ${
              insight.importance === 'high'
                ? 'border-red-200 bg-red-50'
                : insight.importance === 'medium'
                ? 'border-yellow-200 bg-yellow-50'
                : 'border-green-200 bg-green-50'
            }`}
          >
            <h4 className="font-medium">{insight.title}</h4>
            <p className="text-sm text-muted-foreground">{insight.description}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}; 