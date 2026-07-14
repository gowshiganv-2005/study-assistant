import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useStudyStore from '../store/studyStore';

const SUGGESTED_TOPICS = [
  { label: 'Python Programming' },
  { label: 'Machine Learning' },
  { label: 'Web Development' },
  { label: 'Data Structures' },
  { label: 'Quantum Computing' },
  { label: 'Blockchain' },
  { label: 'Calculus' },
  { label: 'World History' },
];

const DEPTH_OPTIONS = [
  { value: 'beginner',     label: 'Beginner',     desc: 'No prior knowledge required' },
  { value: 'intermediate', label: 'Intermediate',  desc: 'Some background knowledge'   },
  { value: 'advanced',     label: 'Advanced',      desc: 'Deep technical dive'          },
];

export default function Home() {
  const navigate = useNavigate();
  const { generateCurriculum, isGenerating, generationError, topic, depth, setTopic, setDepth } = useStudyStore();

  const [localTopic, setLocalTopic] = useState(topic || '');
  const [localDepth, setLocalDepth] = useState(depth || 'beginner');
  const [apiStatus, setApiStatus] = useState(null);
  const [error, setError] = useState('');
  const [loadingStep, setLoadingStep] = useState(0);

  const LOADING_STEPS = [
    { text: 'Connecting to AI model…' },
    { text: 'Designing your curriculum…' },
    { text: 'Writing module content…' },
    { text: 'Finalising your course…' },
  ];

  // Cycle through loading steps every 6s while generating
  useEffect(() => {
    if (!isGenerating) { setLoadingStep(0); return; }
    const interval = setInterval(() => {
      setLoadingStep(s => (s + 1) % LOADING_STEPS.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Check API health on mount
  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
    fetch(`${apiBase}/api/health`)
      .then(r => r.json())
      .then(d => setApiStatus(d))
      .catch(() => setApiStatus({ status: 'error' }));
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    const trimmed = localTopic.trim();
    if (!trimmed) { setError('Please enter a topic.'); return; }
    setError('');
    setTopic(trimmed);
    setDepth(localDepth);
    try {
      await generateCurriculum(trimmed, localDepth);
      navigate('/study');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSuggestion = (t) => { setLocalTopic(t); setError(''); };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>

      {/* ── Generating Overlay ── */}
      {isGenerating && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(8,12,20,0.92)',
          backdropFilter: 'blur(16px)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 24,
        }}>
          {/* Animated visual indicator */}
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'var(--grad-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 60px rgba(99,102,241,0.5)',
            animation: 'pulse-ring 2s ease-in-out infinite',
            position: 'relative'
          }}>
            <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem', marginBottom: 8 }}>
              Building your curriculum
            </div>
            <div style={{
              fontSize: '1.05rem', color: 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              minHeight: 32, transition: 'all 0.4s',
            }}>
              {LOADING_STEPS[loadingStep].text}
            </div>
          </div>

          {/* Step dots */}
          <div style={{ display: 'flex', gap: 8 }}>
            {LOADING_STEPS.map((_, i) => (
              <div key={i} style={{
                width: i === loadingStep ? 24 : 8,
                height: 8, borderRadius: 4,
                background: i === loadingStep ? 'var(--accent-primary)' : 'var(--border-subtle)',
                transition: 'all 0.4s',
              }} />
            ))}
          </div>

          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            Free AI models may take 20–40 seconds — hang tight!
          </div>
        </div>
      )}
      {/* Header */}
      <header style={{ padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'var(--grad-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
            color: '#fff',
            fontWeight: 800,
            fontSize: '0.875rem'
          }}>S</div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>
            Study<span className="text-gradient">AI</span>
          </span>
        </div>

        {/* API Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          {apiStatus === null ? (
            <><div className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> Connecting…</>
          ) : apiStatus.status === 'error' ? (
            <><div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-danger)' }} /> Backend offline</>
          ) : apiStatus.apiKeyConfigured ? (
            <><div className="pulse-dot" /> Gemma ready</>
          ) : (
            <><div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-warning)' }} /> API key needed</>
          )}
        </div>
      </header>

      {/* Hero */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px 80px' }}>

        {/* Badge */}
        <div className="badge badge-primary anim-fade" style={{ marginBottom: 24, fontSize: '0.8rem' }}>
          Powered by Gemma AI
        </div>

        {/* Title */}
        <h1
          className="font-display anim-up"
          style={{
            fontSize: 'clamp(2.4rem, 6vw, 4.2rem)',
            fontWeight: 800,
            textAlign: 'center',
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            maxWidth: 700,
            marginBottom: 20,
            animationDelay: '0.05s',
          }}
        >
          Your AI-powered<br />
          <span className="text-gradient">Learning Assistant</span>
        </h1>

        <p className="anim-up" style={{ color: 'var(--text-secondary)', fontSize: 'clamp(1rem, 2vw, 1.175rem)', textAlign: 'center', maxWidth: 520, marginBottom: 52, animationDelay: '0.1s', lineHeight: 1.7 }}>
          Enter any topic and get a personalized curriculum, AI-powered explanations, interactive quizzes, and progress tracking — all in one place.
        </p>

        {/* ── Form Card ── */}
        <div className="card anim-scale" style={{
          width: '100%',
          maxWidth: 620,
          padding: '36px',
          background: 'rgba(13,19,33,0.85)',
          border: '1px solid var(--border-subtle)',
          animationDelay: '0.15s',
        }}>
          <form onSubmit={handleGenerate}>
            {/* Topic Input */}
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              What do you want to learn?
            </label>
            <div style={{ position: 'relative', marginBottom: 24 }}>
              <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--text-muted)' }}>TOPIC</span>
              <input
                id="topic-input"
                className="input input-lg"
                style={{ paddingLeft: 64 }}
                type="text"
                value={localTopic}
                onChange={e => { setLocalTopic(e.target.value); setError(''); }}
                placeholder="e.g. Machine Learning, Calculus, History…"
                disabled={isGenerating}
                autoFocus
              />
            </div>

            {/* Depth Selector */}
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Difficulty level
            </label>
            <div className="difficulty-grid">
              {DEPTH_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  id={`depth-${opt.value}`}
                  onClick={() => setLocalDepth(opt.value)}
                  style={{
                    padding: '16px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${localDepth === opt.value ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                    background: localDepth === opt.value ? 'rgba(99,102,241,0.12)' : 'var(--bg-glass)',
                    color: localDepth === opt.value ? 'var(--accent-glow)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                  }}
                  disabled={isGenerating}
                >
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{opt.label}</span>
                  <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>{opt.desc}</span>
                </button>
              ))}
            </div>

            {/* Error */}
            {(error || generationError) && (
              <div style={{
                background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)',
                borderRadius: 'var(--radius-md)', padding: '10px 14px',
                color: '#fb7185', fontSize: '0.875rem', marginBottom: 18,
                display: 'flex', alignItems: 'flex-start', gap: 8,
              }}>
                <span>Error:</span>
                <span>{error || generationError}</span>
              </div>
            )}

            {/* Submit */}
            <button
              id="generate-btn"
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', justifyContent: 'center', fontSize: '1rem' }}
              disabled={isGenerating || !localTopic.trim()}
            >
              {isGenerating ? (
                <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> Generating curriculum…</>
              ) : (
                <>Generate My Curriculum</>
              )}
            </button>
          </form>
        </div>

        {/* Suggestions */}
        <div className="anim-up" style={{ marginTop: 32, textAlign: 'center', animationDelay: '0.2s' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Popular Topics</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
            {SUGGESTED_TOPICS.map(t => (
              <button
                key={t.label}
                id={`suggestion-${t.label.replace(/\s+/g, '-').toLowerCase()}`}
                className="btn btn-secondary btn-sm"
                onClick={() => handleSuggestion(t.label)}
                disabled={isGenerating}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Feature Pills */}
        <div className="anim-fade" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 48, animationDelay: '0.25s' }}>
          {[
            'Structured Modules',
            'AI Chat Assistant',
            'Instant Quizzes',
            'Progress Tracking',
          ].map((text) => (
            <div key={text} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 16px', borderRadius: 'var(--radius-full)',
              background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)',
              fontSize: '0.8125rem', color: 'var(--text-secondary)',
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-primary)' }} /> {text}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
