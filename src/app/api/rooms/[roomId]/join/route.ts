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
    const { inviteCode } = body;

    if (!inviteCode) {
      return NextResponse.json({ error: 'Invite code is required' }, { status: 400 });
    }

    const room = await db.room.findUnique({ where: { id: roomId } });
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // For private rooms, the invite code must match
    if (!room.isPublic && room.inviteCode !== inviteCode) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 403 });
    }

    // Parse collaborators and add user if not already there
    let collaborators: string[] = [];
    try {
      collaborators = JSON.parse(room.collaborators);
    } catch {
      collaborators = [];
    }

    if (collaborators.includes(payload.userId)) {
      // Already a collaborator, just return the room
      return NextResponse.json({
        room: {
          id: room.id,
          name: room.name,
          language: room.language,
        },
      });
    }

    collaborators.push(payload.userId);

    await db.room.update({
      where: { id: roomId },
      data: {
        collaborators: JSON.stringify(collaborators),
        lastActiveAt: new Date(),
      },
    });

    return NextResponse.json({
      room: {
        id: room.id,
        name: room.name,
        language: room.language,
      },
    });
  } catch (error) {
    console.error('Room join error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}