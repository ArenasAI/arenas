import React from 'react';

interface RuntimeSelectorProps {
  selectedRuntime: string;
  onRuntimeChange: (runtime: string) => void;
}

const RuntimeSelector: React.FC<RuntimeSelectorProps> = ({
  selectedRuntime,
  onRuntimeChange,
}) => {
  const runtimes = ['python', 'r', 'julia'];

  return (
    <div className="flex items-center space-x-2">
      <label className="text-sm font-medium text-gray-700">Runtime:</label>
      <select
        value={selectedRuntime}
        onChange={(e) => onRuntimeChange(e.target.value)}
        className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
      >
        {runtimes.map((runtime) => (
          <option key={runtime} value={runtime}>
            {runtime.charAt(0).toUpperCase() + runtime.slice(1)}
          </option>
        ))}
      </select>
    </div>
  );
};

export default RuntimeSelector;
