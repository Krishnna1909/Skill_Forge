'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

const SAMPLE_JD = `Senior Frontend Engineer — React/TypeScript

We're looking for a Senior Frontend Engineer to join our product team at a fast-growing SaaS startup.

Requirements:
- 4+ years of experience with React.js and TypeScript
- Strong understanding of state management (Redux, Zustand, or similar)
- Experience with REST APIs and GraphQL
- Proficiency in CSS/Tailwind CSS and responsive design
- Familiarity with testing frameworks (Jest, React Testing Library)
- Experience with CI/CD pipelines and Git workflows
- Knowledge of web performance optimization techniques

Nice to have:
- Experience with Next.js
- Familiarity with WebSockets or real-time features
- Prior experience at a startup or agile environment`;

const SAMPLE_RESUME = `Krishna Singh Parihar
Frontend Developer | krishna@example.com | GitHub: github.com/krishna

EXPERIENCE
Frontend Developer — TechCorp (2022–Present)
• Built React dashboards with TypeScript for 50k+ users
• Implemented Redux state management for complex data flows
• Worked with REST APIs, integrated third-party services
• Used Git, participated in agile sprints

Junior Developer — StartupXYZ (2021–2022)
• Developed UI components in React and JavaScript
• Basic experience with CSS and responsive design

SKILLS
React, JavaScript, TypeScript (learning), Redux, REST APIs, Git, CSS, HTML, some Node.js

EDUCATION
B.Tech Computer Science — RGPV, 2021`;

