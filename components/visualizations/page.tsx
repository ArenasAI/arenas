import { DataVisualization } from '@/components/visualizations/plot';

export default function VisualizationsPage() {
  // Example data
  const data = [{
    type: 'scatter',
    mode: 'lines+markers',
    x: [1, 2, 3, 4],
    y: [10, 15, 13, 17],
    marker: { color: 'blue' }
  }];

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Visualization</h1>
      <div className="w-full h-[500px] bg-background border border-border rounded-lg p-4">
        <DataVisualization data={data} />
      </div>
    </div>
  );
}
