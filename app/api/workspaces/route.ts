import { NextResponse } from 'next/server';
import { databaseService } from '@/utils/services/database-service';

export async function GET() {
  try {
    const workspaces = await databaseService.getWorkspaces();
    return NextResponse.json(workspaces);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch workspaces' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, description } = await request.json();
    const workspace = await databaseService.createWorkspace(name, description);
    return NextResponse.json(workspace);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create workspace' }, { status: 500 });
  }
}
