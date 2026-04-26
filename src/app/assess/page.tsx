'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SkillAssessment, LearningPlanItem } from '@/types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  skillBadge?: string;
}

interface Progress {
  current: number;
  total: number;
}

function AssessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session') || '';
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<Progress>({ current: 0, total: 0 });
  const [currentSkill, setCurrentSkill] = useState('');
  const [assessments, setAssessments] = useState<SkillAssessment[]>([]);
  const [overallScore, setOverallScore] = useState(0);
  const [learningPlan, setLearningPlan] = useState<LearningPlanItem[]>([]);
  const [phase, setPhase] = useState<'assessing' | 'transitioning' | 'complete'>('assessing');
  const [jobAnalysis, setJobAnalysis] = useState<{ title?: string; skills?: Array<{ name: string }> } | null>(null);
  const [initiated, setInitiated] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('planData');
    if (stored) {
      const data = JSON.parse(stored);
      setAssessments(data.assessments || []);
      setLearningPlan(data.learningPlan || []);
      setOverallScore(data.overallScore || 0);
} else {
  // Fallback to assessments stored during chat
  const storedAssessments = sessionStorage.getItem('assessments');
  const storedScore = sessionStorage.getItem('overallScore');
  if (storedAssessments) setAssessments(JSON.parse(storedAssessments));
  if (storedScore) setOverallScore(Number(storedScore));
}
  }, []);

  useEffect(() => {
    if (!initiated && sessionId) {
      setInitiated(true);
      startAssessment();
    }
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (phase === 'complete') {
      setTimeout(() => generatePlan(), 1500);
    }
  }, [phase]);

 const startAssessment = async () => {
  setLoading(true);
  try {
    const storedAnalysis = sessionStorage.getItem('jobAnalysis');
    const jobAnalysisData = storedAnalysis ? JSON.parse(storedAnalysis) : null;
    const totalSkills = jobAnalysisData?.skills?.length || 0;
    const firstSkill = jobAnalysisData?.skills?.[0]?.name || 'your first skill';

    setProgress({ current: 0, total: totalSkills });
    setCurrentSkill(firstSkill);

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, userMessage: null, action: 'start' }),
    });
    const data = await res.json();

    const skillName = data.currentSkill || firstSkill;
    setCurrentSkill(skillName);
    if (data.progress) setProgress(data.progress);

    const greeting = `Hi! I'm SkillForge — I'll be assessing your skills for this role through a natural conversation.\n\nI'll ask you a few targeted questions about each required skill. Just answer honestly — this helps me build the most useful learning plan for you.\n\nLet's start with ${skillName}.`;

    setMessages([{ role: 'assistant', content: greeting, skillBadge: skillName }]);
  } catch (err) {
    console.error(err);
  }
  setLoading(false);
};

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, userMessage: userMsg }),
      });
      const data = await res.json();
      console.log('API response:', data);

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.message || 'Thinking...',
        skillBadge: data.nextSkill || data.currentSkill,
      }]);

      if (data.assessment) {
        const newAssessments = [...assessments, data.assessment];
        setAssessments(newAssessments);
        setOverallScore(data.overallScore || 0);
        sessionStorage.setItem('assessments', JSON.stringify(newAssessments));
        sessionStorage.setItem('overallScore', String(data.overallScore || 0));
      }

      if (data.progress) setProgress(data.progress);
      if (data.currentSkill) setCurrentSkill(data.currentSkill);
      if (data.nextSkill) setCurrentSkill(data.nextSkill);
      
      if (data.phase === 'complete') {
        setPhase('complete');
      } else if (data.phase === 'transitioning') {
        setPhase('transitioning');
        setTimeout(() => setPhase('assessing'), 100);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
    inputRef.current?.focus();
  };

  const generatePlan = async () => {
    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      
      sessionStorage.setItem('planData', JSON.stringify(data));
      router.push(`/results?session=${sessionId}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const pct = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <div style={{ display: 'flex', height: '100vh', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Top bar */}
      <header style={{
        borderBottom: '1px solid var(--border)',
        background: 'rgba(8,12,20,0.95)',
        backdropFilter: 'blur(20px)',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        flexShrink: 0,
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32,
            background: 'linear-gradient(135deg, var(--accent), var(--purple))',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16,
          }}>⚡</div>
          <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em' }}>SkillForge</span>
        </div>

        <div style={{ flex: 1, maxWidth: 400 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>
            <span style={{ fontFamily: 'var(--mono)' }}>
              {progress.current < progress.total
                ? `Assessing: ${currentSkill || '...'}`
                : 'Assessment Complete'}
            </span>
            <span style={{ color: 'var(--accent2)' }}>
              {progress.current}/{progress.total} skills
            </span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {overallScore > 0 && (
          <div style={{
            padding: '6px 14px',
            background: 'rgba(79,142,255,0.1)',
            border: '1px solid rgba(79,142,255,0.2)',
            borderRadius: 8,
            fontSize: 13,
            color: 'var(--accent2)',
            fontFamily: 'var(--mono)',
          }}>
            Score: {overallScore}%
          </div>
        )}

        {/* Assessed skills sidebar */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', maxWidth: 300 }}>
          {assessments.slice(-3).map(a => (
            <span key={a.skill} style={{
              padding: '3px 10px',
              borderRadius: 100,
              fontSize: 11,
              fontFamily: 'var(--mono)',
              background: a.score >= 70 ? 'rgba(34,211,160,0.1)' : a.score >= 45 ? 'rgba(245,158,11,0.1)' : 'rgba(244,63,94,0.1)',
              border: `1px solid ${a.score >= 70 ? 'rgba(34,211,160,0.25)' : a.score >= 45 ? 'rgba(245,158,11,0.25)' : 'rgba(244,63,94,0.25)'}`,
              color: a.score >= 70 ? 'var(--green)' : a.score >= 45 ? 'var(--amber)' : 'var(--red)',
            }}>
              {a.skill} · {a.score}
            </span>
          ))}
        </div>
      </header>

      {/* Chat area */}
      <div style={{ flex: 1, overflow: 'auto', padding: '24px 0' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 24px' }}>
          {messages.map((msg, i) => (
            <div key={i} className="animate-slideUp" style={{ marginBottom: 20, animationDelay: `${i * 0.05}s` }}>
              {msg.role === 'assistant' ? (
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 36, height: 36, flexShrink: 0,
                    background: 'linear-gradient(135deg, var(--accent), var(--purple))',
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16,
                  }}>⚡</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--accent2)' }}>SkillForge</span>
                      {msg.skillBadge && (
                        <span style={{
                          padding: '2px 8px', borderRadius: 100,
                          fontSize: 10, fontFamily: 'var(--mono)',
                          background: 'rgba(79,142,255,0.08)',
                          border: '1px solid rgba(79,142,255,0.2)',
                          color: 'var(--accent2)',
                        }}>{msg.skillBadge}</span>
                      )}
                    </div>
                    <div className="message-ai" style={{ padding: '14px 18px' }}>
                      <div style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--text)' }}>
                        <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content || '...'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text2)' }}>You</span>
                    </div>
                    <div className="message-user" style={{ padding: '14px 18px', maxWidth: 560 }}>
                      <div style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--text)' }}>{msg.content}</div>
                    </div>
                  </div>
                  <div style={{
                    width: 36, height: 36, flexShrink: 0,
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16,
                  }}>👤</div>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
              <div style={{
                width: 36, height: 36,
                background: 'linear-gradient(135deg, var(--accent), var(--purple))',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16,
              }}>⚡</div>
              <div className="message-ai" style={{ padding: '14px 18px', display: 'flex', gap: 6, alignItems: 'center' }}>
                <div className="loading-dot" />
                <div className="loading-dot" />
                <div className="loading-dot" />
              </div>
            </div>
          )}

          {phase === 'complete' && !loading && (
            <div className="animate-slideUp" style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
              <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Assessment Complete!</h3>
              <p style={{ color: 'var(--text2)', marginBottom: 24 }}>
                Generating your personalized learning plan...
              </p>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                <div className="loading-dot" />
                <div className="loading-dot" />
                <div className="loading-dot" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input area */}
      {phase !== 'complete' && (
        <div style={{
          borderTop: '1px solid var(--border)',
          background: 'rgba(8,12,20,0.95)',
          backdropFilter: 'blur(20px)',
          padding: '20px 24px',
          flexShrink: 0,
        }}>
          <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', gap: 12 }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Share your experience with this skill... (Enter to send, Shift+Enter for newline)"
              rows={3}
              disabled={loading}
              style={{ resize: 'none', minHeight: 80 }}
            />
            <button
              className="btn-primary"
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{ padding: '12px 20px', alignSelf: 'flex-end', flexShrink: 0 }}
            >
              Send →
            </button>
          </div>
          <div style={{ maxWidth: 760, margin: '8px auto 0', fontSize: 12, color: 'var(--text3)' }}>
            Tip: Be specific and honest — vague answers score lower than candid ones
          </div>
        </div>
      )}
    </div>
  );
}

export default function AssessPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text2)' }}>Loading...</div>}>
      <AssessContent />
    </Suspense>
  );
}
