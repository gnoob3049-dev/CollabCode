import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import archiver from 'archiver';

export async function GET(
  _request: NextRequest,
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

    // Check access: must be owner or collaborator
    const isOwner = room.ownerId === payload.userId;
    let collaboratorCount = 0;
    try {
      const collaborators: string[] = JSON.parse(room.collaborators);
      collaboratorCount = collaborators.length;
      if (!isOwner && !collaborators.includes(payload.userId)) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    } catch {
      if (!isOwner) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Parse files
    let parsedFiles: Array<{ name: string; content: string }> = [];
    try {
      parsedFiles = JSON.parse(room.files);
    } catch {
      // empty
    }

    // Create ZIP in memory
    const chunks: Uint8Array[] = [];
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.on('data', (chunk: Buffer) => {
      chunks.push(new Uint8Array(chunk));
    });

    // Add all room files to the ZIP
    for (const file of parsedFiles) {
      archive.append(file.content, { name: file.name });
    }

    // Add README.md
    const readmeContent = [
      `# ${room.name}`,
      '',
      `**Language:** ${room.language}`,
      `**Exported:** ${new Date().toISOString()}`,
      `**Collaborators:** ${collaboratorCount + (isOwner ? 1 : 0)}`,
      '',
      '---',
      '',
      'This project was exported from CollabCode — a real-time collaborative code editor.',
    ].join('\n');

    archive.append(readmeContent, { name: 'README.md' });

    // Finalize and wait
    await new Promise<void>((resolve, reject) => {
      archive.on('end', resolve);
      archive.on('error', reject);
      archive.finalize();
    });

    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const zipBuffer = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      zipBuffer.set(chunk, offset);
      offset += chunk.length;
    }

    const safeName = room.name.replace(/[^a-zA-Z0-9_\-.]/g, '_');

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${safeName}.zip"`,
        'Content-Length': String(zipBuffer.length),
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}