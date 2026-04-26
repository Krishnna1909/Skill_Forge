import { AssessmentSession, Message, Skill } from '@/types';

// In-memory session store (use Redis/DB in production)
const sessions = new Map<string, AssessmentSession>();

export function createSession(
  jobDescription: string,
  resumeText: string,
  extractedSkills: Skill[]
): AssessmentSession {
  const session: AssessmentSession = {
    id: Math.random().toString(36).slice(2),
    jobDescription,
    resumeText,
    extractedSkills,
    assessments: [],
    conversationHistory: [],
    currentSkillIndex: 0,
    phase: 'assessing',
    overallScore: 0,
  };
  sessions.set(session.id, session);
  return session;
}

export function getSession(id: string): AssessmentSession | undefined {
  return sessions.get(id);
}

export function updateSession(id: string, updates: Partial<AssessmentSession>): AssessmentSession | undefined {
  const session = sessions.get(id);
  if (!session) return undefined;
  const updated = { ...session, ...updates };
  sessions.set(id, updated);
  return updated;
}

export function addMessage(id: string, message: Message): void {
  const session = sessions.get(id);
  if (!session) return;
  session.conversationHistory.push(message);
  sessions.set(id, session);
}

export function calculateOverallScore(session: AssessmentSession): number {
  if (session.assessments.length === 0) return 0;
  const total = session.assessments.reduce((sum, a) => sum + a.score, 0);
  return Math.round(total / session.assessments.length);
}
