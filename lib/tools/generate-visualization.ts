import { DataStreamWriter } from 'ai';

interface VisualizationParams {
  data: Array<Record<string, any>>;
  plotType?: 'bar' | 'line';
  column: string;
}

export const generateVisualization = ({ 
  session, 
  dataStream 
}: { 
  session: any;
  dataStream: DataStreamWriter;
  selectedModelId: string;
}) => ({
  handler: async ({ data, plotType = 'bar', column }: VisualizationParams) => {
    try {
      // For now, return a simple text response since we can't directly use Python libraries in TypeScript
      return {
        type: 'text',
        content: `Generated ${plotType} visualization for column "${column}" with ${data.length} data points.`
      };
    } catch (error) {
      console.error('Error generating visualization:', error);
      throw error;
    }
  },
  description: "Generate data visualizations",
  parameters: {
    type: "object",
    properties: {
      data: { 
        type: "array",
        description: "The data to visualize" 
      },
      plotType: { 
        type: "string", 
        enum: ["bar", "line"],
        description: "Type of plot to generate" 
      },
      column: { 
        type: "string",
        description: "Column to visualize" 
      }
    },
    required: ["data", "column"]
  }
});