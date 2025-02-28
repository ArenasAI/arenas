import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { createPineconeClient } from '@/lib/pinecone-browser';

export function processCSVData(csvText: string): any[] {
  const result = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  return result.data as any[];
}

export function processExcelData(buffer: ArrayBuffer): any[] {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  return XLSX.utils.sheet_to_json(worksheet);
}

export function inferColumnTypes(data: any[]): Record<string, string> {
  if (!data.length) return {};
  
  const sample = data[0];
  const columnTypes: Record<string, string> = {};
  
  Object.keys(sample).forEach(key => {
    const values = data.slice(0, 10).map(row => row[key]);
    const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
    
    if (nonNullValues.length === 0) {
      columnTypes[key] = 'unknown';
    } else if (nonNullValues.every(v => !isNaN(Number(v)))) {
      columnTypes[key] = 'number';
    } else if (nonNullValues.every(v => !isNaN(Date.parse(String(v))))) {
      columnTypes[key] = 'date';
    } else {
      columnTypes[key] = 'string';
    }
  });
  
  return columnTypes;
}

export function getNumericColumns(data: any[]): string[] {
  const columnTypes = inferColumnTypes(data);
  return Object.entries(columnTypes)
    .filter(([_, type]) => type === 'number')
    .map(([key]) => key);
}

export function getDateColumns(data: any[]): string[] {
  const columnTypes = inferColumnTypes(data);
  return Object.entries(columnTypes)
    .filter(([_, type]) => type === 'date')
    .map(([key]) => key);
}

// Get categorical columns from data
export function getCategoricalColumns(data: any[]): string[] {
  const columnTypes = inferColumnTypes(data);
  return Object.entries(columnTypes)
    .filter(([_, type]) => type === 'string')
    .map(([key]) => key);
}

// Get document context from Pinecone
export async function getDataContextFromPinecone(
  query: string,
  documentId: string,
  userId: string
): Promise<any[]> {
  // Only run this on the server
  if (typeof window !== 'undefined') {
    console.warn('Pinecone operations can only be performed on the server side');
    return [];
  }
  
  try {
    // Use server-side data fetching instead
    const response = await fetch('/api/pinecone/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        documentId,
        userId,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch data from Pinecone');
    }
    
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error querying Pinecone:', error);
    return [];
  }
}

// Suggest visualization based on data
export function suggestVisualization(data: any[]): {
  type: 'scatter' | 'bar' | 'line' | 'pie';
  xField: string;
  yField: string;
  colorField?: string;
} {
  const numericColumns = getNumericColumns(data);
  const dateColumns = getDateColumns(data);
  const categoricalColumns = getCategoricalColumns(data);
  
  if (dateColumns.length > 0 && numericColumns.length > 0) {
    // Time series data - use line chart
    return {
      type: 'line',
      xField: dateColumns[0],
      yField: numericColumns[0],
      colorField: categoricalColumns.length > 0 ? categoricalColumns[0] : undefined
    };
  } else if (categoricalColumns.length > 0 && numericColumns.length > 0) {
    // Categorical vs numeric - use bar chart
    return {
      type: 'bar',
      xField: categoricalColumns[0],
      yField: numericColumns[0],
      colorField: categoricalColumns.length > 1 ? categoricalColumns[1] : undefined
    };
  } else if (numericColumns.length >= 2) {
    // Numeric vs numeric - use scatter plot
    return {
      type: 'scatter',
      xField: numericColumns[0],
      yField: numericColumns[1],
      colorField: categoricalColumns.length > 0 ? categoricalColumns[0] : undefined
    };
  } else if (categoricalColumns.length > 0 && numericColumns.length > 0) {
    // Single categorical - use pie chart
    return {
      type: 'pie',
      xField: categoricalColumns[0],
      yField: numericColumns[0]
    };
  }
  
  // Default fallback
  return {
    type: 'bar',
    xField: Object.keys(data[0])[0],
    yField: Object.keys(data[0])[1] || Object.keys(data[0])[0]
  };
} 