import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { promises as fs } from 'fs';
import path from 'path';
import process from 'process';

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

const TOKEN_PATH = path.join(process.cwd(), 'token.json');

export const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:3000/api/auth/callback/google'
);

export function extractSpreadsheetId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    if (!urlObj.hostname.includes('docs.google.com')) {
      return null;
    }
    
    // Handle different URL formats
    const patterns = [
      /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
      /\/d\/([a-zA-Z0-9-_]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  } catch (error) {
    return null;
  }
}

export function isValidGoogleSheetsUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.includes('docs.google.com') && urlObj.pathname.includes('/spreadsheets/d/');
    } catch {
      return false;
    }
  }

export async function validateSpreadsheetAccess(spreadsheetId: string): Promise<boolean> {
  try {
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
    await sheets.spreadsheets.get({ spreadsheetId });
    return true;
  } catch (error) {
    return false;
  }
}

async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH, 'utf-8');
    const credentials = JSON.parse(content);
    oauth2Client.setCredentials(credentials);
    return oauth2Client;
  } catch (err) {
    return null;
  }
}

export async function saveCredentials(credentials: any) {
  await fs.writeFile(TOKEN_PATH, JSON.stringify(credentials));
}

async function authorize() {
  const client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  throw new Error('No credentials found. User must authenticate first.');
}

export class GoogleSheetsService {
  private sheets: any;
  private auth: OAuth2Client | null = null;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      this.auth = await authorize();
      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
    } catch (error) {
      console.error('Failed to initialize Google Sheets service:', error);
      throw error;
    }
  }

  async createSpreadsheet(title: string) {
    try {
      const response = await this.sheets.spreadsheets.create({
        requestBody: {
          properties: {
            title,
          },
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating spreadsheet:', error);
      throw error;
    }
  }

  async updateValues(spreadsheetId: string, range: string, values: any[][]) {
    try {
      const response = await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error updating values:', error);
      throw error;
    }
  }

  async appendValues(spreadsheetId: string, range: string, values: any[][]) {
    try {
      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error appending values:', error);
      throw error;
    }
  }

  async getValues(spreadsheetId: string, range: string) {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });
      return response.data.values;
    } catch (error) {
      console.error('Error getting values:', error);
      throw error;
    }
  }

  async clearValues(spreadsheetId: string, range: string) {
    try {
      const response = await this.sheets.spreadsheets.values.clear({
        spreadsheetId,
        range,
      });
      return response.data;
    } catch (error) {
      console.error('Error clearing values:', error);
      throw error;
    }
  }

  async addSheet(spreadsheetId: string, title: string) {
    try {
      const response = await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{
            addSheet: {
              properties: {
                title,
              },
            },
          }],
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error adding sheet:', error);
      throw error;
    }
  }

  async deleteSheet(spreadsheetId: string, sheetId: number) {
    try {
      const response = await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{
            deleteSheet: {
              sheetId,
            },
          }],
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting sheet:', error);
      throw error;
    }
  }
} 