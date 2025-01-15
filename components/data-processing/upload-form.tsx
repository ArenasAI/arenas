// components/DataProcessing/UploadForm.tsx
import { useState } from 'react';
import { Button } from "../ui";

export const DataUploadForm = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [validation, setValidation] = useState(null);

  const handleUpload = async () => {
    if (!file) return;
    
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/v1/data/upload', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      setValidation(result);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        accept=".csv,.xlsx,.json,.parquet"
        className="block w-full text-sm text-gray-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-full file:border-0
          file:text-sm file:font-semibold
          file:bg-violet-50 file:text-violet-700
          hover:file:bg-violet-100"
      />
      <Button
        onClick={handleUpload}
        disabled={!file || loading}
        loading={loading}
      >
        Upload Dataset
      </Button>
      
      {validation && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold">Dataset Overview</h3>
          <pre className="mt-2 p-4 bg-gray-50 rounded-lg">
            {JSON.stringify(validation, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
