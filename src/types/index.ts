export interface Skill {
  name: string;
  required: boolean;
  proficiencyRequired: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface SkillAssessment {
  skill: string;
  score: number; // 0-100
  level: 'none' | 'beginner' | 'intermediate' | 'advanced' | 'expert';
  evidence: string;
  gaps: string[];
}

export interface LearningResource {
  title: string;
  type: 'course' | 'book' | 'tutorial' | 'project' | 'documentation' | 'video';
  url?: string;
  platform?: string;
  estimatedHours: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  why: string;
}

export interface LearningPlanItem {
  skill: string;
  currentLevel: string;
  targetLevel: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedWeeks: number;
  isAdjacent: boolean;
  adjacentTo: string[];
  resources: LearningResource[];
  milestones: string[];
}

export interface AssessmentSession {
  id: string;
  jobDescription: string;
  resumeText: string;
  extractedSkills: Skill[];
  assessments: SkillAssessment[];
  conversationHistory: Message[];
  currentSkillIndex: number;
  phase: 'setup' | 'assessing' | 'complete';
  overallScore: number;
  learningPlan?: LearningPlanItem[];
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  metadata?: {
    skillBeingAssessed?: string;
    questionType?: 'conceptual' | 'practical' | 'scenario' | 'depth';
    assessmentComplete?: boolean;
  };
}

export interface JobAnalysis {
  title: string;
  company?: string;
  skills: Skill[];
  summary: string;
}
