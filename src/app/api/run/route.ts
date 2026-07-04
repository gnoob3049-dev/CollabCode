import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { getCurrentUser } from '@/lib/auth';

const FORBIDDEN_PATTERNS = [
  'require("fs")',
  "require('fs')",
  'require("child_process")',
  "require('child_process')",
  'import fs',
  'import child_process',
  'import("fs")',
  "import('fs')",
  'process.exit',
  'require("net")',
  "require('net')",
  'require("http")',
  "require('http')",
  'require("https")',
  "require('https')",
  'require("os")',
  "require('os')",
  '__dirname',
  '__filename',
  'fs.readFileSync',
  'fs.writeFile',
  'fs.unlink',
];

function isCodeSafe(code: string): boolean {
  return FORBIDDEN_PATTERNS.every((pattern) => !code.includes(pattern));
}

export async function POST(request: NextRequest) {
  try {
    const payload = await getCurrentUser();
    if (!payload) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { code, language } = body;

    if (!code || !language) {
      return NextResponse.json(
        { error: 'Code and language are required' },
        { status: 400 }
      );
    }

    if (!isCodeSafe(code)) {
      return NextResponse.json(
        { error: 'Code contains forbidden patterns (file system, network, or system access is not allowed)' },
        { status: 400 }
      );
    }

    let command: string;
    if (language === 'javascript' || language === 'typescript') {
      command = `node -e ${JSON.stringify(code)}`;
    } else if (language === 'python') {
      command = `python3 -c ${JSON.stringify(code)}`;
    } else {
      return NextResponse.json(
        { error: `Unsupported language: ${language}` },
        { status: 400 }
      );
    }

    return new Promise<NextResponse>((resolve) => {
      exec(command, { timeout: 5000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
        if (error && !stdout && !stderr) {
          resolve(
            NextResponse.json({
              output: '',
              error: error.message,
              exitCode: error.code ?? 1,
            })
          );
          return;
        }

        resolve(
          NextResponse.json({
            output: stdout || '',
            error: stderr || null,
            exitCode: error?.code ?? 0,
          })
        );
      });
    });
  } catch (error) {
    console.error('Run error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}