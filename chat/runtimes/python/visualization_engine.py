import matplotlib.pyplot as plt
import seaborn as sns
import plotly.express as px
import plotly.graph_objects as go
from typing import Dict, Any, List
import pandas as pd
import base64
from io import BytesIO

class VisualizationEngine:
    def __init__(self):
        self.style = 'seaborn'
        plt.style.use(self.style)
    
    def create_visualization(self, df: pd.DataFrame, viz_type: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """Create visualization based on type"""
        if params is None:
            params = {}
            
        try:
            if viz_type == 'histogram':
                return self._create_histogram(df, params)
            elif viz_type == 'scatter':
                return self._create_scatter(df, params)
            elif viz_type == 'line':
                return self._create_line(df, params)
            elif viz_type == 'heatmap':
                return self._create_heatmap(df, params)
            elif viz_type == 'box':
                return self._create_box(df, params)
            else:
                raise ValueError(f"Unsupported visualization type: {viz_type}")
        
        except Exception as e:
            return {'error': str(e)}
    
    def _create_histogram(self, df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
        column = params.get('column')
        if not column:
            column = df.select_dtypes(include=['number']).columns[0]
            
        fig = px.histogram(df, x=column)
        return {'plotly_json': fig.to_json()}
    
    def _create_scatter(self, df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
        x = params.get('x')
        y = params.get('y')
        
        if not (x and y):
            numeric_cols = df.select_dtypes(include=['number']).columns
            x = numeric_cols[0]
            y = numeric_cols[1] if len(numeric_cols) > 1 else numeric_cols[0]
            
        fig = px.scatter(df, x=x, y=y)
        return {'plotly_json': fig.to_json()}
    
    def _create_line(self, df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
        x = params.get('x')
        y = params.get('y')
        
        fig = px.line(df, x=x, y=y)
        return {'plotly_json': fig.to_json()}
    
    def _create_heatmap(self, df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
        corr = df.corr()
        fig = px.imshow(corr)
        return {'plotly_json': fig.to_json()}
    
    def _create_box(self, df: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
        column = params.get('column')
        if not column:
            column = df.select_dtypes(include=['number']).columns[0]
            
        fig = px.box(df, y=column)
        return {'plotly_json': fig.to_json()}
    
    @staticmethod
    def _fig_to_base64(fig) -> str:
        """Convert matplotlib figure to base64 string"""
        buf = BytesIO()
        fig.savefig(buf, format='png')
        buf.seek(0)
        return base64.b64encode(buf.getvalue()).decode('utf-8')
