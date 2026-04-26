import { NextRequest, NextResponse } from 'next/server';
import { analyzeJobDescription, extractResumeSkills } from '@/lib/ai';
import { createSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const { jobDescription, resumeText } = await req.json();

    if (!jobDescription || !resumeText) {
      return NextResponse.json({ error: 'Job description and resume are required' }, { status: 400 });
    }

    // Analyze JD and extract skills in parallel
    const [jobAnalysis, resumeSkills] = await Promise.all([
      analyzeJobDescription(jobDescription),
      extractResumeSkills(resumeText),
    ]);

    // Create session with extracted skills
    const session = createSession(jobDescription, resumeText, jobAnalysis.skills);

    return NextResponse.json({
      sessionId: session.id,
      jobAnalysis,
      resumeSkills,
      firstSkill: jobAnalysis.skills[0]?.name,
      totalSkills: jobAnalysis.skills.length,
    });
  } catch (error) {
    console.error('Setup error full details:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
