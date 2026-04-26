import { NextRequest, NextResponse } from 'next/server';
import { generateAssessmentQuestion, scoreSkillAssessment } from '@/lib/ai';
import { getSession, updateSession, addMessage, calculateOverallScore } from '@/lib/session';
import { Message } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { sessionId, userMessage, action } = await req.json();
    const session = getSession(sessionId);

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const currentSkill = session.extractedSkills[session.currentSkillIndex];
    if (!currentSkill) {
      return NextResponse.json({ phase: 'complete', session });
    }

    // Count questions for current skill
    const skillMessages = session.conversationHistory.filter(
      m => m.metadata?.skillBeingAssessed === currentSkill.name
    );
    const questionCount = skillMessages.filter(m => m.role === 'assistant').length;

    // Add user message if provided
    if (userMessage) {
      const msg: Message = {
        role: 'user',
        content: userMessage,
        metadata: { skillBeingAssessed: currentSkill.name }
      };
      addMessage(sessionId, msg);
    }

    // Get updated session
    const updatedSession = getSession(sessionId)!;

    // Generate next question or score current skill
    const nextQuestion = await generateAssessmentQuestion(
      currentSkill,
      updatedSession.conversationHistory.filter(
        m => m.metadata?.skillBeingAssessed === currentSkill.name
      ),
      updatedSession.resumeText,
      questionCount
    );

    if (nextQuestion.includes('ASSESSMENT_COMPLETE') || questionCount >= 2) {
      // Score this skill
      const skillConversation = updatedSession.conversationHistory.filter(
        m => m.metadata?.skillBeingAssessed === currentSkill.name
      );
      
      const assessment = await scoreSkillAssessment(currentSkill, skillConversation);
      const newAssessments = [...updatedSession.assessments, assessment];
      const nextIndex = updatedSession.currentSkillIndex + 1;
      const isSessionComplete = nextIndex >= updatedSession.extractedSkills.length;

      const sessionUpdates = {
        assessments: newAssessments,
        currentSkillIndex: nextIndex,
        phase: isSessionComplete ? 'complete' as const : 'assessing' as const,
        overallScore: calculateOverallScore({ ...updatedSession, assessments: newAssessments }),
      };
      updateSession(sessionId, sessionUpdates);

      const nextSkill = session.extractedSkills[nextIndex];
      
      const transitionMessage: Message = {
        role: 'assistant',
        content: isSessionComplete
          ? `Great, I've finished assessing all your skills! Let me compile your results and personalized learning plan...`
          : `Thanks for sharing that! I've got a good sense of your ${currentSkill.name} proficiency. Let's move on to **${nextSkill?.name}**.\n\n---`,
        metadata: { 
          skillBeingAssessed: currentSkill.name,
          assessmentComplete: true 
        }
      };
      addMessage(sessionId, transitionMessage);

      return NextResponse.json({
        message: transitionMessage.content,
        assessment,
        phase: isSessionComplete ? 'complete' : 'transitioning',
        nextSkill: nextSkill?.name,
        progress: {
          current: nextIndex,
          total: session.extractedSkills.length,
        },
        overallScore: sessionUpdates.overallScore,
      });
    }

    // Add AI question to history
    const aiMessage: Message = {
      role: 'assistant',
      content: nextQuestion,
      metadata: { 
        skillBeingAssessed: currentSkill.name,
        questionType: questionCount === 0 ? 'conceptual' : 'practical'
      }
    };
    addMessage(sessionId, aiMessage);

    return NextResponse.json({
      message: nextQuestion,
      phase: 'assessing',
      currentSkill: currentSkill.name,
      progress: {
        current: session.currentSkillIndex,
        total: session.extractedSkills.length,
      },
      questionNumber: questionCount + 1,
    });

  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('sessionId');
  if (!sessionId) return NextResponse.json({ error: 'No session ID' }, { status: 400 });
  
  const session = getSession(sessionId);
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  
  return NextResponse.json(session);
}
