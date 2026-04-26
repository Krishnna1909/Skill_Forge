'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SkillAssessment, LearningPlanItem } from '@/types';

const levelColors: Record<string, string> = {
  expert: 'var(--green)',
  advanced: 'var(--accent)',
  intermediate: 'var(--amber)',
  beginner: '#fb923c',
  none: 'var(--red)',
};

const levelBg: Record<string, string> = {
  expert: 'rgba(34,211,160,0.1)',
  advanced: 'rgba(79,142,255,0.1)',
  intermediate: 'rgba(245,158,11,0.1)',
  beginner: 'rgba(251,146,60,0.1)',
  none: 'rgba(244,63,94,0.1)',
};

const priorityColors: Record<string, string> = {
  critical: 'var(--red)',
  high: 'var(--amber)',
  medium: 'var(--accent)',
  low: 'var(--text2)',
};

const typeIcons: Record<string, string> = {
  course: '🎓',
  book: '📖',
  tutorial: '💻',
  project: '🔨',
  documentation: '📄',
  video: '🎬',
};

function ScoreRing({ score }: { score: number }) {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 75 ? 'var(--green)' : score >= 50 ? 'var(--accent)' : score >= 30 ? 'var(--amber)' : 'var(--red)';

  return (
    <div style={{ position: 'relative', width: 100, height: 100 }}>
      <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--border)" strokeWidth="6" />
        <circle
          cx="50" cy="50" r={r} fill="none"
          stroke={color} strokeWidth="6"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease', animation: 'score-fill 1s ease forwards' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 22, fontWeight: 700, color, fontFamily: 'var(--mono)' }}>{score}</span>
      </div>
    </div>
  );
}

function ResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session') || '';

  const [assessments, setAssessments] = useState<SkillAssessment[]>([]);
  const [learningPlan, setLearningPlan] = useState<LearningPlanItem[]>([]);
  const [overallScore, setOverallScore] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'plan'>('overview');
  const [expandedPlan, setExpandedPlan] = useState<number | null>(0);

  useEffect(() => {
    const stored = sessionStorage.getItem('planData');
    if (stored) {
      const data = JSON.parse(stored);
      setAssessments(data.assessments || []);
      setLearningPlan(data.learningPlan || []);
      setOverallScore(data.overallScore || 0);
    }
  }, []);

  const readySkills = assessments.filter(a => a.score >= 65);
  const gapSkills = assessments.filter(a => a.score < 65);
  const totalWeeks = learningPlan.reduce((sum, p) => sum + (p.estimatedWeeks || 0), 0);

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 80 }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid var(--border)',
        padding: '16px 24px',
        background: 'rgba(8,12,20,0.95)',
        backdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <button onClick={() => router.push('/')} style={{
          background: 'none', border: 'none', color: 'var(--text2)',
          cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6,
        }}>← New Assessment</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
          <div style={{
            width: 32, height: 32,
            background: 'linear-gradient(135deg, var(--accent), var(--purple))',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>⚡</div>
          <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em' }}>SkillForge</span>
        </div>
      </header>

      <div className="container" style={{ paddingTop: 48 }}>
        {/* Hero stats */}
        <div className="animate-slideUp" style={{ marginBottom: 40, textAlign: 'center' }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8 }}>
            Your Assessment Results
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: 15 }}>
            Based on your conversational assessment
          </p>
        </div>

        {/* Score cards */}
        <div className="animate-slideUp" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: 20, marginBottom: 48,
          animationDelay: '0.1s',
        }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <ScoreRing score={overallScore} />
            <div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4, fontFamily: 'var(--mono)' }}>OVERALL SCORE</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>
                {overallScore >= 75 ? 'Strong' : overallScore >= 55 ? 'Developing' : 'Needs Work'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text2)' }}>
                {overallScore >= 75 ? 'Ready for this role' : 'Gaps to address'}
              </div>
            </div>
          </div>

          <div className="card">
            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8, fontFamily: 'var(--mono)' }}>SKILL BREAKDOWN</div>
            <div style={{ display: 'flex', gap: 20 }}>
              <div>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--green)' }}>{readySkills.length}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>Job-ready</div>
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--amber)' }}>{gapSkills.length}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>Need work</div>
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent)' }}>{assessments.length}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>Total assessed</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8, fontFamily: 'var(--mono)' }}>LEARNING ESTIMATE</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--purple)' }}>{totalWeeks} weeks</div>
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>
              {learningPlan.length} skills to develop
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 32, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
          {(['overview', 'plan'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '10px 20px',
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${activeTab === tab ? 'var(--accent)' : 'transparent'}`,
              color: activeTab === tab ? 'var(--accent2)' : 'var(--text2)',
              fontFamily: 'var(--font)',
              fontWeight: 500,
              fontSize: 14,
              cursor: 'pointer',
              transition: 'color 0.2s',
              marginBottom: -1,
              textTransform: 'capitalize',
            }}>
              {tab === 'overview' ? 'Skill Overview' : 'Learning Plan'}
            </button>
          ))}
        </div>

        {/* Overview tab */}
        {activeTab === 'overview' && (
          <div className="animate-fadeIn">
            {/* Skill assessment cards */}
            <div style={{ display: 'grid', gap: 16 }}>
              {assessments.map((a, i) => (
                <div key={a.skill} className="card animate-slideUp" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {/* Score bar */}
                    <div style={{ flexShrink: 0, textAlign: 'center', width: 60 }}>
                      <div style={{ 
                        fontSize: 24, fontWeight: 700, fontFamily: 'var(--mono)',
                        color: levelColors[a.level] || 'var(--text)',
                      }}>{a.score}</div>
                      <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>/100</div>
                    </div>

                    {/* Skill info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <span style={{ fontWeight: 600, fontSize: 16 }}>{a.skill}</span>
                        <span style={{
                          padding: '2px 10px', borderRadius: 100,
                          fontSize: 11, fontFamily: 'var(--mono)',
                          background: levelBg[a.level],
                          color: levelColors[a.level],
                          border: `1px solid ${levelColors[a.level]}33`,
                          textTransform: 'uppercase', letterSpacing: '0.05em',
                        }}>{a.level}</span>
                      </div>
                      
                      {/* Score bar */}
                      <div className="progress-bar" style={{ marginBottom: 8 }}>
                        <div style={{
                          height: '100%',
                          width: `${a.score}%`,
                          background: levelColors[a.level],
                          borderRadius: 2,
                          transition: 'width 1s ease',
                        }} />
                      </div>

                      <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
                        {a.evidence}
                      </div>

                      {a.gaps && a.gaps.length > 0 && (
                        <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {a.gaps.map(gap => (
                            <span key={gap} style={{
                              padding: '2px 10px',
                              borderRadius: 100,
                              fontSize: 11,
                              background: 'rgba(244,63,94,0.08)',
                              border: '1px solid rgba(244,63,94,0.2)',
                              color: 'var(--red)',
                            }}>
                              ↗ {gap}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Learning Plan tab */}
        {activeTab === 'plan' && (
          <div className="animate-fadeIn">
            {learningPlan.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text2)' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
                <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8, color: 'var(--text)' }}>
                  You're fully qualified!
                </h3>
                <p>No significant skill gaps detected for this role.</p>
              </div>
            ) : (
              <>
                {/* Summary banner */}
                <div style={{
                  padding: '16px 20px',
                  background: 'rgba(79,142,255,0.06)',
                  border: '1px solid rgba(79,142,255,0.15)',
                  borderRadius: 12,
                  marginBottom: 24,
                  display: 'flex', gap: 20, flexWrap: 'wrap',
                }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)', marginBottom: 4 }}>ESTIMATED TIMELINE</div>
                    <div style={{ fontWeight: 600, color: 'var(--accent2)' }}>{totalWeeks} weeks to job-ready</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)', marginBottom: 4 }}>ADJACENT SKILLS</div>
                    <div style={{ fontWeight: 600, color: 'var(--purple)' }}>
                      {learningPlan.filter(p => p.isAdjacent).length} leverage your existing skills
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)', marginBottom: 4 }}>CRITICAL GAPS</div>
                    <div style={{ fontWeight: 600, color: 'var(--red)' }}>
                      {learningPlan.filter(p => p.priority === 'critical').length} must address first
                    </div>
                  </div>
                </div>

                {/* Sort by priority */}
                {['critical', 'high', 'medium', 'low'].map(priority => {
                  const items = learningPlan.filter(p => p.priority === priority);
                  if (items.length === 0) return null;
                  return (
                    <div key={priority} style={{ marginBottom: 32 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                        <div style={{ 
                          width: 8, height: 8, borderRadius: '50%',
                          background: priorityColors[priority],
                        }} />
                        <span style={{ 
                          fontFamily: 'var(--mono)', fontSize: 11, 
                          color: priorityColors[priority],
                          letterSpacing: '0.1em', textTransform: 'uppercase',
                          fontWeight: 600,
                        }}>{priority} priority</span>
                      </div>

                      <div style={{ display: 'grid', gap: 16 }}>
                        {items.map((item, idx) => {
                          const planIdx = learningPlan.indexOf(item);
                          const isExpanded = expandedPlan === planIdx;
                          
                          return (
                            <div key={item.skill} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                              <button
                                onClick={() => setExpandedPlan(isExpanded ? null : planIdx)}
                                style={{
                                  width: '100%', padding: '20px 24px',
                                  background: 'none', border: 'none', cursor: 'pointer',
                                  display: 'flex', alignItems: 'center', gap: 16, textAlign: 'left',
                                }}
                              >
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                                    <span style={{ fontWeight: 600, fontSize: 16, color: 'var(--text)' }}>{item.skill}</span>
                                    {item.isAdjacent && (
                                      <span style={{
                                        padding: '2px 8px', borderRadius: 100,
                                        fontSize: 10, fontFamily: 'var(--mono)',
                                        background: 'rgba(167,139,250,0.1)',
                                        border: '1px solid rgba(167,139,250,0.25)',
                                        color: 'var(--purple)',
                                      }}>ADJACENT SKILL</span>
                                    )}
                                  </div>
                                  <div style={{ fontSize: 13, color: 'var(--text2)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                                    <span>{item.currentLevel} → {item.targetLevel}</span>
                                    <span style={{ color: 'var(--accent2)' }}>~{item.estimatedWeeks} weeks</span>
                                    <span>{item.resources?.length || 0} resources</span>
                                    {item.adjacentTo?.length > 0 && (
                                      <span style={{ color: 'var(--purple)' }}>
                                        Builds on: {item.adjacentTo.join(', ')}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <span style={{ color: 'var(--text3)', fontSize: 18, transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'none' }}>
                                  ↓
                                </span>
                              </button>

                              {isExpanded && (
                                <div className="animate-slideUp" style={{ 
                                  borderTop: '1px solid var(--border)',
                                  padding: '20px 24px',
                                }}>
                                  {/* Milestones */}
                                  {item.milestones && item.milestones.length > 0 && (
                                    <div style={{ marginBottom: 24 }}>
                                      <div style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--mono)', marginBottom: 12, letterSpacing: '0.08em' }}>
                                        MILESTONES
                                      </div>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {item.milestones.map((m, mi) => (
                                          <div key={mi} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                            <div style={{
                                              width: 20, height: 20, flexShrink: 0,
                                              borderRadius: '50%',
                                              background: 'var(--border)',
                                              border: '2px solid var(--border2)',
                                              marginTop: 2,
                                            }} />
                                            <span style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.5 }}>{m}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Resources */}
                                  {item.resources && item.resources.length > 0 && (
                                    <div>
                                      <div style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--mono)', marginBottom: 12, letterSpacing: '0.08em' }}>
                                        CURATED RESOURCES
                                      </div>
                                      <div style={{ display: 'grid', gap: 12 }}>
                                        {item.resources.map((r, ri) => (
                                          <div key={ri} style={{
                                            padding: '14px 16px',
                                            background: 'var(--bg2)',
                                            border: '1px solid var(--border)',
                                            borderRadius: 10,
                                          }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                                              <span style={{ fontSize: 18 }}>{typeIcons[r.type] || '📌'}</span>
                                              <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, fontSize: 14 }}>
                                                  {r.url ? (
                                                    <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent2)', textDecoration: 'none' }}>
                                                      {r.title} ↗
                                                    </a>
                                                  ) : r.title}
                                                </div>
                                                <div style={{ fontSize: 12, color: 'var(--text3)', display: 'flex', gap: 10, marginTop: 2 }}>
                                                  <span>{r.platform}</span>
                                                  <span>~{r.estimatedHours}h</span>
                                                  <span style={{ textTransform: 'capitalize' }}>{r.difficulty}</span>
                                                </div>
                                              </div>
                                            </div>
                                            <div style={{ fontSize: 13, color: 'var(--text2)', marginLeft: 28, lineHeight: 1.5 }}>
                                              {r.why}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text2)' }}>Loading results...</div>}>
      <ResultsContent />
    </Suspense>
  );
}
