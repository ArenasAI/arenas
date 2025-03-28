import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import type { CellChange, ChangeSource } from 'handsontable/common';
import 'handsontable/dist/handsontable.full.min.css';
import { Button } from '../ui/button';
import { Download } from 'lucide-react';

// Register Handsontable modules
registerAllModules();

interface SpreadsheetEditorProps {
  data: Record<string, unknown>[];
  headers: string[];
  onDataChange?: (data: Record<string, unknown>[]) => void;
}

export function SpreadsheetEditor({ data, headers, onDataChange }: SpreadsheetEditorProps) {
  const handleDataChange = (changes: CellChange[] | null, source: ChangeSource) => {
    if (changes && source === 'edit') {
      const newData = [...data];
      changes.forEach(([row, prop, , newValue]) => {
        newData[row][prop as string] = newValue;
      });
      onDataChange?.(newData);
    }
  };

  const handleExport = () => {
    const csv = data.map(row => Object.values(row).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'cleaned_data.csv';
    link.click();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={handleExport} variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>
      <div className="overflow-x-auto">
        <HotTable
          data={data}
          colHeaders={headers}
          rowHeaders={true}
          height="auto"
          licenseKey="non-commercial-and-evaluation"
          contextMenu={true}
          filters={true}
          dropdownMenu={true}
          multiColumnSorting={true}
          afterChange={handleDataChange}
          className="htCenter"
          stretchH="all"
          autoWrapRow={true}
          autoWrapCol={true}
          readOnly={false}
          columnSorting={true}
          comments={true}
          cell={[
            {
              className: 'htMiddle',
              readOnly: false,
              row: 0,
              col: 0
            },
          ]}
        />
      </div>
    </div>
  );
} 