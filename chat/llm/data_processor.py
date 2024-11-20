import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.linear_model import LinearRegression

class DataProcessor:
    def clean_data(self, df):
        # Fill missing values with mean
        df = df.fillna(df.mean())
        # Remove duplicates
        df = df.drop_duplicates()
        return df

    def regression_model(self, X, y):
        model = LinearRegression(fit_intercept=True, normalize=False)
        model.fit(X, y)
        y_pred = model.predict(X)
        mse = np.mean((y - y_pred) ** 2)
        return mse

    def visualize_data(self, df):
        # Create a figure with subplots
        fig = plt.figure(figsize=(15, 10))
        
        # Histogram
        plt.subplot(2, 3, 1)
        df.hist(bins=30)
        plt.title('Histogram')

        # Line chart
        plt.subplot(2, 3, 2)
        df.plot(kind='line')
        plt.title('Line Chart')

        # Scatter plot
        plt.subplot(2, 3, 3)
        if len(df.columns) >= 2:
            plt.scatter(df.iloc[:, 0], df.iloc[:, 1])
            plt.title('Scatter Plot')

        # Box plot
        plt.subplot(2, 3, 4)
        df.boxplot()
        plt.title('Box Plot')

        # Heatmap
        plt.subplot(2, 3, 5)
        sns.heatmap(df.corr(), annot=True)
        plt.title('Correlation Heatmap')

        plt.tight_layout()
        return fig
