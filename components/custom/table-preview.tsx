'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'

type PreviewData = {
  headers: string[]
  rows: (string[] | Record<string, unknown>)[]
}

interface TablePreviewProps {
  data?: PreviewData
}

export function TablePreview({ data }: TablePreviewProps) {
  const [showAllRows, setShowAllRows] = useState(false)

  // Return early if no data
  if (!data?.headers || !data?.rows) {
    return null;
  }

  const toggleShowAllRows = () => {
    setShowAllRows((prev) => !prev)
  }

  // Ensure rows is an array before slicing
  const rows = Array.isArray(data.rows) ? data.rows : [];
  const visibleRows = showAllRows ? rows : rows.slice(0, 5)

  return (
    <div className="w-full max-w-[35rem] mx-auto mb-4">
      <div className="mt-4 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {data.headers.map((header, index) => (
                <TableHead key={index}>{header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRows.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {Array.isArray(row)
                  ? row.map((cell, cellIndex) => (
                      <TableCell key={cellIndex}>{String(cell ?? '')}</TableCell>
                    ))
                  : data.headers.map((header, cellIndex) => (
                      <TableCell key={cellIndex}>{String(row[header] ?? '')}</TableCell>
                    ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {rows.length > 5 && (
          <div className="mt-4 flex justify-between items-center">
            <p className="text-sm text-gray-500">
              {showAllRows
                ? `Showing all ${rows.length} rows`
                : `Showing 5 out of ${rows.length} rows`}
            </p>
            <Button onClick={toggleShowAllRows} variant="outline">
              {showAllRows ? 'Show Less' : 'Show More'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
