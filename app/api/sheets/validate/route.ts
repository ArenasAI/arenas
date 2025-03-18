import { GoogleSheetsService, validateSpreadsheetAccess } from '@/services/google-sheets';
import { getSession } from '@/lib/cached/cached-queries';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { spreadsheetId } = await request.json();
    if (!spreadsheetId) {
      return NextResponse.json({ error: 'Spreadsheet ID is required' }, { status: 400 });
    }
    
    const hasAccess = await validateSpreadsheetAccess(spreadsheetId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'No access to spreadsheet' }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error validating sheet access:', error);
    return NextResponse.json({ error: 'Failed to validate sheet access' }, { status: 500 });
  }
} 