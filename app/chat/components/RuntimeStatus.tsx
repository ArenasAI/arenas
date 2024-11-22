import React from 'react';

interface RuntimeStatusProps {
  isProcessing: boolean;
}

const RuntimeStatus: React.FC<RuntimeStatusProps> = ({ isProcessing }) => {
  return (
    <div className="flex items-center space-x-2">
      <div
        className={`h-2 w-2 rounded-full ${
          isProcessing ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'
        }`}
      />
      <span className="text-sm text-gray-600">
        {isProcessing ? 'Processing...' : 'Ready'}
      </span>
    </div>
  );
};

export default RuntimeStatus;
