import { Skill, SkillAssessment, LearningPlanItem, Message, JobAnalysis } from '@/types';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

async function callGroq(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  maxTokens: number = 2048
): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error: ${res.status} — ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

function extractJSON(text: string): string {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) return match[1].trim();
  const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) return jsonMatch[1].trim();
  return text.trim();
}

export async function analyzeJobDescription(jd: string): Promise<JobAnalysis> {
  const text = await callGroq([
    {
      role: 'system',
      content: 'You are an expert technical recruiter. Always respond with valid JSON only, no markdown backticks, no extra text.',
    },
    {
      role: 'user',
      content: `Analyze this job description and extract required skills with proficiency levels.

Job Description:
${jd}

Respond in this exact JSON format only:
{
  "title": "job title",
  "company": "company name or empty string",
  "summary": "2-sentence summary of the role",
  "skills": [
    {
      "name": "skill name",
      "required": true,
      "proficiencyRequired": "intermediate"
    }
  ]
}

Extract 6-10 most important skills. proficiencyRequired must be one of: beginner, intermediate, advanced, expert.`,
    },
  ]);

  return JSON.parse(extractJSON(text));
}

export async function extractResumeSkills(resumeText: string): Promise<string[]> {
  const text = await callGroq([
    {
      role: 'system',
      content: 'You are a resume parser. Respond with valid JSON array only, no markdown, no extra text.',
    },
    {
      role: 'user',
      content: `Extract all technical and professional skills from this resume.

Resume:
${resumeText}

Respond with a JSON array only: ["skill1", "skill2", ...]`,
    },
  ]);

  return JSON.parse(extractJSON(text));
}

export async function generateAssessmentQuestion(
  skill: Skill,
  conversationHistory: Message[],
  resumeText: string,
  questionCount: number
): Promise<string> {
  const systemPrompt = `You are SkillForge — an expert technical interviewer doing conversational skill assessment. Determine the candidate's TRUE proficiency level.

Rules:
- Ask conceptual questions to gauge real understanding
- Follow up based on answers — probe deeper if knowledgeable, simplify if struggling
- Ask practical scenario-based questions
- Be conversational and encouraging, not interrogative
- Max 2-3 questions per skill, then stop

Current skill: ${skill.name}
Required level for this job: ${skill.proficiencyRequired}
This is question number: ${questionCount + 1} for this skill`;

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ];

  if (questionCount === 0) {
    messages.push({
      role: 'user',
      content: `Ask a friendly, conversational opening question to assess the candidate's knowledge of "${skill.name}". Not yes/no. Make it natural.`,
    });
  } else {
    messages.push({
      role: 'user',
      content: `Generate the next assessment question for "${skill.name}" based on the conversation. If you have asked 2+ questions and have enough signal to score them, respond with exactly: ASSESSMENT_COMPLETE`,
    });
  }

  return await callGroq(messages, 512);
}

export async function scoreSkillAssessment(
  skill: Skill,
  conversationHistory: Message[]
): Promise<SkillAssessment> {
  const conversation = conversationHistory
    .map(m => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n\n');

  const text = await callGroq([
    {
      role: 'system',
      content: 'You are a technical evaluator. Be honest and precise. Respond with valid JSON only, no markdown.',
    },
    {
      role: 'user',
      content: `Score the candidate's proficiency in "${skill.name}" based on this conversation.

${conversation}

Scoring rubric:
0-20: none — no real knowledge
21-40: beginner — knows basics, lacks depth
41-60: intermediate — can work with guidance
61-80: advanced — handles complex cases well
81-100: expert — deep knowledge, can mentor others

Respond in JSON only:
{
  "skill": "${skill.name}",
  "score": 50,
  "level": "intermediate",
  "evidence": "specific evidence from their responses",
  "gaps": ["gap 1", "gap 2"]
}

level must be one of: none, beginner, intermediate, advanced, expert`,
    },
  ]);

  return JSON.parse(extractJSON(text));
}

export async function generateLearningPlan(
  assessments: SkillAssessment[],
  jobSkills: Skill[],
  resumeText: string,
  jobTitle: string
): Promise<LearningPlanItem[]> {
  const gaps = assessments.filter(a => {
    const required = jobSkills.find(s => s.name === a.skill);
    if (!required) return false;
    const requiredScore = { beginner: 30, intermediate: 55, advanced: 75, expert: 90 }[required.proficiencyRequired] || 55;
    return a.score < requiredScore;
  });

  if (gaps.length === 0) return [];

  const text = await callGroq([
    {
      role: 'system',
      content: 'You are a career development expert. Provide specific, actionable learning plans with real resources. Respond with valid JSON array only, no markdown.',
    },
    {
      role: 'user',
      content: `Create a personalized learning plan for a candidate applying for: ${jobTitle}

Skill Gaps:
${JSON.stringify(gaps, null, 2)}

Candidate Background:
${resumeText.slice(0, 600)}

Respond in JSON array only:
[
  {
    "skill": "skill name",
    "currentLevel": "beginner",
    "targetLevel": "intermediate",
    "priority": "high",
    "estimatedWeeks": 4,
    "isAdjacent": false,
    "adjacentTo": [],
    "resources": [
      {
        "title": "resource title",
        "type": "course",
        "url": "https://real-url.com",
        "platform": "Coursera",
        "estimatedHours": 10,
        "difficulty": "intermediate",
        "why": "why this resource for this candidate"
      }
    ],
    "milestones": ["Week 1: do X", "Week 2: do Y"]
  }
]

priority: critical, high, medium, or low
type: course, book, tutorial, project, documentation, video`,
    },
  ], 3000);

  return JSON.parse(extractJSON(text));
}
