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

/**
 * Strip TypeScript-specific syntax to produce valid JavaScript.
 * Removes type annotations, interfaces, type aliases, and generic parameters.
 */
function stripTypescriptTypes(code: string): string {
  let result = code;

  // Remove interface declarations (with body)
  result = result.replace(/^\s*interface\s+\w+(\s*<[^>]*>)?\s*\{[\s\S]*?\}\s*$/gm, '');

  // Remove type alias declarations
  result = result.replace(/^\s*type\s+\w+(\s*<[^>]*>)?\s*=\s*[^;]+;/gm, '');

  // Remove generic type parameters after function/class names: <T>, <T extends U>
  result = result.replace(/<[^>]*>/g, '');

  // Remove parameter type annotations: param: Type  ->  param
  result = result.replace(/(\w+)\s*:\s*[^,)=;]+/g, '$1');

  // Remove return type annotations: ): Type =>  ->  ) =>
  result = result.replace(/(\))\s*:\s*[^{;]+(?=\s*[{;])/g, '$1');

  // Remove 'as Type' casts
  result = result.replace(/\s+as\s+\S+/g, '');

  // Remove standalone type-only imports
  result = result.replace(/^\s*import\s+type\s+[^;]+;\s*$/gm, '');

  // Remove type keywords in variable declarations: const x: number = ...
  // (already handled by the param type annotation removal above)

  return result;
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

    // ─── HTML: return the HTML code as output with isHtml flag ───
    if (language === 'html') {
      return NextResponse.json({
        output: code,
        isHtml: true,
        exitCode: 0,
      });
    }

    // ─── CSS: return suggestion to use Preview panel ───
    if (language === 'css') {
      return NextResponse.json({
        output: 'CSS preview available in the Preview panel',
        isCss: true,
        exitCode: 0,
      });
    }

    // ─── Go: not supported in sandbox ───
    if (language === 'go') {
      return NextResponse.json({
        output: 'Go execution is not supported in the sandbox. Please use a local Go environment.',
        exitCode: 0,
      });
    }

    // ─── Rust: not supported in sandbox ───
    if (language === 'rust') {
      return NextResponse.json({
        output: 'Rust execution is not supported in the sandbox.',
        exitCode: 0,
      });
    }

    // ─── Java: not supported in sandbox ───
    if (language === 'java') {
      return NextResponse.json({
        output: 'Java execution is not supported in the sandbox.',
        exitCode: 0,
      });
    }

    // ─── C++: not supported in sandbox ───
    if (language === 'cpp') {
      return NextResponse.json({
        output: 'C++ execution is not supported in the sandbox.',
        exitCode: 0,
      });
    }

    // ─── SQL: run via sqlite3 :memory: ───
    if (language === 'sql') {
      if (!isCodeSafe(code)) {
        return NextResponse.json(
          { error: 'Code contains forbidden patterns' },
          { status: 400 }
        );
      }

      return new Promise<NextResponse>((resolve) => {
        const escapedCode = code.replace(/'/g, "''");
        const command = `echo '${escapedCode}' | sqlite3 :memory: -header -column`;

        exec(command, { timeout: 5000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
          resolve(
            NextResponse.json({
              output: stdout || stderr || 'Query executed with no output.',
              error: stderr || null,
              exitCode: error?.code ?? 0,
            })
          );
        });
      });
    }

    // ─── JavaScript ───
    if (language === 'javascript') {
      if (!isCodeSafe(code)) {
        return NextResponse.json(
          { error: 'Code contains forbidden patterns (file system, network, or system access is not allowed)' },
          { status: 400 }
        );
      }

      return new Promise<NextResponse>((resolve) => {
        const command = `node -e ${JSON.stringify(code)}`;
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
    }

    // ─── TypeScript: strip types and run with node ───
    if (language === 'typescript') {
      if (!isCodeSafe(code)) {
        return NextResponse.json(
          { error: 'Code contains forbidden patterns (file system, network, or system access is not allowed)' },
          { status: 400 }
        );
      }

      const jsCode = stripTypescriptTypes(code);

      return new Promise<NextResponse>((resolve) => {
        const command = `node -e ${JSON.stringify(jsCode)}`;
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
    }

    // ─── Python ───
    if (language === 'python') {
      if (!isCodeSafe(code)) {
        return NextResponse.json(
          { error: 'Code contains forbidden patterns (file system, network, or system access is not allowed)' },
          { status: 400 }
        );
      }

      return new Promise<NextResponse>((resolve) => {
        const command = `python3 -c ${JSON.stringify(code)}`;
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
    }

    return NextResponse.json(
      { error: `Unsupported language: ${language}` },
      { status: 400 }
    );
  } catch (error) {
    console.error('Run error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}