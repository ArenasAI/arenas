// components/Visualization/ChartContainer.tsx
import { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import * as THREE from 'three';
import { saveAs } from 'file-saver';

interface ChartProps {
  data: any[];
  type: string;
  options: {
    title: string;
    width: number;
    height: number;
    colors: string[];
    showLegend: boolean;
    showGrid: boolean;
    animations: boolean;
    labels: {
      x: string;
      y: string;
    };
  };
}

export const ChartContainer = ({ data, type, options }: ChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!chartRef.current) return;

    // Clear previous chart
    d3.select(chartRef.current).selectAll('*').remove();

    switch (type) {
      case 'line':
        renderLineChart();
        break;
      case 'bar':
        renderBarChart();
        break;
      case '3d':
        render3DChart();
        break;
      // Add more chart types
    }
  }, [data, type, options]);

  const renderLineChart = () => {
    const margin = { top: 20, right: 30, bottom: 30, left: 40 };
    const width = options.width - margin.left - margin.right;
    const height = options.height - margin.top - margin.bottom;

    const svg = d3.select(chartRef.current)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add chart elements
    // ... D3.js specific code for line chart
  };

  const render3DChart = () => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, options.width / options.height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();

    // Add 3D chart elements
    // ... Three.js specific code
  };

  const exportChart = async (format: 'png' | 'svg' | 'pdf') => {
    setIsExporting(true);
    try {
      switch (format) {
        case 'png':
          const canvas = chartRef.current?.querySelector('canvas');
          if (canvas) {
            canvas.toBlob((blob) => {
              if (blob) saveAs(blob, `chart-${Date.now()}.png`);
            });
          }
          break;
        case 'svg':
          const svgData = chartRef.current?.querySelector('svg')?.outerHTML;
          if (svgData) {
            const blob = new Blob([svgData], { type: 'image/svg+xml' });
            saveAs(blob, `chart-${Date.now()}.svg`);
          }
          break;
        // Add PDF export
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="chart-container">
      <div className="chart-controls">
        <h2>{options.title}</h2>
        <div className="export-buttons">
          <button 
            onClick={() => exportChart('png')}
            disabled={isExporting}
          >
            Export as PNG
          </button>
          <button 
            onClick={() => exportChart('svg')}
            disabled={isExporting}
          >
            Export as SVG
          </button>
        </div>
      </div>
      
      <div ref={chartRef} className="chart-content" />
      
      {options.showLegend && (
        <div className="chart-legend">
          {/* Render legend items */}
        </div>
      )}

      <style jsx>{`
        .chart-container {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          padding: 20px;
          margin: 20px;
        }

        .chart-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .export-buttons {
          display: flex;
          gap: 10px;
        }

        .chart-content {
          min-height: 400px;
        }

        .chart-legend {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #eee;
        }
      `}</style>
    </div>
  );
};
