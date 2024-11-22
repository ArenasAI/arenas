import asyncio
import subprocess
import sys
import json
from typing import Dict, Any
import numpy as np
import pandas as pd
from contextlib import redirect_stdout, redirect_stderr
import io
import traceback

class PythonExecutor:
    def __init__(self):
        self.globals = {}
        self.locals = {}
        
    async def execute(self, code: str, data: Dict[str, Any] = None) -> Dict[str, Any]:
        output_buffer = io.StringIO()
        error_buffer = io.StringIO()
        
        try:
            # Inject data into environment if provided
            if data:
                self.globals['df'] = pd.DataFrame(data)
                
            # Add common libraries to globals
            self.globals.update({
                'np': np,
                'pd': pd,
                'plt': plt
            })
            
            with redirect_stdout(output_buffer), redirect_stderr(error_buffer):
                exec(code, self.globals, self.locals)
                
            return {
                'status': 'success',
                'output': output_buffer.getvalue(),
                'error': None,
                'variables': self._get_serializable_variables()
            }
            
        except Exception as e:
            return {
                'status': 'error',
                'output': output_buffer.getvalue(),
                'error': {
                    'type': type(e).__name__,
                    'message': str(e),
                    'traceback': traceback.format_exc()
                },
                'variables': {}
            }
    
    def _get_serializable_variables(self) -> Dict[str, Any]:
        """Extract variables that can be serialized to JSON"""
        result = {}
        for key, value in self.locals.items():
            if isinstance(value, (pd.DataFrame, pd.Series)):
                result[key] = value.to_dict()
            elif isinstance(value, np.ndarray):
                result[key] = value.tolist()
            elif isinstance(value, (int, float, str, bool, list, dict)):
                result[key] = value
        return result
