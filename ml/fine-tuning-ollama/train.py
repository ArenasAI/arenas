import torch
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    TrainingArguments,
    Trainer,
    DataCollatorForLanguageModeling
)
from datasets import load_from_disk
import os

def setup_model_and_tokenizer():
    model_name = "meta-llama/Llama-2-7b"  # You'll need access to Llama 2
    
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        torch_dtype=torch.float16,
        device_map="auto"
    )
    
    # Add special tokens if needed
    special_tokens = {"pad_token": "[PAD]"}
    tokenizer.add_special_tokens(special_tokens)
    model.resize_token_embeddings(len(tokenizer))
    
    return model, tokenizer

def prepare_dataset(tokenizer):
    dataset = load_from_disk("data/analysis_dataset")
    
    def tokenize_function(examples):
        return tokenizer(
            examples["text"],
            truncation=True,
            max_length=512,
            padding="max_length"
        )
    
    tokenized_dataset = dataset.map(
        tokenize_function,
        remove_columns=dataset.column_names,
        num_proc=4
    )
    
    return tokenized_dataset

def main():
    # Setup
    model, tokenizer = setup_model_and_tokenizer()
    
    # Prepare dataset
    dataset = prepare_dataset(tokenizer)
    
    # Training arguments
    training_args = TrainingArguments(
        output_dir="checkpoints",
        per_device_train_batch_size=4,
        gradient_accumulation_steps=4,
        num_train_epochs=3,
        learning_rate=2e-5,
        fp16=True,
        save_steps=100,
        logging_steps=10,
        save_total_limit=2,
    )
    
    # Initialize trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=dataset,
        data_collator=DataCollatorForLanguageModeling(
            tokenizer=tokenizer,
            mlm=False
        ),
    )
    
    # Train
    trainer.train()
    
    # Save final model
    trainer.save_model("final_model")
    tokenizer.save_pretrained("final_model")

if __name__ == "__main__":
    main()
