#creating custom llms to make the model perform various tasks, visualization etc.
#this may change in the future

from transformers import AutoModelForSequenceGeneration
import torch.nn as nn
import transformers
from data_processor import DataProcessor
from r_visualizer import RVisualizer
import yaml
import pandas as pd
import os
import torch

class LLM(nn.Module):
    def __init__(self, model_name):
        super(LLM, self).__init__()
        self.model = AutoModelForSequenceGeneration.from_pretrained(model_name)
        self.processor = DataProcessor()
        self.r_visualizer = RVisualizer()

        # Load tasks configuration
        with open('tasks.yaml', 'r') as file:
            self.tasks_config = yaml.safe_load(file)

    def forward(self, input_ids, attention_mask, data_df):
        # 1. Model output
        output = self.model(input_ids, attention_mask).last_hidden_state
        
        # 2. Data cleaning
        cleaned_df = self.processor.clean_data(data_df)
        
        # 3. Regression modeling
        if 'target_variable' in cleaned_df.columns:
            target_variable = cleaned_df['target_variable']
            features = cleaned_df.drop(['target_variable'], axis=1)
            mse = self.processor.regression_model(features, target_variable)
        else:
            mse = None
        # 4. Data visualization
        # 4. Python visualizations
        python_figures = self.processor.visualize_data(cleaned_df)
        
        # 5. R visualizations
        r_visualization_success = self.r_visualizer.create_advanced_visualizations(cleaned_df)
        
        return {
            'model_output': output,
            'cleaned_data': cleaned_df,
            'regression_mse': mse,
            'python_visualization': python_figures,
            'r_visualization_status': r_visualization_success
        }

    def train_model(self, train_dataloader, num_epochs=3):
        self.train()
        optimizer = torch.optim.AdamW(self.parameters(), lr=1e-5)
        
        for epoch in range(num_epochs):
            for batch in train_dataloader:
                optimizer.zero_grad()
                input_ids = batch['input_ids']
                attention_mask = batch['attention_mask']
                labels = batch['labels']
                
                outputs = self.model(
                    input_ids=input_ids,
                    attention_mask=attention_mask,
                    labels=labels
                )
                
                loss = outputs.loss
                loss.backward()
                optimizer.step()
                
            print(f"Epoch {epoch + 1}/{num_epochs}, Loss: {loss.item()}")
