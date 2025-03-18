import { useEffect, useState } from 'react';
import { ChartResult } from '@/lib/sandbox';
import {
  BarChart as RechartsBarChart,
  LineChart as RechartsLineChart,
  ScatterChart as RechartsScatterChart,
  PieChart as RechartsPieChart,
  Bar,
  Line,
  Scatter,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface ChartDisplayProps {
  charts: ChartResult[];
}

export function ChartDisplay({ charts }: ChartDisplayProps) {
  return (
    <div className="space-y-8">
      {charts.map((chart, index) => (
        <div key={index} className="w-full h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <div>
              {chart.type === 'heatmap' && chart.image ? (
                <img 
                  src={chart.image} 
                  alt={chart.title} 
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : chart.type === 'bar' ? (
                <RechartsBarChart data={chart.elements}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name={chart.title} />
                </RechartsBarChart>
              ) : chart.type === 'line' ? (
                <RechartsLineChart data={chart.elements}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="value" name={chart.title} />
                </RechartsLineChart>
              ) : chart.type === 'scatter' ? (
                <RechartsScatterChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="x" name={chart.x_label} />
                  <YAxis dataKey="y" name={chart.y_label} />
                  <Tooltip />
                  <Legend />
                  <Scatter data={chart.elements} name={chart.title} />
                </RechartsScatterChart>
              ) : chart.type === 'pie' ? (
                <RechartsPieChart>
                  <Pie
                    data={chart.elements}
                    dataKey="value"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={150}
                    label
                  />
                  <Tooltip />
                  <Legend />
                </RechartsPieChart>
              ) : null}
            </div>
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  );
}