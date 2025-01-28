'use client'

import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'

export function DataView({ data }: { data: any[] }) {
  const chartData = useMemo(() => {
    // Transform your data for visualization
    return data
  }, [data])

  return (
    <div className="h-full w-full p-4">
      <BarChart width={400} height={300} data={chartData}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="value" fill="#8884d8" />
      </BarChart>
    </div>
  )
}
