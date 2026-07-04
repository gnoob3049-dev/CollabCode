import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { generateToken } from '@/lib/auth';

const AVATAR_COLORS = [
  '#06b6d4', '#f97316', '#ec4899', '#22c55e',
  '#a855f7', '#eab308', '#14b8a6', '#f43f5e',
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        avatarColor,
      },
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarColor: user.avatarColor,
      },
      token,
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error: any) {
    // Handle Prisma unique constraint violation (race condition)
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}