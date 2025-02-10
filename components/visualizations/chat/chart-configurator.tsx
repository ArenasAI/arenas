import { useState } from 'react';

interface ConfiguratorProps {
  onConfigChange: (config: any) => void;
}

export const ChartConfigurator = ({ onConfigChange }: ConfiguratorProps) => {
  const [config, setConfig] = useState({
    type: 'line',
    options: {
      title: '',
      width: 800,
      height: 600,
      showLegend: true,
      showGrid: true,
      animations: true,
      colors: ['#1f77b4', '#ff7f0e', '#2ca02c'],
      labels: {
        x: '',
        y: ''
      }
    }
  });

  const handleChange = (field: string, value: any) => {
    const newConfig = {
      ...config,
      options: {
        ...config.options,
        [field]: value
      }
    };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  return (
    <div className="chart-configurator">
      <h3>Chart Configuration</h3>
      
      <div className="config-section">
        <label>
          Chart Type
          <select 
            value={config.type}
            onChange={(e) => handleChange('type', e.target.value)}
          >
            <option value="line">Line Chart</option>
            <option value="bar">Bar Chart</option>
            <option value="pie">Pie Chart</option>
            <option value="3d">3D Chart</option>
          </select>
        </label>

        <label>
          Title
          <input 
            type="text"
            value={config.options.title}
            onChange={(e) => handleChange('title', e.target.value)}
          />
        </label>

        {/* Add more configuration options */}
      </div>

      <style jsx>{`
        .chart-configurator {
          padding: 20px;
          background: #f5f5f5;
          border-radius: 8px;
        }

        .config-section {
          display: grid;
          gap: 15px;
          margin-top: 15px;
        }

        label {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
      `}</style>
    </div>
  );
};
