import pandas as pd
import numpy as np
from sklearn import preprocessing, decomposition, cluster
from typing import Dict, Any, Union, List
import statsmodels.api as sm

class AnalysisTools:
    @staticmethod
    def describe_data(df: pd.DataFrame) -> Dict[str, Any]:
        """Generate comprehensive data description"""
        return {
            'basic_stats': df.describe().to_dict(),
            'missing_values': df.isnull().sum().to_dict(),
            'data_types': df.dtypes.astype(str).to_dict(),
            'correlations': df.corr().to_dict() if df.select_dtypes(include=[np.number]).columns.any() else {}
        }
    
    @staticmethod
    def preprocess_data(df: pd.DataFrame, operations: List[str]) -> pd.DataFrame:
        """Apply preprocessing operations"""
        processed_df = df.copy()
        
        for op in operations:
            if op == 'normalize':
                numeric_cols = processed_df.select_dtypes(include=[np.number]).columns
                scaler = preprocessing.StandardScaler()
                processed_df[numeric_cols] = scaler.fit_transform(processed_df[numeric_cols])
            elif op == 'handle_missing':
                processed_df = processed_df.fillna(processed_df.mean())
                
        return processed_df
    
    @staticmethod
    def analyze_patterns(df: pd.DataFrame) -> Dict[str, Any]:
        """Perform pattern analysis"""
        numeric_df = df.select_dtypes(include=[np.number])
        
        # PCA if enough numeric columns
        pca_results = None
        if numeric_df.shape[1] > 1:
            pca = decomposition.PCA(n_components=min(3, numeric_df.shape[1]))
            pca_results = pca.fit_transform(numeric_df)
        
        # Clustering if enough samples
        cluster_results = None
        if numeric_df.shape[0] > 1:
            kmeans = cluster.KMeans(n_clusters=min(3, numeric_df.shape[0]))
            cluster_results = kmeans.fit_predict(numeric_df)
        
        return {
            'pca': pca_results.tolist() if pca_results is not None else None,
            'clusters': cluster_results.tolist() if cluster_results is not None else None
        }
    
    @staticmethod
    def statistical_analysis(df: pd.DataFrame, target_col: str = None) -> Dict[str, Any]:
        """Perform statistical analysis"""
        results = {}
        
        if target_col and target_col in df.columns:
            X = df.drop(columns=[target_col])
            y = df[target_col]
            
            # Linear regression
            X = sm.add_constant(X)
            model = sm.OLS(y, X).fit()
            results['regression'] = {
                'params': model.params.to_dict(),
                'rsquared': model.rsquared,
                'pvalues': model.pvalues.to_dict()
            }
        
        return results
