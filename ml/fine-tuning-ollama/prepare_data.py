import json
import pandas as pd
from datasets import Dataset
from typing import List, Dict

def load_training_examples() -> List[Dict]:
    """
    Load and prepare data analysis examples for fine-tuning.
    Each example should contain a data analysis task and its solution.
    """
    examples = [
        {
            "instruction": "Analyze this sales dataset and identify key trends",
            "input": "sales_data.csv containing columns: date, product, quantity, revenue",
            "output": """1. Calculate monthly revenue trends
2. Identify top-selling products
3. Analyze seasonal patterns
4. Calculate key metrics:
   - Total revenue
   - Average order value
   - Product-wise performance
5. Visualization recommendations:
   - Line chart for revenue trends
   - Bar chart for product performance
   - Heatmap for seasonal patterns"""
        },
        # Add more examples...
    ]
    return examples

def format_for_llama(examples: List[Dict]) -> List[Dict]:
    """Format data in Llama 2's preferred fine-tuning format"""
    formatted = []
    for ex in examples:
        formatted.append({
            "text": f"[INST] {ex['instruction']}\nContext: {ex['input']} [/INST]\n{ex['output']}"
        })
    return formatted

def main():
    # Load examples
    examples = load_training_examples()
    
    # Format for Llama 2
    formatted_data = format_for_llama(examples)
    
    # Create dataset
    dataset = Dataset.from_list(formatted_data)
    
    # Save dataset
    dataset.save_to_disk("data/analysis_dataset")
    
    # Also save raw json for inspection
    with open("data/raw_examples.json", "w") as f:
        json.dump(examples, f, indent=2)

if __name__ == "__main__":
    main()
