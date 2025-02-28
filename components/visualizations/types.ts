import { Message } from 'ai';

export interface VisualizationData {
  id: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  documentId?: string;
  userId?: string;
  query?: string;
  chatId?: string;
}

export interface VisualizationMessage extends Message {
  visualizationData: VisualizationData;
  content: string;
}

export interface VisualizationConfig {
  type: 'scatter' | 'bar' | 'pie';
  data: any[];
  xField: string;
  yField: string;
  colorField?: string;
  groupBy?: string;
  title?: string;
  lineChart?: boolean;
}

export interface VisualizationResult {
  id: string;
  title: string;
  chatId: string;
  userId: string;
  config: VisualizationConfig;
  data: any[];
  created_at: string;
  updated_at: string;
} 