import { NextRequest, NextResponse } from 'next/server';
import { generateLearningPlan } from '@/lib/ai';
import { getSession, updateSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();
    const session = getSession(sessionId);

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Parse job title from JD
    const jobTitleMatch = session.jobDescription.match(/(?:position|role|title|job):\s*([^\n]+)/i) 
      || session.jobDescription.match(/^([A-Z][^\n]{5,60})\n/);
    const jobTitle = jobTitleMatch?.[1] || 'the target position';

    const learningPlan = await generateLearningPlan(
      session.assessments,
      session.extractedSkills,
      session.resumeText,
      jobTitle
    );

    updateSession(sessionId, { learningPlan });

    return NextResponse.json({ 
      learningPlan,
      assessments: session.assessments,
      overallScore: session.overallScore,
    });
  } catch (error) {
    console.error('Plan generation error:', error);
    return NextResponse.json({ error: 'Failed to generate learning plan' }, { status: 500 });
  }
}
