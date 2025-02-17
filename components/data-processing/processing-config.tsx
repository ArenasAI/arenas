// components/DataProcessing/ProcessingConfig.tsx
import { useState } from 'react';
import { toast } from 'sonner';

const AVAILABLE_OPERATIONS = [
  { value: 'remove_duplicates', label: 'Remove Duplicates' },
  { value: 'fill_missing', label: 'Fill Missing Values' },
  { value: 'drop_columns', label: 'Drop Columns' }
] as const;

interface ProcessingConfigProps {
  fileId: string;
  onProcessingComplete: () => void;
}

export const ProcessingConfig: React.FC<ProcessingConfigProps> = ({ 
  fileId, 
  onProcessingComplete 
}) => {
  const [operations, setOperations] = useState<ProcessingOperation[]>([]);
  const [loading, setLoading] = useState(false);

  const handleAddOperation = (operation: ProcessingOperation) => {
    setOperations([...operations, operation]);
  };

  const handleProcess = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/files/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_id: fileId, operations }),
      });
      
      if (!response.ok) {
        throw new Error('Processing failed');
      }
      
      const { task_id } = await response.json();
      toast.success("processing your dataset!")
      
      // Start polling for task status
      pollTaskStatus(task_id);
    } catch (error) {
      console.error('Processing failed:', error);
      toast.error("processing failed!");
    } finally {
      setLoading(false);
    }
  };

  const pollTaskStatus = async (taskId: string) => {
    const interval = setInterval(async () => {
      const response = await fetch(`/api/v1/data/status/${taskId}`);
      const status = await response.json();
      
      if (status.status === 'completed') {
        clearInterval(interval);
        onProcessingComplete();
        toast.success("your dataset has been processed successfully");
      } else if (status.status === 'failed') {
        clearInterval(interval);
        toast.error("an unexpected error occured!");
      }
    }, 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Select
          options={AVAILABLE_OPERATIONS}
          onChange={handleAddOperation}
          placeholder="Add operation"
          disabled={loading}
        />
      </div>
      
      <div className="space-y-2">
        {operations.map((op, index) => (
          <div key={index} className="flex items-center gap-2">
            <span>{op.type}</span>
            <button 
              onClick={() => setOperations(ops => ops.filter((_, i) => i !== index))}
              disabled={loading}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <Button
        onClick={handleProcess}
        disabled={operations.length === 0 || loading}
        loading={loading}
      >
        {loading ? 'Processing...' : 'Process Dataset'}
      </Button>
    </div>
  );
};
