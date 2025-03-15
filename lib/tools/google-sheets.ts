import { GoogleSheetsService } from '../../services/google-sheets';
import { z } from 'zod';
import { Tool, ToolExecutionOptions } from 'ai';

const sheetsService = new GoogleSheetsService();

const parameters = z.object({
  operation: z.enum([
    'create_spreadsheet',
    'update_values',
    'append_values',
    'get_values',
    'clear_values',
    'add_sheet',
    'delete_sheet'
  ]).describe('The operation to perform on Google Sheets'),
  title: z.string().optional().describe('Title for new spreadsheet or sheet'),
  spreadsheetId: z.string().optional().describe('The ID of the spreadsheet'),
  range: z.string().optional().describe('The A1 notation of the range'),
  values: z.array(z.array(z.any())).optional().describe('The values to write'),
  sheetId: z.number().optional().describe('The ID of the sheet to delete')
});

export const googleSheets = {
  parameters,
  description: 'Perform operations on Google Sheets. User must authenticate first.',
  execute: async (args: z.infer<typeof parameters>, options: ToolExecutionOptions) => {
    try {
      switch (args.operation) {
        case 'create_spreadsheet': {
          if (!args.title) throw new Error('Title is required for creating spreadsheet');
          const result = await sheetsService.createSpreadsheet(args.title);
          return {
            spreadsheetId: result.spreadsheetId,
            spreadsheetUrl: result.spreadsheetUrl
          };
        }

        case 'update_values': {
          if (!args.spreadsheetId) throw new Error('Spreadsheet ID is required');
          if (!args.range) throw new Error('Range is required');
          if (!args.values) throw new Error('Values are required');
          const result = await sheetsService.updateValues(
            args.spreadsheetId,
            args.range,
            args.values
          );
          return {
            updatedRange: result.updatedRange,
            updatedRows: result.updatedRows
          };
        }

        case 'append_values': {
          if (!args.spreadsheetId) throw new Error('Spreadsheet ID is required');
          if (!args.range) throw new Error('Range is required');
          if (!args.values) throw new Error('Values are required');
          const result = await sheetsService.appendValues(
            args.spreadsheetId,
            args.range,
            args.values
          );
          return {
            updatedRange: result.updates.updatedRange,
            updatedRows: result.updates.updatedRows
          };
        }

        case 'get_values': {
          if (!args.spreadsheetId) throw new Error('Spreadsheet ID is required');
          if (!args.range) throw new Error('Range is required');
          const values = await sheetsService.getValues(args.spreadsheetId, args.range);
          return { values };
        }

        case 'clear_values': {
          if (!args.spreadsheetId) throw new Error('Spreadsheet ID is required');
          if (!args.range) throw new Error('Range is required');
          const result = await sheetsService.clearValues(args.spreadsheetId, args.range);
          return {
            clearedRange: result.clearedRange
          };
        }

        case 'add_sheet': {
          if (!args.spreadsheetId) throw new Error('Spreadsheet ID is required');
          if (!args.title) throw new Error('Sheet title is required');
          const result = await sheetsService.addSheet(args.spreadsheetId, args.title);
          return {
            sheetId: result.replies[0].addSheet.properties.sheetId,
            title: result.replies[0].addSheet.properties.title
          };
        }

        case 'delete_sheet': {
          if (!args.spreadsheetId) throw new Error('Spreadsheet ID is required');
          if (!args.sheetId) throw new Error('Sheet ID is required');
          await sheetsService.deleteSheet(args.spreadsheetId, args.sheetId);
          return {
            success: true,
            message: 'Sheet deleted successfully'
          };
        }

        default:
          throw new Error('Invalid operation');
      }
    } catch (error: any) {
      console.error('Google Sheets operation failed:', error);
      if (error.message?.includes('No credentials found')) {
        return {
          error: 'Authentication required',
          authUrl: '/api/auth/google'
        };
      }
      throw error;
    }
  }
} satisfies Tool; 