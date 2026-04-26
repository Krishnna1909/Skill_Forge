# ⚡ SkillForge — AI-Powered Skill Assessment & Personalized Learning Agent

> *A resume tells you what someone claims to know — not how well they actually know it.*

SkillForge is an AI agent that takes a Job Description and a candidate's resume, **conversationally assesses real proficiency** on each required skill through adaptive questioning, identifies skill gaps, and generates a **personalized learning roadmap** with curated resources and time estimates.

---

## 🏆 What Makes This Different

Most tools keyword-match your resume against a JD. SkillForge **talks to you**.

| Traditional Approach | SkillForge |
|---|---|
| Keyword matching | Conversational depth assessment |
| "You have React ✓" | "How deeply do you understand React hooks?" |
| Generic skill gap list | Prioritized roadmap with adjacent skills |
| Random resource links | Curated resources tied to your specific gaps |
| One-size-fits-all | Adapts questions based on your answers |

---

## 🚀 Live Demo

> **[Live URL here]**

### Demo Video
> **[Video link here]**

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    SkillForge                        │
│                                                       │
│  ┌──────────┐    ┌──────────────┐    ┌────────────┐ │
│  │ Setup UI │───▶│ /api/assess  │───▶│ JD Parser  │ │
│  └──────────┘    └──────────────┘    └────────────┘ │
│                          │                  │         │
│                          ▼                  ▼         │
│  ┌──────────┐    ┌──────────────┐    ┌────────────┐ │
│  │ Chat UI  │◀──▶│  /api/chat   │    │Resume      │ │
│  └──────────┘    └──────────────┘    │Extractor   │ │
│                          │            └────────────┘ │
│                          ▼                            │
│  ┌──────────┐    ┌──────────────┐    ┌────────────┐ │
│  │ Results  │◀───│  /api/plan   │───▶│ Claude API │ │
│  └──────────┘    └──────────────┘    └────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Technology Stack

- **Frontend**: Next.js 14 + React (App Router)
- **AI Engine**: Anthropic Claude claude-opus-4-5 via `@anthropic-ai/sdk`
- **Deployment**: Vercel (zero-config)
- **Language**: TypeScript throughout

### How It Works

**Step 1: Analysis**
- `analyzeJobDescription()` — Claude extracts 6-12 required skills with proficiency levels
- `extractResumeSkills()` — Claude maps what the candidate actually claims to have
- Skills are ranked by importance and stored in an in-memory session

**Step 2: Adaptive Assessment**
- For each skill, Claude generates an opening conceptual question
- Based on the candidate's response, it either probes deeper (if they seem knowledgeable) or simplifies
- After 2-3 questions, `scoreSkillAssessment()` analyzes the conversation holistically
- Score: 0-100 with levels (none/beginner/intermediate/advanced/expert)

**Step 3: Learning Plan Generation**
- Skills where the candidate scored below the required threshold are flagged as gaps
- `generateLearningPlan()` identifies **adjacent skills** — things the candidate can leverage from existing knowledge
- Each gap gets a prioritized plan with curated resources, milestones, and time estimates

---

## 📊 Scoring Logic

```
Score Range → Level
0-20:   none        — Surface awareness only
21-40:  beginner    — Knows basics, lacks depth
41-60:  intermediate — Can work with guidance
61-80:  advanced    — Handles complex scenarios
81-100: expert      — Can architect and mentor
```

**Assessment methodology:**
1. **Conceptual question** — "Explain X" to gauge foundational understanding
2. **Practical question** — "How would you handle Y scenario" to reveal real-world experience
3. **Depth probe** — Follow-up based on their answer to detect keyword-stuffing vs genuine knowledge
4. **Holistic scoring** — Claude evaluates the *full conversation*, not individual answers

**Gap detection:**
Each skill has a required proficiency level from the JD (beginner/intermediate/advanced/expert). This maps to a score threshold:
- Beginner required: gap if score < 30
- Intermediate required: gap if score < 55  
- Advanced required: gap if score < 75
- Expert required: gap if score < 90

**Adjacent skill detection:**
Claude identifies when a candidate's existing skills reduce the learning curve for a gap skill. Example: A React developer learning Next.js starts from a much better position than someone starting cold — this reduces the estimated learning time and changes the resource recommendations.

---

## 🛠️ Local Setup

