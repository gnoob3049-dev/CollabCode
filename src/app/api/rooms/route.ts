import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function getDefaultFiles(language: string): string {
  const defaults: Record<string, Array<{ name: string; content: string }>> = {
    javascript: [{ name: 'index.js', content: "// Welcome to CollabCode!\nconsole.log('Hello, World!');\n" }],
    python: [{ name: 'main.py', content: "# Welcome to CollabCode!\nprint('Hello, World!')\n" }],
    typescript: [{ name: 'index.ts', content: "// Welcome to CollabCode!\nconsole.log('Hello, World!');\n" }],
  };

  const files = defaults[language] || [{ name: `main.${language}`, content: "// Welcome to CollabCode!\n" }];
  return JSON.stringify(files);
}

// GET: List all rooms for the current user
export async function GET() {
  try {
    const payload = await getCurrentUser();
    if (!payload) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const allRooms = await db.room.findMany({
      orderBy: { lastActiveAt: 'desc' },
    });

    // Filter rooms where user is owner or in collaborators
    const userRooms = allRooms.filter((room) => {
      if (room.ownerId === payload.userId) return true;
      try {
        const collaborators: string[] = JSON.parse(room.collaborators);
        return collaborators.includes(payload.userId);
      } catch {
        return false;
      }
    });

    const rooms = userRooms.map((room) => {
      let parsedFiles: Array<{ name: string; content: string }> = [];
      let collaborators: string[] = [];
      try {
        parsedFiles = JSON.parse(room.files);
      } catch { /* empty */ }
      try {
        collaborators = JSON.parse(room.collaborators);
      } catch { /* empty */ }

      return {
        id: room.id,
        name: room.name,
        inviteCode: room.inviteCode,
        isPublic: room.isPublic,
        language: room.language,
        files: parsedFiles,
        collaboratorCount: collaborators.length,
        ownerId: room.ownerId,
        createdAt: room.createdAt,
        lastActiveAt: room.lastActiveAt,
      };
    });

    return NextResponse.json({ rooms });
  } catch (error) {
    console.error('Rooms GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new room
export async function POST(request: NextRequest) {
  try {
    const payload = await getCurrentUser();
    if (!payload) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { name, language = 'javascript', files: customFiles, isReadOnly } = body;

    if (!name) {
      return NextResponse.json({ error: 'Room name is required' }, { status: 400 });
    }

    let inviteCode = generateInviteCode();
    // Ensure unique invite code
    let existing = await db.room.findUnique({ where: { inviteCode } });
    while (existing) {
      inviteCode = generateInviteCode();
      existing = await db.room.findUnique({ where: { inviteCode } });
    }

    const files = (Array.isArray(customFiles) && customFiles.length > 0)
      ? JSON.stringify(customFiles)
      : getDefaultFiles(language);
    const collaborators = JSON.stringify([payload.userId]);

    const room = await db.room.create({
      data: {
        name,
        language,
        inviteCode,
        ownerId: payload.userId,
        files,
        collaborators,
        ...(isReadOnly !== undefined && { isReadOnly }),
      },
    });

    return NextResponse.json({
      room: {
        id: room.id,
        name: room.name,
        inviteCode: room.inviteCode,
        isPublic: room.isPublic,
        isReadOnly: room.isReadOnly,
        language: room.language,
        files: JSON.parse(room.files),
      },
    });
  } catch (error) {
    console.error('Rooms POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}