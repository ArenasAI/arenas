import rpy2.robjects as robjects
from rpy2.robjects import pandas2ri
from rpy2.robjects.packages import importr
import pandas as pd

class RVisualizer:
    def __init__(self):
        # Initialize R packages
        self.ggplot2 = importr('ggplot2')
        self.tidyr = importr('tidyr')
        self.dplyr = importr('dplyr')
        pandas2ri.activate()
        
        # Load R script
        with open('chat/llm/visualize.r', 'r') as file:
            r_code = file.read()
        self.r_func = robjects.r(r_code)

    def create_advanced_visualizations(self, df):
        # Convert pandas DataFrame to R DataFrame
        r_dataframe = pandas2ri.py2rpy(df)
        
        # Call R functions
        try:
            self.r_func(r_dataframe)
            return True
        except Exception as e:
            print(f"Error in R visualization: {e}")
            return False
