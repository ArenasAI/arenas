import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.cluster import KMeans
from sklearn.metrics import r2_score

def identify_task(df, target_column):
    if target_column in df.columns:
        # Assume regression task if target is numerical
        if pd.api.types.is_numeric_dtype(df[target_column]):
            return 'regression'
        else:
            return 'classification'
    else:
        # If no target, assume unsupervised tasks like clustering
        return 'clustering'
