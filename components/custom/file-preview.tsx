'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import Papa from 'papaparse';
import * as XLSX from 'xlsx'
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

interface FilePreviewProps {
  onDataParsed: (data: PreviewData) => void
}

export function FilePreview({ onDataParsed }: FilePreviewProps) {
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)
  const [showAllRows, setShowAllRows] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    const reader = new FileReader()

    reader.onload = (e) => {
      const content = e.target?.result as string
      let data: PreviewData

      if (file.name.endsWith('.csv')) {
        const result = Papa.parse(content, { header: true })
        data = {
          headers: result.meta.fields || [],
          rows: result.data as Record<string, unknown>[],
        }
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const workbook = XLSX.read(content, { type: 'binary' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 })
        data = {
          headers: jsonData[0] as string[],
          rows: jsonData.slice(1) as string[][],
        }
      } else if (file.name.endsWith('.json')) {
        const jsonData = JSON.parse(content)
        if (Array.isArray(jsonData) && jsonData.length > 0) {
          data = {
            headers: Object.keys(jsonData[0]),
            rows: jsonData,
          }
        } else {
          throw new Error('Invalid JSON format')
        }
      } else {
        throw new Error('Unsupported file format')
      }

      setPreviewData(data)
      setShowAllRows(false)
      onDataParsed(data)
    }

    if (file.name.endsWith('.csv') || file.name.endsWith('.json')) {
      reader.readAsText(file)
    } else {
      reader.readAsBinaryString(file)
    }
  }, [onDataParsed])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
        '.xlsx',
      ],
      'application/vnd.ms-excel': ['.xls'],
      'application/json': ['.json'],
    },
  })

  const toggleShowAllRows = () => {
    setShowAllRows((prev) => !prev)
  }

  const visibleRows = showAllRows ? previewData?.rows : previewData?.rows.slice(0, 5)

  return (
    <div className="w-full max-w-[35rem] mx-auto mb-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the file here ...</p>
        ) : (
          <p>Drag and drop a CSV, Excel, or JSON file here, or click to select a file</p>
        )}
      </div>
      {previewData && (
        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {previewData.headers.map((header, index) => (
                  <TableHead key={index}>{header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleRows?.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {Array.isArray(row)
                    ? row.map((cell, cellIndex) => (
                        <TableCell key={cellIndex}>{String(cell)}</TableCell>
                      ))
                    : previewData.headers.map((header, cellIndex) => (
                        <TableCell key={cellIndex}>{String(row[header] ?? '')}</TableCell>
                      ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {previewData.rows.length > 5 && (
            <div className="mt-4 flex justify-between items-center">
              <p className="text-sm text-gray-500">
                {showAllRows
                  ? `Showing all ${previewData.rows.length} rows`
                  : `Showing 5 out of ${previewData.rows.length} rows`}
              </p>
              <Button onClick={toggleShowAllRows} variant="outline">
                {showAllRows ? 'Show Less' : 'Show More'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

