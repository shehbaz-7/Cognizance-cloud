import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { user_id, token } = await req.json();

    if (!user_id || !token) {
      return NextResponse.json({ error: 'user_id and token are required' }, { status: 400 });
    }

    await query(
      `INSERT INTO fcm_tokens (user_id, token)
       VALUES ($1, $2)
       ON CONFLICT (token)
       DO UPDATE SET user_id = EXCLUDED.user_id`,
      [user_id, token]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error upserting fcm token:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { tokens } = await req.json();

    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      return NextResponse.json({ error: 'tokens array is required' }, { status: 400 });
    }

    // Convert array to comma separated string for ANY()
    await query(
      `DELETE FROM fcm_tokens WHERE token = ANY($1::text[])`,
      [tokens]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting fcm tokens:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
