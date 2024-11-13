import torch
import torch.nn as nn
from transformers import PreTrainedModel, PreTrainedTokenizer
from typing import Optional, Tuple

class DataAnalysisModel(PreTrainedModel):
    def __init__(self, config):
        super().__init__(config)
        
        # Core transformer for understanding context
        self.transformer = nn.TransformerEncoder(
            nn.TransformerEncoderLayer(
                d_model=config.hidden_size,
                nhead=config.num_attention_heads,
                dim_feedforward=config.intermediate_size,
                dropout=config.hidden_dropout_prob
            ),
            num_layers=config.num_hidden_layers
        )
        
        # Specialized heads for different analysis tasks
        self.trend_analyzer = nn.Linear(config.hidden_size, config.trend_classes)
        self.metric_calculator = nn.Linear(config.hidden_size, config.metric_dimensions)
        self.outlier_detector = nn.Linear(config.hidden_size, 1)
        
        # Initialize weights
        self.init_weights()
    
    def forward(
        self,
        input_ids: torch.Tensor,
        attention_mask: Optional[torch.Tensor] = None,
        labels: Optional[torch.Tensor] = None,
        task_type: Optional[str] = None
    ) -> Tuple[torch.Tensor, ...]:
        
        # Get transformer outputs
        transformer_outputs = self.transformer(
            input_ids,
            src_key_padding_mask=~attention_mask if attention_mask is not None else None
        )
        
        # Task-specific heads
        if task_type == "trend":
            output = self.trend_analyzer(transformer_outputs)
        elif task_type == "metrics":
            output = self.metric_calculator(transformer_outputs)
        elif task_type == "outliers":
            output = self.outlier_detector(transformer_outputs)
        else:
            raise ValueError(f"Unknown task type: {task_type}")
        
        # Calculate loss if labels provided
        loss = None
        if labels is not None:
            if task_type == "outliers":
                loss_fct = nn.BCEWithLogitsLoss()
            else:
                loss_fct = nn.CrossEntropyLoss()
            loss = loss_fct(output.view(-1, output.size(-1)), labels.view(-1))
        
        return (loss, output) if loss is not None else output

