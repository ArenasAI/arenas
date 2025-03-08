import { DataStreamWriter } from 'ai';

type GenerateReportsOptions = {
  session: any;
  dataStream: DataStreamWriter;
  selectedModelId: string;
};

export function generateReports({ session, dataStream, selectedModelId }: GenerateReportsOptions) {
  return async function(args: {
    data: any[];
    language?: 'python' | 'r' | 'julia';
    reportType?: 'summary' | 'detailed' | 'visualization';
    columns?: string[];
  }) {
    if (!session?.user) {
      throw new Error('Unauthorized');
    }

    try {
      const { 
        data, 
        language = 'python', 
        reportType = 'summary',
        columns = [] 
      } = args;

      // Generate appropriate analysis code based on language and report type
      const analysisCode = generateAnalysisCode(language, reportType, columns);

      // Generate basic statistics
      const stats = generateBasicStats(data, columns);

      return {
        code: analysisCode,
        statistics: stats,
        reportType
      };
    } catch (error) {
      console.error('Error generating report:', error);
      throw new Error('Failed to generate report');
    }
  };
}

function generateBasicStats(data: any[], columns: string[]) {
  const stats: Record<string, any> = {};
  
  if (data.length === 0) return stats;
  
  // Use specified columns or all columns if none specified
  const columnsToAnalyze = columns.length > 0 
    ? columns 
    : Object.keys(data[0]);
  
  columnsToAnalyze.forEach(column => {
    const values = data.map(row => row[column]);
    const numericValues = values.filter(v => typeof v === 'number');
    
    stats[column] = {
      count: values.length,
      nullCount: values.filter(v => v === null || v === undefined).length,
      uniqueCount: new Set(values).size,
      type: numericValues.length === values.length ? 'numeric' : 'categorical'
    };
    
    if (numericValues.length > 0) {
      stats[column].min = Math.min(...numericValues);
      stats[column].max = Math.max(...numericValues);
      stats[column].mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
    }
  });
  
  return stats;
}

function generateAnalysisCode(language: string, reportType: string, columns: string[]) {
  const columnsList = columns.length > 0 ? columns.join(', ') : 'all columns';
  
  switch (language.toLowerCase()) {
    case 'python':
      return `
import pandas as pd
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt

def analyze_data(df):
    # Select columns for analysis
    columns = [${columns.map(c => `'${c}'`).join(', ')}] or df.columns
    df_analysis = df[columns]
    
    ${reportType === 'summary' ? `
    # Generate summary statistics
    summary = df_analysis.describe()
    null_counts = df_analysis.isnull().sum()
    unique_counts = df_analysis.nunique()
    
    return {
        'summary': summary,
        'null_counts': null_counts,
        'unique_counts': unique_counts
    }
    ` : reportType === 'detailed' ? `
    # Detailed analysis
    analysis = {
        'summary': df_analysis.describe(),
        'correlations': df_analysis.corr(),
        'null_analysis': df_analysis.isnull().sum(),
        'unique_values': {col: df_analysis[col].value_counts().head() for col in df_analysis.columns}
    }
    
    return analysis
    ` : `
    # Visualization
    plt.figure(figsize=(12, 6))
    for col in df_analysis.select_dtypes(include=[np.number]).columns:
        sns.histplot(data=df_analysis, x=col)
        plt.title(f'Distribution of {col}')
        plt.show()
    
    # Correlation heatmap
    plt.figure(figsize=(10, 8))
    sns.heatmap(df_analysis.corr(), annot=True)
    plt.title('Correlation Matrix')
    plt.show()
    `}
`;

    case 'r':
      return `
library(tidyverse)
library(skimr)
library(corrplot)

analyze_data <- function(data) {
    # Select columns for analysis
    columns <- c(${columns.map(c => `"${c}"`).join(', ')})
    if (length(columns) > 0) {
        data <- data %>% select(all_of(columns))
    }
    
    ${reportType === 'summary' ? `
    # Summary statistics
    summary_stats <- skim(data)
    return(summary_stats)
    ` : reportType === 'detailed' ? `
    # Detailed analysis
    detailed_analysis <- list(
        summary = summary(data),
        correlations = cor(select_if(data, is.numeric)),
        missing_data = colSums(is.na(data)),
        unique_counts = sapply(data, n_distinct)
    )
    return(detailed_analysis)
    ` : `
    # Visualizations
    numeric_cols <- select_if(data, is.numeric)
    
    # Histograms
    numeric_cols %>%
        gather() %>%
        ggplot(aes(x = value)) +
        geom_histogram() +
        facet_wrap(~key, scales = "free")
    
    # Correlation plot
    corrplot(cor(numeric_cols))
    `}
`;

    case 'julia':
      return `
using DataFrames
using Statistics
using StatsPlots
using Plots

function analyze_data(df::DataFrame)
    # Select columns for analysis
    columns = [${columns.map(c => `Symbol("${c}")`).join(', ')}]
    df_analysis = isempty(columns) ? df : df[:, columns]
    
    ${reportType === 'summary' ? `
    # Summary statistics
    summary_stats = describe(df_analysis)
    null_counts = sum.(ismissing, eachcol(df_analysis))
    unique_counts = length.(unique.(eachcol(df_analysis)))
    
    return Dict(
        "summary" => summary_stats,
        "null_counts" => null_counts,
        "unique_counts" => unique_counts
    )
    ` : reportType === 'detailed' ? `
    # Detailed analysis
    numeric_cols = names(df_analysis, Real)
    
    analysis = Dict(
        "summary" => describe(df_analysis),
        "correlations" => cor(Matrix(df_analysis[:, numeric_cols])),
        "missing_data" => sum.(ismissing, eachcol(df_analysis)),
        "unique_values" => Dict(name => unique(col) for (name, col) in pairs(eachcol(df_analysis)))
    )
    
    return analysis
    ` : `
    # Visualizations
    numeric_cols = names(df_analysis, Real)
    
    # Histograms
    p1 = plot(layout=(length(numeric_cols), 1), size=(800, 200*length(numeric_cols)))
    for (i, col) in enumerate(numeric_cols)
        histogram!(p1[i], df_analysis[:, col], title=string(col))
    end
    display(p1)
    
    # Correlation heatmap
    if length(numeric_cols) > 1
        correlation_matrix = cor(Matrix(df_analysis[:, numeric_cols]))
        heatmap(correlation_matrix, 
                title="Correlation Matrix",
                xticks=(1:length(numeric_cols), string.(numeric_cols)),
                yticks=(1:length(numeric_cols), string.(numeric_cols)))
    end
    `}
`;

    default:
      throw new Error(`Unsupported language: ${language}`);
  }
}