### Prerequisites
- Node.js 18+
- An Anthropic API key ([get one here](https://console.anthropic.com))

### Installation

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/skillforge
cd skillforge

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Add your Anthropic API key to .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

```env
ANTHROPIC_API_KEY=sk-ant-...
```

### Production Deployment (Vercel)

```bash
npm install -g vercel
vercel --prod
```

Add `ANTHROPIC_API_KEY` in your Vercel project settings under Environment Variables.

---

## 📝 Sample Input/Output

### Sample Job Description
```
Senior Frontend Engineer — React/TypeScript

Requirements:
- 4+ years of experience with React.js and TypeScript
- Strong understanding of state management (Redux, Zustand)
- Experience with REST APIs and GraphQL
- Proficiency in CSS/Tailwind CSS
- Testing frameworks (Jest, React Testing Library)
- CI/CD pipelines and Git workflows
```

### Sample Resume
```
Frontend Developer (2022–Present)
• React dashboards with TypeScript for 50k+ users
• Implemented Redux state management
• REST API integration
• Git, agile sprints

Skills: React, JavaScript, TypeScript (learning), Redux, REST APIs, Git, CSS
```

### Sample Assessment Exchange
```
SkillForge: Let's start with TypeScript. You've listed it as something you're 
currently learning. Can you tell me about a specific situation where TypeScript's 
type system caught a bug that JavaScript wouldn't have caught?

Candidate: Honestly I've been using it for a few months and mostly I just add 
type annotations to variables. I haven't really used generics or utility types much.

SkillForge: That's helpful context. When you annotate variables, do you use 
explicit types or do you rely on TypeScript's inference? And have you used 
interface or type aliases to define custom types?

[Assessment Complete → Score: 35/100 (Beginner)]
```

### Sample Output: Skill Scores
```json
[
  { "skill": "React.js", "score": 78, "level": "advanced" },
  { "skill": "TypeScript", "score": 35, "level": "beginner" },
  { "skill": "GraphQL", "score": 12, "level": "none" },
  { "skill": "Testing (Jest)", "score": 22, "level": "beginner" }
]
```

### Sample Output: Learning Plan Item
```json
{
  "skill": "TypeScript",
  "currentLevel": "beginner",
  "targetLevel": "intermediate",
  "priority": "high",
  "estimatedWeeks": 6,
  "isAdjacent": true,
  "adjacentTo": ["React.js", "JavaScript"],
  "resources": [
    {
      "title": "TypeScript Handbook",
      "type": "documentation",
      "url": "https://www.typescriptlang.org/docs/handbook/",
      "platform": "Official Docs",
      "estimatedHours": 10,
      "difficulty": "intermediate",
      "why": "Since you already know JavaScript and React, the official handbook's sections on generics and utility types will directly address your gaps"
    },
    {
      "title": "Matt Pocock's Total TypeScript",
      "type": "course",
      "url": "https://www.totaltypescript.com",
      "platform": "Total TypeScript",
      "estimatedHours": 20,
      "difficulty": "intermediate",
      "why": "Specifically designed for developers with JS experience moving to TS — highly practical, matches your situation"
    }
  ],
  "milestones": [
    "Week 1-2: Complete generics and utility types from the handbook",
    "Week 3-4: Refactor an existing React project to strict TypeScript",
    "Week 5-6: Build a small project using advanced patterns (discriminated unions, mapped types)"
  ]
}
```

---

## 🔮 Architecture Decisions

**Why Claude over GPT?**
Claude's instruction-following and nuanced evaluation made it superior for the holistic assessment scoring — it reasons about *what the conversation reveals* rather than just pattern-matching keywords.

**Why in-memory sessions?**
For hackathon simplicity. Production would use Redis with TTL-based expiry. The session structure is already serializable for easy migration.

**Why Next.js App Router?**
Server components + API routes in one framework, streaming support, zero-config Vercel deployment.

---

## 📁 Project Structure

```
skillforge/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Home / Setup
│   │   ├── assess/page.tsx       # Conversational Assessment
│   │   ├── results/page.tsx      # Results + Learning Plan
│   │   ├── api/
│   │   │   ├── assess/route.ts   # JD + Resume analysis
│   │   │   ├── chat/route.ts     # Conversational assessment
│   │   │   └── plan/route.ts     # Learning plan generation
│   │   └── globals.css
│   ├── lib/
│   │   ├── ai.ts                 # All AI functions
│   │   └── session.ts            # Session management
│   └── types/index.ts            # TypeScript types
├── public/
├── package.json
└── README.md
```

---

## 👤 Author

**Krishna Singh Parihar**  
Built for Catalyst Hackathon by Deccan AI

---

## 📄 License

MIT
