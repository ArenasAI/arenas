from typing import Dict, List, Union, Optional, Any, Tuple
import json
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.metrics import mean_squared_error, r2_score, accuracy_score, precision_score, recall_score, f1_score
from sklearn.impute import SimpleImputer
import matplotlib.pyplot as plt
import io
import base64

from agents import Agent, WebSearchTool, function_tool

# Define machine learning tools
@function_tool
def preprocess_data(data_str: str, target_column: str, categorical_columns: Optional[List[str]] = None, 
                   numerical_columns: Optional[List[str]] = None, test_size: float = 0.2) -> str:
    """
    Preprocess data for machine learning by splitting into train/test sets and handling categorical/numerical features.
    
    Args:
        data_str: JSON string representation of the dataframe
        target_column: The column to predict
        categorical_columns: List of categorical column names
        numerical_columns: List of numerical column names
        test_size: Proportion of data to use for testing
    
    Returns:
        JSON string with preprocessed data information
    """
    try:
        # Parse the JSON string to a list of dictionaries
        data = json.loads(data_str)
        
        # Convert to pandas DataFrame
        df = pd.DataFrame(data)
        
        # Get target and features
        if target_column not in df.columns:
            return f"Error: Target column '{target_column}' not found in the data"
        
        # Auto-detect column types if not specified
        if categorical_columns is None and numerical_columns is None:
            categorical_columns = []
            numerical_columns = []
            for col in df.columns:
                if col != target_column:
                    if df[col].dtype == 'object' or df[col].nunique() < 10:
                        categorical_columns.append(col)
                    else:
                        numerical_columns.append(col)
        
        # Split data
        y = df[target_column]
        X = df.drop(columns=[target_column])
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=test_size, random_state=42)
        
        # Save shapes and column information
        result = {
            "train_shape": X_train.shape,
            "test_shape": X_test.shape,
            "target_column": target_column,
            "categorical_columns": categorical_columns,
            "numerical_columns": numerical_columns,
            "problem_type": "classification" if y.nunique() < 10 else "regression"
        }
        
        return json.dumps(result)
    except Exception as e:
        return f"Error preprocessing data: {str(e)}"

