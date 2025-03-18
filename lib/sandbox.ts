import { Sandbox } from '@e2b/code-interpreter';
import BarChart from '@e2b/code-interpreter';
import LineChart from '@e2b/code-interpreter';
import PieChart from '@e2b/code-interpreter';
import ScatterPlot from '@e2b/code-interpreter';


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

export async function createSandbox(language: 'python' | 'r' | 'julia') {
    if (!process.env.E2B_API_KEY) {
        throw new Error('E2B_API_KEY is not set');
    }

    const template = language === 'python' ? 'Python' : 
                    language === 'r' ? 'R' : 'Julia';
                    
    const sandbox = await Sandbox.create(template, {
        apiKey: process.env.E2B_API_KEY
    });
    return sandbox;
}

export async function runVisualizationCode(
  sandbox: Sandbox,
  code: string,
  language: 'python' | 'r' | 'julia',
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