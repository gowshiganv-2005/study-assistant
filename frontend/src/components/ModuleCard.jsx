import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import useStudyStore from '../store/studyStore';

export default function ModuleCard() {
  const navigate = useNavigate();
  const {
    curriculum, currentModuleId, completedModules,
    markComplete, generateQuiz, isGeneratingQuiz, setChatOpen,
  } = useStudyStore();

  const modules = curriculum?.modules || [];
  const mod = modules.find(m => m.id === currentModuleId);
  const isCompleted = mod && completedModules.includes(mod.id);
  const modIndex = modules.findIndex(m => m.id === currentModuleId);

  if (!mod) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
        Select a module from the sidebar to begin.
      </div>
    );
  }

  const handleStartQuiz = async () => {
    await generateQuiz();
    navigate('/quiz');
  };

  const difficultyBadge = { beginner: 'badge-success', intermediate: 'badge-warning', advanced: 'badge-danger' };

  return (
    <article style={{ maxWidth: 820, margin: '0 auto', padding: '32px 28px', animation: 'slideUp 0.3s ease both' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 24 }}>
        <span>{curriculum.topic}</span>
        <span>›</span>
        <span style={{ color: 'var(--text-secondary)' }}>Module {modIndex + 1}</span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontWeight: 800,
              fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', lineHeight: 1.2,
              letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: 12,
            }}>
              {mod.title}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.0rem', lineHeight: 1.65, maxWidth: 600 }}>
              {mod.summary}
            </p>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
            <button
              id={`mark-complete-${mod.id}`}
              className={`btn ${isCompleted ? 'btn-secondary' : 'btn-primary'}`}
              onClick={() => markComplete(mod.id)}
              style={{ fontSize: '0.875rem' }}
            >
              {isCompleted ? 'Completed' : 'Mark Complete'}
            </button>
            <button
              id={`quiz-btn-${mod.id}`}
              className="btn btn-secondary"
              onClick={handleStartQuiz}
              disabled={isGeneratingQuiz}
              style={{ fontSize: '0.875rem' }}
            >
              {isGeneratingQuiz ? (
                <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Generating…</>
              ) : 'Take Quiz'}
            </button>
          </div>
        </div>

        {/* Meta */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
          <span className={`badge ${difficultyBadge[mod.difficulty] || 'badge-primary'}`}>{mod.difficulty}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Duration: {mod.estimatedTime}
          </span>
          {isCompleted && <span className="badge badge-success">Complete</span>}
        </div>
      </div>

      {/* Divider */}
      <div className="divider" style={{ marginBottom: 28 }} />

      {/* Key Points */}
      {mod.keyPoints?.length > 0 && (
        <div style={{
          background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 'var(--radius-lg)', padding: '18px 22px', marginBottom: 28,
        }}>
          <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--accent-glow)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            Key Learning Points
          </div>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {mod.keyPoints.map((pt, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--accent-primary)', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{i + 1}.</span>
                {pt}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Content */}
      <div className="md-content card" style={{ padding: '28px 28px', marginBottom: 28 }}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{mod.content}</ReactMarkdown>
      </div>

      {/* Subtopics */}
      {mod.subtopics?.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Related Subtopics
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {mod.subtopics.map((s, i) => (
              <span key={i} className="badge badge-cyan" style={{ fontSize: '0.8rem', padding: '4px 12px' }}>{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Bottom CTA row */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button
          className="btn btn-primary"
          id="ask-ai-btn"
          onClick={() => setChatOpen(true)}
          style={{ fontSize: '0.875rem' }}
        >
          Ask AI Tutor
        </button>
        <button
          className="btn btn-secondary"
          id="quiz-bottom-btn"
          onClick={handleStartQuiz}
          disabled={isGeneratingQuiz}
          style={{ fontSize: '0.875rem' }}
        >
          {isGeneratingQuiz
            ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Generating Quiz…</>
            : 'Test Your Knowledge'
          }
        </button>
      </div>
    </article>
  );
}
