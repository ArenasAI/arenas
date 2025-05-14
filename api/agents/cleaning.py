from typing import Dict, List, Union, Optional, Any
import json
import pandas as pd
import numpy as np
from datetime import datetime
import matplotlib.pyplot as plt
import io
import base64

from agents import Agent, WebSearchTool, function_tool

# Define data science tools
@function_tool
def analyze_dataframe(data_str: str, columns: Optional[List[str]] = None) -> str:
    """
    Analyze a dataframe and return descriptive statistics.
    
    Args:
        data_str: JSON string representation of the dataframe
        columns: Optional list of column names to analyze
    
    Returns:
        String with analysis results
    """
    try:
        # Parse the JSON string to a list of dictionaries
        data = json.loads(data_str)
        
        # Convert to pandas DataFrame
        df = pd.DataFrame(data)
        
        # Filter columns if specified
        if columns and all(col in df.columns for col in columns):
            df = df[columns]
        
        # Generate basic statistics
        stats = df.describe(include='all').to_dict()
        
        # Add data types
        dtypes = {col: str(dtype) for col, dtype in df.dtypes.items()}
        
        # Check for missing values
        missing = df.isnull().sum().to_dict()
        
        # Check for duplicates
        duplicates = len(df) - len(df.drop_duplicates())
        
        result = {
            "shape": df.shape,
            "dtypes": dtypes,
            "missing_values": missing,
            "duplicates": duplicates,
            "statistics": stats
        }
        
        return json.dumps(result, default=str)
    except Exception as e:
        return f"Error analyzing data: {str(e)}"

@function_tool
def clean_data(data_str: str, operations: List[Dict[str, Any]]) -> str:
    """
    Clean a dataframe based on specified operations.
    
    Args:
        data_str: JSON string representation of the dataframe
        operations: List of cleaning operations to perform
        
    Returns:
        JSON string of the cleaned dataframe
    """
    try:
        # Parse the JSON string to a list of dictionaries
        data = json.loads(data_str)
        
        # Convert to pandas DataFrame
        df = pd.DataFrame(data)
        
        # Process each operation
        for op in operations:
            op_type = op.get("type")
            
            if op_type == "drop_column":
                columns = op.get("columns", [])
                df = df.drop(columns=columns, errors='ignore')
                
            elif op_type == "fill_na":
                column = op.get("column")
                value = op.get("value")
                if column in df.columns:
                    df[column] = df[column].fillna(value)
                    
            elif op_type == "drop_duplicates":
                subset = op.get("subset")
                df = df.drop_duplicates(subset=subset)
                
            elif op_type == "rename_columns":
                rename_dict = op.get("rename_dict", {})
                df = df.rename(columns=rename_dict)
                
            elif op_type == "convert_type":
                column = op.get("column")
                target_type = op.get("to_type")
                if column in df.columns:
                    try:
                        if target_type == "int":
                            df[column] = df[column].astype(int)
                        elif target_type == "float":
                            df[column] = df[column].astype(float)
                        elif target_type == "str":
                            df[column] = df[column].astype(str)
                        elif target_type == "datetime":
                            df[column] = pd.to_datetime(df[column])
                    except:
                        pass
        
        # Return the cleaned dataframe as JSON
        return df.to_json(orient='records')
    except Exception as e:
        return f"Error cleaning data: {str(e)}"

@function_tool
def visualize_data(data_str: str, chart_type: str, x_column: str, y_column: Optional[str] = None, 
                   title: Optional[str] = None, color: Optional[str] = None) -> str:
    """
    Create a visualization of the data and return a base64 encoded image.
    
    Args:
        data_str: JSON string representation of the dataframe
        chart_type: Type of chart (bar, line, scatter, histogram, boxplot, pie)
        x_column: Column to use for x-axis
        y_column: Column to use for y-axis (optional for some chart types)
        title: Chart title
        color: Color for the chart
        
    Returns:
        Base64 encoded image string
    """
    try:
        # Parse the JSON string to a list of dictionaries
        data = json.loads(data_str)
        
        # Convert to pandas DataFrame
        df = pd.DataFrame(data)
        
        # Create the figure
        plt.figure(figsize=(10, 6))
        
        # Create the specified chart type
        if chart_type == "bar":
            if y_column:
                df.plot(kind='bar', x=x_column, y=y_column, color=color)
            else:
                df[x_column].value_counts().plot(kind='bar', color=color)
                
        elif chart_type == "line":
            df.plot(kind='line', x=x_column, y=y_column, color=color)
            
        elif chart_type == "scatter":
            df.plot(kind='scatter', x=x_column, y=y_column, color=color)
            
        elif chart_type == "histogram":
            df[x_column].plot(kind='hist', color=color)
            
        elif chart_type == "boxplot":
            df[x_column].plot(kind='box', color=color)
            
        elif chart_type == "pie" and x_column in df.columns:
            df[x_column].value_counts().plot(kind='pie', autopct='%1.1f%%')
        
        # Set the title
        if title:
            plt.title(title)
            
        plt.tight_layout()
        
        # Convert the figure to a base64 encoded string
        buffer = io.BytesIO()
        plt.savefig(buffer, format='png')
        buffer.seek(0)
        image_png = buffer.getvalue()
        buffer.close()
        plt.close()
        
        # Convert to base64
        encoded = base64.b64encode(image_png).decode('utf-8')
        
        return f"data:image/png;base64,{encoded}"
    except Exception as e:
        return f"Error visualizing data: {str(e)}"

# Create the data cleaning agent
clean = Agent(
    name='Data Science Agent',
    instructions="""You are an expert data science agent specializing in data analysis, cleaning, and visualization.

You can help users with:
1. Analyzing datasets to understand their structure, types, and statistics
2. Cleaning data by handling missing values, duplicates, and data type conversions
3. Creating visualizations to better understand patterns and distributions
4. Providing expert advice on data preprocessing and feature engineering

When working with data:
- First analyze the data to understand its structure before suggesting cleaning operations
- Be precise with column names and data types in your recommendations
- Explain your reasoning when suggesting data transformations
- Use visualizations to help users understand their data better

Always explain your process and findings in a clear, educational manner."""
)

# Add tools to the agent
clean.with_tools(
    WebSearchTool(),
    analyze_dataframe,
    clean_data,
    visualize_data
)