@function_tool
def train_model(data_str: str, target_column: str, model_type: str,
              categorical_columns: Optional[List[str]] = None,
              numerical_columns: Optional[List[str]] = None,
              hyperparameters: Optional[Dict[str, Any]] = None) -> str:
    """
    Train a machine learning model on the provided data.
    
    Args:
        data_str: JSON string representation of the dataframe
        target_column: Column to predict
        model_type: Type of model (linear_regression, logistic_regression, random_forest)
        categorical_columns: List of categorical column names
        numerical_columns: List of numerical column names
        hyperparameters: Optional dictionary of hyperparameters
    
    Returns:
        JSON string with training results
    """
    try:
        # Parse the JSON string to a list of dictionaries
        data = json.loads(data_str)
        
        # Convert to pandas DataFrame
        df = pd.DataFrame(data)
        
        # Get target and features
        if target_column not in df.columns:
            return f"Error: Target column '{target_column}' not found in the data"
        
        # Auto-detect column types if not specified
        if categorical_columns is None and numerical_columns is None:
            categorical_columns = []
            numerical_columns = []
            for col in df.columns:
                if col != target_column:
                    if df[col].dtype == 'object' or df[col].nunique() < 10:
                        categorical_columns.append(col)
                    else:
                        numerical_columns.append(col)
        
        # Determine problem type
        y = df[target_column]
        problem_type = "classification" if y.nunique() < 10 else "regression"
        
        # Create preprocessing pipeline
        numeric_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='median')),
            ('scaler', StandardScaler())
        ])
        
        categorical_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='most_frequent')),
            ('onehot', OneHotEncoder(handle_unknown='ignore'))
        ])
        
        preprocessor = ColumnTransformer(
            transformers=[
                ('num', numeric_transformer, numerical_columns),
                ('cat', categorical_transformer, categorical_columns)
            ])
        
        # Select model based on type and problem
        if model_type == "linear_regression" and problem_type == "regression":
            model = LinearRegression(**(hyperparameters or {}))
        elif model_type == "logistic_regression" and problem_type == "classification":
            model = LogisticRegression(max_iter=1000, **(hyperparameters or {}))
        elif model_type == "random_forest" and problem_type == "regression":
            model = RandomForestRegressor(n_estimators=100, **(hyperparameters or {}))
        elif model_type == "random_forest" and problem_type == "classification":
            model = RandomForestClassifier(n_estimators=100, **(hyperparameters or {}))
        else:
            return f"Error: Model type '{model_type}' not compatible with problem type '{problem_type}'"
        
        # Create full pipeline
        pipeline = Pipeline(steps=[
            ('preprocessor', preprocessor),
            ('model', model)
        ])
        
        # Split data
        X = df.drop(columns=[target_column])
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Train model
        pipeline.fit(X_train, y_train)
        
        # Evaluate model
        y_pred = pipeline.predict(X_test)
        
        # Calculate metrics based on problem type
        metrics = {}
        if problem_type == "regression":
            metrics = {
                "mse": mean_squared_error(y_test, y_pred),
                "rmse": np.sqrt(mean_squared_error(y_test, y_pred)),
                "r2": r2_score(y_test, y_pred)
            }
        else:
            metrics = {
                "accuracy": accuracy_score(y_test, y_pred),
                "precision": precision_score(y_test, y_pred, average='weighted', zero_division=0),
                "recall": recall_score(y_test, y_pred, average='weighted', zero_division=0),
                "f1": f1_score(y_test, y_pred, average='weighted', zero_division=0)
            }
        
        # Get feature importances if available
        feature_importance = {}
        if hasattr(pipeline['model'], 'feature_importances_'):
            # Get feature names
            feature_names = (
                numerical_columns + 
                list(pipeline['preprocessor'].transformers_[1][1]['onehot'].get_feature_names_out(categorical_columns))
            )
            importances = pipeline['model'].feature_importances_
            feature_importance = {name: float(imp) for name, imp in zip(feature_names, importances)}
        
        result = {
            "model_type": model_type,
            "problem_type": problem_type,
            "metrics": metrics,
            "feature_importance": feature_importance
        }
        
        return json.dumps(result, default=str)
    except Exception as e:
        return f"Error training model: {str(e)}"

