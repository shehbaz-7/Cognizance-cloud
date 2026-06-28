import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  try {
    const result = await query(
      'SELECT skill_id, type, messages FROM user_chats WHERE user_id = $1',
      [userId]
    );

    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching chats:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { user_id, skill_id, type, messages } = await req.json();

    if (!user_id || !type || !messages) {
      return NextResponse.json({ error: 'user_id, type, and messages are required' }, { status: 400 });
    }

    await query(
      `INSERT INTO user_chats (user_id, skill_id, type, messages)
       VALUES ($1, $2, $3, $4::jsonb)
       ON CONFLICT (user_id, skill_id, type)
       DO UPDATE SET messages = EXCLUDED.messages`,
      [user_id, skill_id || null, type, JSON.stringify(messages)]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error upserting chat:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
