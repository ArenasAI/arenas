import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DataTablePreviewProps {
  data: Array<Array<string | number>>;
  fileName: string;
  onClose: () => void;
}

export function DataTablePreview({ data, fileName, onClose }: DataTablePreviewProps) {
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState(false);
  
  // Show 5 rows per page when collapsed, more when expanded
  const rowsPerPage = expanded ? 10 : 5;
  const totalPages = Math.ceil(data.length / rowsPerPage);
  
  // Get column headers (first row) and data rows
  const headers = data[0] || [];
  const rows = data.slice(1);
  
  // Get current page of data
  const startIndex = page * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentPageRows = rows.slice(startIndex, endIndex);
  
  // Limit the number of columns shown to prevent overflow
  const maxColumns = expanded ? headers.length : Math.min(5, headers.length);
  const hasMoreColumns = headers.length > maxColumns;

  return (
    <div className={cn(
      "border rounded-md overflow-hidden bg-card transition-all duration-200",
      expanded ? "fixed inset-4 z-50" : "max-h-[300px]"
    )}>
      <div className="flex items-center justify-between p-2 bg-muted border-b">
        <div className="font-medium truncate max-w-[200px]">
          {fileName}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setExpanded(!expanded)}
            className="h-8 w-8"
          >
            {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X size={16} />
          </Button>
        </div>
      </div>
      
      <div className={cn(
        "overflow-auto",
        expanded ? "h-[calc(100%-6rem)]" : "max-h-[200px]"
      )}>
        <Table>
          <TableHeader>
            <TableRow>
              {headers.slice(0, maxColumns).map((header, index) => (
                <TableHead key={index} className="whitespace-nowrap">
                  {String(header)}
                </TableHead>
              ))}
              {hasMoreColumns && (
                <TableHead className="text-muted-foreground">
                  +{headers.length - maxColumns} more
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentPageRows.length > 0 ? (
              currentPageRows.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {row.slice(0, maxColumns).map((cell, cellIndex) => (
                    <TableCell key={cellIndex} className="whitespace-nowrap">
                      {String(cell)}
                    </TableCell>
                  ))}
                  {hasMoreColumns && (
                    <TableCell className="text-muted-foreground">
                      ...
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={maxColumns + (hasMoreColumns ? 1 : 0)} className="text-center py-4">
                  No data available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-2 border-t bg-muted">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(startIndex + rowsPerPage, rows.length)} of {rows.length} rows
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft size={16} />
            </Button>
            <span className="text-sm mx-2">
              {page + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}