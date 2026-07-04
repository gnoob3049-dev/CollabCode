import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET: Get room data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const payload = await getCurrentUser();
    const { roomId } = await params;

    const room = await db.room.findUnique({ where: { id: roomId } });
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // If private, verify user is a collaborator
    if (!room.isPublic) {
      if (!payload) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }

      const isOwner = room.ownerId === payload.userId;
      let isCollaborator = false;
      try {
        const collaborators: string[] = JSON.parse(room.collaborators);
        isCollaborator = collaborators.includes(payload.userId);
      } catch { /* empty */ }

      if (!isOwner && !isCollaborator) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    let parsedFiles: Array<{ name: string; content: string }> = [];
    let collaborators: string[] = [];
    try {
      parsedFiles = JSON.parse(room.files);
    } catch { /* empty */ }
    try {
      collaborators = JSON.parse(room.collaborators);
    } catch { /* empty */ }

    return NextResponse.json({
      room: {
        id: room.id,
        name: room.name,
        inviteCode: room.inviteCode,
        isPublic: room.isPublic,
        language: room.language,
        files: parsedFiles,
        collaborators,
        ownerId: room.ownerId,
        createdAt: room.createdAt,
        lastActiveAt: room.lastActiveAt,
      },
    });
  } catch (error) {
    console.error('Room GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update room settings
export async function PUT(
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
    const { name, isPublic, language } = body;

    const room = await db.room.findUnique({ where: { id: roomId } });
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (room.ownerId !== payload.userId) {
      return NextResponse.json({ error: 'Only the room owner can update settings' }, { status: 403 });
    }

    const updated = await db.room.update({
      where: { id: roomId },
      data: {
        ...(name !== undefined && { name }),
        ...(isPublic !== undefined && { isPublic }),
        ...(language !== undefined && { language }),
      },
    });

    return NextResponse.json({
      room: {
        id: updated.id,
        name: updated.name,
        inviteCode: updated.inviteCode,
        isPublic: updated.isPublic,
        language: updated.language,
        files: JSON.parse(updated.files),
        collaborators: JSON.parse(updated.collaborators),
        ownerId: updated.ownerId,
        createdAt: updated.createdAt,
        lastActiveAt: updated.lastActiveAt,
      },
    });
  } catch (error) {
    console.error('Room PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete a room
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const payload = await getCurrentUser();
    if (!payload) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { roomId } = await params;
    const room = await db.room.findUnique({ where: { id: roomId } });
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (room.ownerId !== payload.userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    await db.room.delete({ where: { id: roomId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Room DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}