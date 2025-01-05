import React, { useState, useEffect, useCallback } from 'react';
import { Button, Select, Card, Space, Table, Progress } from 'antd';
import { toast } from 'sonner';
import { notification } from 'antd';

interface AIModelManagerProps {
  datasetId: string;
}

export const AIModelManager: React.FC<AIModelManagerProps> = ({ datasetId }) => {
  const [analysis, setAnalysis] = useState(null);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [training, setTraining] = useState(false);
  const [modelResults, setModelResults] = useState<any>(null);
  const [progress, setProgress] = useState<number>(0);

  const analyzeDataset = useCallback(async () => {
    try {
      const response = await fetch(`/api/ai/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dataset_id: datasetId }),
      });
      
      const data = await response.json();
      setAnalysis(data);
    } catch (error) {
      toast.error('Failed to analyze dataset');
      console.error(error);
    }
  }, [datasetId]);

  useEffect(() => {
    analyzeDataset();
  }, [datasetId, analyzeDataset]);

  const trainModel = async () => {
    setTraining(true);
    try {
      const response = await fetch(`/api/ai/train`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataset_id: datasetId,
          model_type: selectedModel,
        }),
      });
      const { task_id } = await response.json();
      setTaskId(task_id);
      pollTaskStatus(task_id);
    } catch (error) {
      notification.error({ message: 'Training Failed' });
      console.error(error);
    }
  };

  const pollTaskStatus = async (taskId: string) => {
    const interval = setInterval(async () => {
      const response = await fetch(`/api/ai/train/status/${taskId}`);
      const data = await response.json();
      
      setProgress(data.progress);

      if (data.state === 'SUCCESS') {
        clearInterval(interval);
        setModelResults(data.result);
        setTraining(false);
        notification.success({ message: 'Training Complete' });
      } else if (data.state === 'FAILURE') {
        clearInterval(interval);
        setTraining(false);
        notification.error({ message: data.error });
      }
    }, 2000); // Poll every 2 seconds
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {analysis && (
        <Card title="Dataset Analysis">
          <p>Problem Type: {analysis.problem_type}</p>
          <p>Target Column: {analysis.target_column}</p>
          
          <Select
            style={{ width: 200 }}
            placeholder="Select a model"
            value={selectedModel}
            onChange={setSelectedModel}
          >
            {analysis.suggested_models.map((model: string) => (
              <Select.Option key={model} value={model}>
                {model}
              </Select.Option>
            ))}
          </Select>
          
          <Button 
            type="primary"
            loading={training}
            onClick={trainModel}
            disabled={!selectedModel}
          >
            {training ? `Training (${progress}%)` : 'Train Model'}
          </Button>
          
          {training && (
            <Progress percent={progress} status="active" />
          )}
        </Card>
      )}

      {modelResults && (
        <Card title="Model Results">
          <Table
            dataSource={Object.entries(modelResults.metrics).map(([key, value]) => ({
              metric: key,
              value: value,
            }))}
            columns={[
              { title: 'Metric', dataIndex: 'metric' },
              { title: 'Value', dataIndex: 'value' },
            ]}
            pagination={false}
          />
        </Card>
      )}
    </Space>
  );
};