@function_tool
def model_performance_viz(data_str: str, target_column: str, model_type: str) -> str:
    """
    Visualize model performance with appropriate plots.
    
    Args:
        data_str: JSON string representation of the dataframe
        target_column: Column being predicted
        model_type: Type of model (linear_regression, logistic_regression, random_forest)
    
    Returns:
        Base64 encoded image string
    """
    try:
        # Parse the JSON string to a list of dictionaries
        data = json.loads(data_str)
        
        # Convert to pandas DataFrame
        df = pd.DataFrame(data)
        
        # Determine problem type
        y = df[target_column]
        problem_type = "classification" if y.nunique() < 10 else "regression"
        
        # Split the data
        X = df.drop(columns=[target_column])
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Create the figure
        fig, axes = plt.subplots(1, 2, figsize=(16, 6))
        
        # Train model based on type
        if problem_type == "regression":
            if model_type == "linear_regression":
                model = LinearRegression()
            else:
                model = RandomForestRegressor(n_estimators=100)
                
            # Simple preprocessing for demonstration
            X_train_numeric = X_train.select_dtypes(include=[np.number]).fillna(0)
            X_test_numeric = X_test.select_dtypes(include=[np.number]).fillna(0)
            
            # Train model
            model.fit(X_train_numeric, y_train)
            
            # Make predictions
            y_pred = model.predict(X_test_numeric)
            
            # Plot actual vs predicted
            axes[0].scatter(y_test, y_pred, alpha=0.7)
            axes[0].plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], 'r--')
            axes[0].set_xlabel('Actual')
            axes[0].set_ylabel('Predicted')
            axes[0].set_title('Actual vs Predicted Values')
            
            # Plot residuals
            residuals = y_test - y_pred
            axes[1].scatter(y_pred, residuals, alpha=0.7)
            axes[1].axhline(y=0, color='r', linestyle='-')
            axes[1].set_xlabel('Predicted')
            axes[1].set_ylabel('Residuals')
            axes[1].set_title('Residual Plot')
            
        else:  # Classification
            if model_type == "logistic_regression":
                model = LogisticRegression(max_iter=1000)
            else:
                model = RandomForestClassifier(n_estimators=100)
                
            # Simple preprocessing for demonstration
            X_train_numeric = X_train.select_dtypes(include=[np.number]).fillna(0)
            X_test_numeric = X_test.select_dtypes(include=[np.number]).fillna(0)
            
            # Train model
            model.fit(X_train_numeric, y_train)
            
            # Make predictions
            y_pred = model.predict(X_test_numeric)
            
            # Calculate confusion matrix
            from sklearn.metrics import confusion_matrix
            import seaborn as sns
            
            cm = confusion_matrix(y_test, y_pred)
            sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', ax=axes[0])
            axes[0].set_xlabel('Predicted')
            axes[0].set_ylabel('Actual')
            axes[0].set_title('Confusion Matrix')
            
            # Feature importance for random forest
            if model_type == "random_forest" and hasattr(model, 'feature_importances_'):
                feature_names = X_train_numeric.columns
                importances = model.feature_importances_
                indices = np.argsort(importances)[-10:]  # Top 10 features
                
                axes[1].barh(range(len(indices)), importances[indices])
                axes[1].set_yticks(range(len(indices)))
                axes[1].set_yticklabels([feature_names[i] for i in indices])
                axes[1].set_xlabel('Feature Importance')
                axes[1].set_title('Top Feature Importances')
            else:
                # For logistic regression, show ROC curve
                from sklearn.metrics import roc_curve, auc
                
                # If binary classification
                if len(np.unique(y)) == 2:
                    # Get predicted probabilities
                    y_proba = model.predict_proba(X_test_numeric)[:, 1]
                    fpr, tpr, _ = roc_curve(y_test, y_proba)
                    roc_auc = auc(fpr, tpr)
                    
                    axes[1].plot(fpr, tpr, label=f'ROC curve (area = {roc_auc:.2f})')
                    axes[1].plot([0, 1], [0, 1], 'k--')
                    axes[1].set_xlabel('False Positive Rate')
                    axes[1].set_ylabel('True Positive Rate')
                    axes[1].set_title('ROC Curve')
                    axes[1].legend(loc='lower right')
                else:
                    axes[1].text(0.5, 0.5, 'Multiclass ROC not shown', ha='center', va='center')
        
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
        return f"Error visualizing model performance: {str(e)}"

# Create the machine learning agent
ml_agent = Agent(
    name='Machine Learning Agent',
    instructions="""You are an expert machine learning agent specialized in building and evaluating predictive models.

You can help users with:
1. Preprocessing data for machine learning tasks
2. Training various types of models (regression and classification)
3. Evaluating model performance using appropriate metrics
4. Visualizing predictions and model results
5. Interpreting model outputs and feature importance

When working with ML models:
- Identify the problem type (regression vs classification) based on the target variable
- Suggest appropriate models based on the data and problem
- Explain the strengths and limitations of different algorithms
- Provide insights into feature importance and model performance
- Give clear interpretations of evaluation metrics

Always explain your process in an educational manner, highlighting key ML concepts and best practices."""
)

# Add tools to the agent
ml_agent.with_tools(
    WebSearchTool(),
    preprocess_data,
    train_model,
    model_performance_viz
) 