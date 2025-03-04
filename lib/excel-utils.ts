import ExcelJS from 'exceljs';
import { WorkbookData, WorksheetData } from './workbook';
import * as XLSX from 'xlsx';
import { processCSVData, processExcelData } from '@/components/visualizations/data-processor';

export async function readExcelFile(filePath: string): Promise<WorkbookData> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  
  const sheets: WorksheetData[] = [];
  
  workbook.eachSheet((worksheet) => {
    const columns: string[] = [];
    const rows: (string | number | null)[][] = [];
    
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      columns.push(cell.value?.toString() || '');
    });
    
    for (let rowIndex = 2; rowIndex <= worksheet.rowCount; rowIndex++) {
      const row = worksheet.getRow(rowIndex);
      const rowData: (string | number | null)[] = [];
      
      row.eachCell((cell) => {
        rowData.push(cell.value as string | number | null);
      });
      
      rows.push(rowData);
    }
    
    sheets.push({
      name: worksheet.name,
      columns,
      rows,
    });
  });
  
  return {
    filename: filePath.split('/').pop() || 'unknown.xlsx',
    sheets,
  };
}

export async function updateExcelFile(
  filePath: string,
  instructions: any
): Promise<any> {
  try {
    // Load the workbook
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    
    // Apply instructions to the workbook
    if (instructions.addSheet) {
      const sheet = workbook.addWorksheet(instructions.addSheet.name);
      if (instructions.addSheet.data) {
        // Add headers
        sheet.columns = Object.keys(instructions.addSheet.data[0]).map(key => ({
          header: key,
          key
        }));
        
        // Add rows
        sheet.addRows(instructions.addSheet.data);
      }
    }
    
    if (instructions.updateSheet) {
      const sheet = workbook.getWorksheet(instructions.updateSheet.name);
      if (sheet && instructions.updateSheet.data) {
        // Clear existing data
        sheet.clearRows();
        
        // Add headers
        sheet.columns = Object.keys(instructions.updateSheet.data[0]).map(key => ({
          header: key,
          key
        }));
        
        // Add rows
        sheet.addRows(instructions.updateSheet.data);
      }
    }
    
    if (instructions.deleteSheet) {
      const sheet = workbook.getWorksheet(instructions.deleteSheet);
      if (sheet) {
        workbook.removeWorksheet(sheet.id);
      }
    }
    
    // Save the workbook
    await workbook.xlsx.writeFile(filePath);
    
    // Convert to JSON for response
    const result = {};
    workbook.eachSheet((sheet) => {
      const data = [];
      const headers = [];
      
      // Get headers from first row
      sheet.getRow(1).eachCell((cell) => {
        headers.push(cell.value);
      });
      
      // Get data from rows
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) { // Skip header row
          const rowData = {};
          row.eachCell((cell, colNumber) => {
            rowData[headers[colNumber - 1]] = cell.value;
          });
          data.push(rowData);
        }
      });
      
      result[sheet.name] = data;
    });
    
    return result;
  } catch (error) {
    console.error('Error updating Excel file:', error);
    throw error;
  }
}

export function parseExcelBuffer(buffer: ArrayBuffer): any[] {
  return processExcelData(buffer);
}

export function parseCSVText(text: string): any[] {
  return processCSVData(text);
}

export function convertToExcel(data: any[]): ArrayBuffer {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
}