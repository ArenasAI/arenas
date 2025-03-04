export async function cleanDataWithAPI(data: any[]) {
  try {
    const response = await fetch('/api/data-cleaning', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to clean data');
    }
    
    const result = await response.json();
    return {
      cleanedData: result.data,
      stats: result.stats,
    };
  } catch (error) {
    console.error('Error cleaning data:', error);
    throw error;
  }
}

// Export these functions for testing
export function cleanData(data: any[]): any[] {
  return data.map(row => {
    const cleanedRow = { ...row };
    
    // Convert object keys to clean format
    Object.keys(cleanedRow).forEach(key => {
      // Remove special characters and trim whitespace
      const cleanKey = key.replace(/[^\w\s]/g, '').trim();
      
      if (cleanKey !== key) {
        cleanedRow[cleanKey] = cleanedRow[key];
        delete cleanedRow[key];
      }
      
      // Clean string values
      if (typeof cleanedRow[cleanKey] === 'string') {
        cleanedRow[cleanKey] = cleanedRow[cleanKey].trim();
      }
      
      // Convert numeric strings to numbers
      if (typeof cleanedRow[cleanKey] === 'string' && 
          !isNaN(Number(cleanedRow[cleanKey]))) {
        cleanedRow[cleanKey] = Number(cleanedRow[cleanKey]);
      }
    });
    
    return cleanedRow;
  });
}

export function generateStats(data: any[]): any {
  const stats: Record<string, any> = {};
  
  if (data.length === 0) return stats;
  
  // Get all column names
  const columns = Object.keys(data[0]);
  
  columns.forEach(column => {
    const values = data.map(row => row[column]);
    const numericValues = values.filter(v => typeof v === 'number');
    
    stats[column] = {
      count: values.length,
      nullCount: values.filter(v => v === null || v === undefined).length,
      uniqueCount: new Set(values).size,
    };
    
    if (numericValues.length > 0) {
      stats[column].min = Math.min(...numericValues);
      stats[column].max = Math.max(...numericValues);
      stats[column].mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
    }
  });
  
  return stats;
} 