import { useNavigate } from 'react-router-dom';
import useStudyStore from '../store/studyStore';

const difficultyColor = {
  beginner:     { bg: 'rgba(16,185,129,0.12)', text: '#34d399', border: 'rgba(16,185,129,0.25)' },
  intermediate: { bg: 'rgba(245,158,11,0.12)', text: '#fbbf24', border: 'rgba(245,158,11,0.25)' },
  advanced:     { bg: 'rgba(244,63,94,0.12)',  text: '#fb7185', border: 'rgba(244,63,94,0.25)'  },
};

export default function Sidebar() {
  const navigate = useNavigate();
  const {
    curriculum, currentModuleId, completedModules,
    setCurrentModule, generateCurriculum, topic, depth,
    chatOpen, setChatOpen, sidebarOpen, setSidebarOpen,
  } = useStudyStore();

  if (!curriculum) return null;

  const { modules, totalTime } = curriculum;
  const progress = Math.round((completedModules.length / modules.length) * 100);

  const handleBack = () => navigate('/');

  return (
    <aside 
      className={sidebarOpen ? 'active' : ''}
      style={{
        width: 'var(--sidebar-width)',
        minWidth: 260,
        maxWidth: 300,
        height: '100vh',
        position: 'sticky',
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(8,12,20,0.92)',
        borderRight: '1px solid var(--border-subtle)',
        backdropFilter: 'blur(20px)',
        zIndex: 10,
        flexShrink: 0,
      }}
    >
      {/* Logo & Back */}
      <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: 'var(--grad-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.8rem', fontWeight: 800, color: '#fff'
          }}>S</div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem' }}>
            Study<span className="text-gradient">AI</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button className="btn btn-ghost btn-icon" onClick={handleBack} id="back-home-btn" title="New topic">
            ← 
          </button>
          <button 
            className="btn btn-ghost btn-icon mobile-only-btn" 
            onClick={() => setSidebarOpen(false)} 
            style={{ padding: 6, fontSize: 16 }}
            id="close-sidebar-btn"
            title="Close Menu"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Curriculum Info */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
          Curriculum
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 8, lineHeight: 1.3 }}>
          {curriculum.topic}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>{depth}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Duration: {totalTime}</span>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.75rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Progress</span>
          <span style={{ color: 'var(--accent-glow)', fontWeight: 600 }}>{progress}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 6 }}>
          {completedModules.length} of {modules.length} modules complete
        </div>
      </div>

      {/* Modules List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 10px' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '4px 10px 10px' }}>
          Modules
        </div>
        {modules.map((mod, idx) => {
          const isActive    = mod.id === currentModuleId;
          const isCompleted = completedModules.includes(mod.id);
          const dc = difficultyColor[mod.difficulty] || difficultyColor.beginner;

          return (
            <button
              key={mod.id}
              id={`module-${mod.id}`}
              onClick={() => {
                setCurrentModule(mod.id);
                setSidebarOpen(false);
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '10px 10px',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${isActive ? 'var(--border-accent)' : 'transparent'}`,
                background: isActive ? 'rgba(99,102,241,0.1)' : 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
                marginBottom: 2,
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-glass)'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
            >
              {/* Number / Check */}
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700,
                background: isCompleted ? 'rgba(16,185,129,0.2)' : isActive ? 'rgba(99,102,241,0.2)' : 'var(--bg-glass)',
                border: `1px solid ${isCompleted ? 'rgba(16,185,129,0.4)' : isActive ? 'var(--border-accent)' : 'var(--border-subtle)'}`,
                color: isCompleted ? '#34d399' : isActive ? 'var(--accent-glow)' : 'var(--text-muted)',
                marginTop: 1,
              }}>
                {isCompleted ? 'Done' : idx + 1}
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '0.8125rem', fontWeight: 600, lineHeight: 1.35,
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {mod.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{mod.estimatedTime}</span>
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 600, padding: '1px 6px', borderRadius: 4,
                    background: dc.bg, color: dc.text, border: `1px solid ${dc.border}`,
                  }}>{mod.difficulty}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom Buttons */}
      <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 8 }}>
        <button
          id="toggle-chat-btn"
          className="btn btn-secondary"
          style={{ flex: 1, justifyContent: 'center', fontSize: '0.8125rem' }}
          onClick={() => setChatOpen(!chatOpen)}
        >
          {chatOpen ? 'Hide' : 'Show'} Chat
        </button>
      </div>
    </aside>
  );
}
