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
      'SELECT skills FROM user_skills WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ skills: null }); // Match Supabase behavior
    }

    return NextResponse.json({ skills: result.rows[0].skills });
  } catch (error: any) {
    console.error('Error fetching skills:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { user_id, skills } = await req.json();

    if (!user_id || !skills) {
      return NextResponse.json({ error: 'user_id and skills are required' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO user_skills (user_id, skills)
       VALUES ($1, $2::jsonb)
       ON CONFLICT (user_id)
       DO UPDATE SET skills = EXCLUDED.skills`,
      [user_id, JSON.stringify(skills)]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error upserting skills:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
