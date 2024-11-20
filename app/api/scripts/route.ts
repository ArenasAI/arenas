import { NextResponse } from 'next/server';
import { databaseService } from '@/utils/services/database-service';

export async function POST(request: Request) {
  try {
    const { workspaceId, name, content, runtime } = await request.json();
    const script = await databaseService.createScript(workspaceId, name, content, runtime);
    return NextResponse.json(script);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create script' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { scriptId, updates } = await request.json();
    const script = await databaseService.updateScript(scriptId, updates);
    return NextResponse.json(script);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update script' }, { status: 500 });
  }
}