export default function HomePage() {
  const router = useRouter();
  const [jobDescription, setJobDescription] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [pdfParsing, setPdfParsing] = useState(false);
  const [pdfName, setPdfName] = useState('');
  const [resumeMode, setResumeMode] = useState<'pdf' | 'text'>('pdf');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePdfUpload = async (file: File) => {
    if (!file || file.type !== 'application/pdf') {
      setError('Please upload a valid PDF file');
      return;
    }
    setPdfName(file.name);
    setPdfParsing(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('pdf', file);

      const res = await fetch('/api/parse-pdf', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResumeText(data.text);
    } catch (err) {
      setError('Failed to read PDF. Please try the "Paste Text" option instead.');
      setPdfName('');
    }
    setPdfParsing(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handlePdfUpload(file);
  };

  const handleStart = async () => {
    if (!jobDescription.trim() || !resumeText.trim()) {
      setError('Please provide both a job description and your resume');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription, resumeText }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Server error ${res.status}`);
      }

      sessionStorage.setItem('sessionId', data.sessionId);
      sessionStorage.setItem('jobAnalysis', JSON.stringify(data.jobAnalysis));
      router.push(`/assess?session=${data.sessionId}`);
    } catch (err) {
      console.error('Start error:', err);
      if (err instanceof Error) {
        if (err.message.toLowerCase().includes('api') || err.message.includes('401') || err.message.includes('403')) {
          setError('API key error — open .env.local and make sure ANTHROPIC_API_KEY is correct with no spaces or quotes.');
        } else if (err.message.includes('fetch') || err.message.includes('network')) {
          setError('Cannot connect. Make sure "npm run dev" is still running in your terminal.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Something went wrong. Check your terminal window for details.');
      }
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', paddingBottom: '80px' }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid var(--border)',
        padding: '20px 0',
        position: 'sticky', top: 0,
        background: 'rgba(8,12,20,0.9)',
        backdropFilter: 'blur(20px)',
        zIndex: 100,
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg, var(--accent), var(--purple))',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
          }}>⚡</div>
          <span style={{ fontWeight: 700, fontSize: 20, letterSpacing: '-0.02em' }}>SkillForge</span>
          <span style={{
            padding: '2px 8px',
            background: 'rgba(79,142,255,0.1)',
            border: '1px solid rgba(79,142,255,0.2)',
            borderRadius: 100,
            fontSize: 11,
            color: 'var(--accent2)',
            fontFamily: 'var(--mono)',
            marginLeft: 4,
          }}>AI-POWERED</span>
        </div>
      </header>

      <div className="container" style={{ paddingTop: 80, paddingBottom: 60, textAlign: 'center' }}>
        <div className="animate-slideUp">
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px',
            background: 'rgba(34, 211, 160, 0.08)',
            border: '1px solid rgba(34, 211, 160, 0.2)',
            borderRadius: 100,
            fontSize: 13,
            color: 'var(--green)',
            fontWeight: 500,
            marginBottom: 32,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block', animation: 'pulse 2s infinite' }}></span>
            Real proficiency assessment — not keyword matching
          </div>

          <h1 style={{
            fontSize: 'clamp(36px, 6vw, 64px)',
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            marginBottom: 24,
            background: 'linear-gradient(135deg, var(--text) 40%, var(--text2))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Know exactly where<br />you stand
          </h1>

          <p style={{
            fontSize: 18,
            color: 'var(--text2)',
            maxWidth: 560,
            margin: '0 auto 48px',
            lineHeight: 1.7,
          }}>
            SkillForge has a real conversation with you to assess your actual skill depth — then builds a personalized learning plan to close the gaps.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 64 }}>
            {['Adaptive questioning', 'Gap detection', 'Personalized learning plan', 'Resource curation'].map(f => (
              <span key={f} style={{
                padding: '8px 16px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 100,
                fontSize: 13,
                color: 'var(--text2)',
              }}>{f}</span>
            ))}
          </div>
        </div>

        {/* Main form */}
        <div className="card animate-slideUp" style={{ maxWidth: 800, margin: '0 auto', animationDelay: '0.1s' }}>
          {/* Step tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
            {[1, 2].map(s => (
              <button key={s} onClick={() => setStep(s as 1 | 2)} style={{
                flex: 1, padding: '10px',
                background: step === s ? 'rgba(79,142,255,0.1)' : 'transparent',
                border: `1px solid ${step === s ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 8,
                color: step === s ? 'var(--accent2)' : 'var(--text2)',
                fontSize: 13, fontFamily: 'var(--font)', fontWeight: 500,
                cursor: 'pointer', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                <span style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: step === s ? 'var(--accent)' : 'var(--border)',
                  color: 'white', fontSize: 11,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>{s}</span>
                {s === 1 ? 'Job Description' : 'Your Resume'}
              </button>
            ))}
          </div>

          {/* Step 1 */}
          {step === 1 && (
            <div className="animate-fadeIn">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <label style={{ fontSize: 14, fontWeight: 500, color: 'var(--text2)' }}>Job Description</label>
                <button onClick={() => setJobDescription(SAMPLE_JD)}
                  style={{ fontSize: 12, color: 'var(--accent2)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  Load sample →
                </button>
              </div>
              <textarea rows={12}
                placeholder="Paste the job description here..."
                value={jobDescription}
                onChange={e => setJobDescription(e.target.value)}
              />
              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn-primary" onClick={() => setStep(2)} disabled={!jobDescription.trim()}>
                  Next: Add Resume →
                </button>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="animate-fadeIn">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <label style={{ fontSize: 14, fontWeight: 500, color: 'var(--text2)' }}>Your Resume</label>
                {/* PDF / Text toggle */}
                <div style={{ display: 'flex', gap: 4, background: 'var(--bg2)', padding: 4, borderRadius: 8, border: '1px solid var(--border)' }}>
                  {(['pdf', 'text'] as const).map(mode => (
                    <button key={mode} onClick={() => { setResumeMode(mode); setError(''); }} style={{
                      padding: '5px 14px', borderRadius: 6,
                      background: resumeMode === mode ? 'var(--accent)' : 'transparent',
                      color: resumeMode === mode ? 'white' : 'var(--text2)',
                      border: 'none', fontSize: 12, fontFamily: 'var(--font)', fontWeight: 500,
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}>
                      {mode === 'pdf' ? '📄 Upload PDF' : '✏️ Paste Text'}
                    </button>
                  ))}
                </div>
              </div>

              {/* PDF Upload */}
              {resumeMode === 'pdf' && (
                <div>
                  <input type="file" accept=".pdf" ref={fileInputRef} style={{ display: 'none' }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) handlePdfUpload(f); }}
                  />
                  <div
                    onDrop={handleDrop}
                    onDragOver={e => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: `2px dashed ${pdfName ? 'var(--green)' : 'var(--border2)'}`,
                      borderRadius: 12, padding: '48px 24px', textAlign: 'center',
                      cursor: 'pointer',
                      background: pdfName ? 'rgba(34,211,160,0.04)' : 'var(--bg2)',
                      transition: 'all 0.2s',
                    }}
                  >
                    {pdfParsing ? (
                      <div>
                        <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
                        <div style={{ color: 'var(--text2)', fontSize: 14 }}>Reading your PDF...</div>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 12 }}>
                          <div className="loading-dot" /><div className="loading-dot" /><div className="loading-dot" />
                        </div>
                      </div>
                    ) : pdfName ? (
                      <div>
                        <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
                        <div style={{ fontWeight: 600, color: 'var(--green)', marginBottom: 4 }}>{pdfName}</div>
                        <div style={{ fontSize: 13, color: 'var(--text2)' }}>
                          {resumeText.length} characters extracted · Click to change
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
                        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>Drop your resume PDF here</div>
                        <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>or click to browse</div>
                        <div style={{
                          display: 'inline-block', padding: '8px 20px',
                          background: 'var(--surface2)', border: '1px solid var(--border)',
                          borderRadius: 8, fontSize: 13, color: 'var(--text2)',
                        }}>Choose PDF file</div>
                      </div>
                    )}
                  </div>
                  <div style={{ marginTop: 12, textAlign: 'center' }}>
                    <button onClick={() => { setResumeText(SAMPLE_RESUME); setPdfName('sample-resume.pdf'); }}
                      style={{ fontSize: 12, color: 'var(--accent2)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      Or load sample resume →
                    </button>
                  </div>
                </div>
              )}

              {/* Text paste */}
              {resumeMode === 'text' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                    <button onClick={() => setResumeText(SAMPLE_RESUME)}
                      style={{ fontSize: 12, color: 'var(--accent2)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      Load sample →
                    </button>
                  </div>
                  <textarea rows={12} placeholder="Paste your resume text here..."
                    value={resumeText} onChange={e => setResumeText(e.target.value)} />
                </div>
              )}

              {error && (
                <div style={{
                  marginTop: 12, padding: '12px 16px',
                  background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)',
                  borderRadius: 8, color: 'var(--red)', fontSize: 13, lineHeight: 1.6,
                }}>⚠️ {error}</div>
              )}

              <div style={{ marginTop: 16, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button className="btn-ghost" onClick={() => setStep(1)}>← Back</button>
                <button className="btn-primary" onClick={handleStart}
                  disabled={loading || !resumeText.trim()}>
                  {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ display: 'flex', gap: 4 }}>
                        <span className="loading-dot" /><span className="loading-dot" /><span className="loading-dot" />
                      </span>
                      Analyzing...
                    </span>
                  ) : 'Start Assessment ⚡'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* How it works */}
        <div style={{ marginTop: 80, maxWidth: 800, margin: '80px auto 0' }}>
          <h2 style={{ fontSize: 14, fontFamily: 'var(--mono)', color: 'var(--text3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 32 }}>
            HOW IT WORKS
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
            {[
              { n: '01', title: 'Parse & Analyze', desc: 'AI extracts required skills from the job description and maps them against your resume' },
              { n: '02', title: 'Conversational Assessment', desc: 'Adaptive questions probe your real depth — not just what you claim to know' },
              { n: '03', title: 'Gap Detection', desc: 'Scores each skill with evidence from your answers' },
              { n: '04', title: 'Learning Roadmap', desc: 'Curated resources and time estimates focused on adjacent skills you can realistically acquire' },
            ].map(s => (
              <div key={s.n} className="card" style={{ textAlign: 'left', padding: 24 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)', marginBottom: 12 }}>{s.n}</div>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
