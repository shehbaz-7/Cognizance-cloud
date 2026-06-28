import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { RetentionEngine } from '@/lib/retention-engine';
import { adminMessaging } from '@/lib/firebase-admin';

// Protect this route from public access (Vercel Cron sets a specific header)
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!adminMessaging) {
      return NextResponse.json({ error: 'Firebase Admin not configured' }, { status: 500 });
    }

    // 1. Fetch all users who have registered FCM tokens
    const tokensResult = await query('SELECT user_id, token FROM fcm_tokens');
    const usersWithTokens = tokensResult.rows;
    if (!usersWithTokens || usersWithTokens.length === 0) {
      return NextResponse.json({ success: true, message: 'No registered devices' });
    }

    // Group tokens by user_id
    const userTokensMap: Record<string, string[]> = {};
    usersWithTokens.forEach(row => {
      if (!userTokensMap[row.user_id]) userTokensMap[row.user_id] = [];
      userTokensMap[row.user_id].push(row.token);
    });

    // 2. Fetch skill data for those users to analyze retention
    const userIds = Object.keys(userTokensMap);
    const skillsResult = await query(
      'SELECT user_id, skills FROM user_skills WHERE user_id = ANY($1::text[])',
      [userIds]
    );
    const userSkills = skillsResult.rows;

    let sentPushes = 0;

    // 3. Evaluate Ebbinghaus Retention & Trigger
    for (const record of userSkills || []) {
      const skills = record.skills || [];
      const decayingSkills = skills.filter((skill: any) => {
        const stats = RetentionEngine.compute(skill);
        return stats.status === 'decaying' || stats.status === 'review';
      });

      if (decayingSkills.length > 0) {
        // Send a generalized notification containing the worst skill
        const worstSkill = decayingSkills.sort(
          (a: any, b: any) => RetentionEngine.compute(a).score - RetentionEngine.compute(b).score
        )[0];
        
        const worstScore = RetentionEngine.compute(worstSkill).score;

        const message = {
          notification: {
            title: 'Neural Decay Detected 📉',
            body: `Your retention for "${worstSkill.name}" has dropped to ${worstScore}%. Review now to stabilize synaptic pathways!`,
          },
          data: {
            click_action: '/study', 
          },
          tokens: userTokensMap[record.user_id],
        };

        const response = await adminMessaging.sendEachForMulticast(message);
        sentPushes += response.successCount;
      }
    }

    return NextResponse.json({ success: true, sentCount: sentPushes });
  } catch (err: any) {
    console.error('CRON Decay Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
