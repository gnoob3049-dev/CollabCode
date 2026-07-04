import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const payload = await getCurrentUser();
    if (!payload) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { roomId } = await params;
    const body = await request.json();
    const { files } = body;

    if (!files || !Array.isArray(files)) {
      return NextResponse.json({ error: 'Files are required' }, { status: 400 });
    }

    const room = await db.room.findUnique({ where: { id: roomId } });
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Verify user is a collaborator
    const isOwner = room.ownerId === payload.userId;
    let isCollaborator = false;
    try {
      const collaborators: string[] = JSON.parse(room.collaborators);
      isCollaborator = collaborators.includes(payload.userId);
    } catch { /* empty */ }

    if (!isOwner && !isCollaborator) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await db.room.update({
      where: { id: roomId },
      data: {
        files: JSON.stringify(files),
        lastActiveAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Room save error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}