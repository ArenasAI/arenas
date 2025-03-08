import { DataStreamWriter } from 'ai';

type DataCleaningOptions = {
  session: any;
  dataStream: DataStreamWriter;
  selectedModelId: string;
};

export function cleanData({ session, dataStream, selectedModelId }: DataCleaningOptions) {
  return async function(args: {
    data: any[];
    language?: 'python' | 'r' | 'julia';
    operations?: string[];
  }) {
    if (!session?.user) {
      throw new Error('Unauthorized');
    }

    try {
      const { data, language = 'python', operations = [] } = args;

      // Generate the appropriate cleaning code based on language
      const cleaningCode = generateCleaningCode(language, operations);
      
      // Return both the code and cleaned data for the UI
      return {
        code: cleaningCode,
        data: data.map(row => {
          const cleanedRow = { ...row };
          
          // Basic cleaning operations
          Object.keys(cleanedRow).forEach(key => {
            // Remove special characters and standardize column names
            const cleanKey = key.replace(/[^\w\s]/g, '_').toLowerCase().trim();
            
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
        })
      };
    } catch (error) {
      console.error('Error in data cleaning:', error);
      throw new Error('Failed to clean data');
    }
  };
}

function generateCleaningCode(language: string, operations: string[]) {
  switch (language.toLowerCase()) {
    case 'python':
      return `
import pandas as pd
import numpy as np

def clean_data(df):
    # Create a copy of the dataframe
    df_clean = df.copy()
    
    # Standardize column names
    df_clean.columns = df_clean.columns.str.replace('[^\\w\\s]', '_').str.lower().str.strip()
    
    # Basic cleaning operations
    for column in df_clean.columns:
        # Convert to numeric where possible
        if df_clean[column].dtype == 'object':
            try:
                df_clean[column] = pd.to_numeric(df_clean[column], errors='coerce')
            except:
                pass
                
        # Strip whitespace if string
        if df_clean[column].dtype == 'object':
            df_clean[column] = df_clean[column].str.strip()
            
    return df_clean
`;

    case 'r':
      return `
library(tidyverse)
library(janitor)

clean_data <- function(data) {
  data %>%
    # Clean column names
    clean_names() %>%
    # Convert character columns to numeric where possible
    mutate(across(where(is.character), 
                 ~type.convert(.x, as.is = TRUE))) %>%
    # Trim whitespace in character columns
    mutate(across(where(is.character), str_trim))
}
`;

    case 'julia':
      return `
using DataFrames
using DataFramesMeta

function clean_data(df::DataFrame)
    # Create a copy of the dataframe
    df_clean = copy(df)
    
    # Clean column names
    new_names = [Symbol(lowercase(replace(string(name), r"[^\\w\\s]" => "_"))) 
                 for name in names(df_clean)]
    rename!(df_clean, new_names)
    
    # Clean data in each column
    for col in names(df_clean)
        # Try to convert to numeric
        if eltype(df_clean[!, col]) <: String
            try
                df_clean[!, col] = parse.(Float64, df_clean[!, col])
            catch
                # If conversion fails, just trim strings
                df_clean[!, col] = strip.(df_clean[!, col])
            end
        end
    end
    
    return df_clean
end
`;

    default:
      throw new Error(`Unsupported language: ${language}`);
  }
}