import { Sandbox } from '@e2b/code-interpreter';

export type ChartType = 'bar' | 'line' | 'scatter' | 'pie' | 'box' | 'violin' | 'bubble' | 'heatmap' | 'choropleth' | 'treemap' | 'funnel' | 'waterfall' | 'candlestick' | 'area' | 'histogram' | 'pie';

export interface ChartResult {
  type: 'bar' | 'line' | 'scatter' | 'pie' | 'heatmap';
  title: string;
  elements?: Array<{
    label?: string;
    value?: number;
    x?: number;
    y?: number;
  }>;
  x_label?: string;  // For scatter plots
  y_label?: string;  // For scatter plots
  image?: string;    // For heatmaps and other image-based plots
}

export async function runVisualizationCode(
  sandbox: Sandbox,
  code: string,
): Promise<ChartResult[]> {
  const execution = await sandbox.runCode(code);
  
  if (execution.error) {
    throw new Error(`Code execution failed: ${JSON.stringify(execution.error)}`);
  }

  const charts: ChartResult[] = [];
  
  for (const result of execution.results) {
    if (result.chart) {
      charts.push(result.chart as ChartResult);
    }
  }

  return charts;
}