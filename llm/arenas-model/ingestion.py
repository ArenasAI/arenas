# llm/arenas-model/ingestion.py

from typing import List, Dict, Union
import pandas as pd
import numpy as np

class DataIngestion:
    def __init__(self):
        self.supported_formats = ['csv', 'json', 'excel']
        
    async def ingest(self, 
                    source: Union[str, pd.DataFrame], 
                    format_type: str = None) -> Dict:
        """
        Ingest data from various sources
        
        Args:
            source: File path or DataFrame
            format_type: Type of data format
            
        Returns:
            Dict containing processed data and metadata
        """
        try:
            if isinstance(source, pd.DataFrame):
                df = source
            else:
                df = self._load_data(source, format_type)
            
            # Process and validate data
            processed_data = self._process_data(df)
            
            # Generate data summary
            summary = self._generate_summary(df)
            
            return {
                'status': 'success',
                'data': processed_data,
                'summary': summary
            }
            
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e)
            }
    
    def _load_data(self, source: str, format_type: str) -> pd.DataFrame:
        """Load data from file"""
        if format_type not in self.supported_formats:
            raise ValueError(f"Unsupported format: {format_type}")
            
        if format_type == 'csv':
            return pd.read_csv(source)
        elif format_type == 'json':
            return pd.read_json(source)
        elif format_type == 'excel':
            return pd.read_excel(source)

    def _process_data(self, df: pd.DataFrame) -> Dict:
        """Process and clean data"""
        return {
            'numeric_columns': df.select_dtypes(include=[np.number]).columns.tolist(),
            'categorical_columns': df.select_dtypes(include=['object']).columns.tolist(),
            'row_count': len(df),
            'column_count': len(df.columns),
            'data': df.to_dict('records')
        }

    def _generate_summary(self, df: pd.DataFrame) -> Dict:
        """Generate data summary statistics"""
        return {
            'basic_stats': df.describe().to_dict(),
            'missing_values': df.isnull().sum().to_dict(),
            'column_types': df.dtypes.astype(str).to_dict()
        }
