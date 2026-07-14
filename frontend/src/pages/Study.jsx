import Sidebar from '../components/Sidebar';
import ChatPanel from '../components/ChatPanel';
import ModuleCard from '../components/ModuleCard';
import useStudyStore from '../store/studyStore';

export default function Study() {
  const { chatOpen, setChatOpen, sidebarOpen, setSidebarOpen } = useStudyStore();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      {/* Mobile Top Header */}
      <header className="mobile-header">
        <button 
          className="btn btn-ghost" 
          onClick={() => {
            setSidebarOpen(!sidebarOpen);
            setChatOpen(false); // close chat when menu opens
          }}
          style={{ padding: '6px 12px', fontSize: '0.75rem', fontWeight: 700 }}
          id="mobile-menu-toggle-btn"
          title="Open Menu"
        >
          MENU
        </button>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem' }}>
          Study<span className="text-gradient">AI</span>
        </span>
        <button 
          className="btn btn-ghost" 
          onClick={() => {
            setChatOpen(!chatOpen);
            setSidebarOpen(false); // close menu when chat opens
          }}
          style={{ padding: '6px 12px', fontSize: '0.75rem', fontWeight: 700 }}
          id="mobile-chat-toggle-btn"
          title="Open Chat"
        >
          CHAT
        </button>
      </header>

      {/* Mobile Overlay covering content */}
      <div 
        className={`mobile-overlay ${(sidebarOpen || chatOpen) ? 'active' : ''}`}
        onClick={() => {
          setSidebarOpen(false);
          setChatOpen(false);
        }}
      />

      {/* Sidebar (Overlay on mobile, left panel on desktop) */}
      <Sidebar />

      {/* Main content area */}
      <main 
        className="main-content-area"
        style={{
          flex: 1,
          minWidth: 0,
          overflowY: 'auto',
          background: 'transparent',
        }}
      >
        <ModuleCard />
      </main>

      {/* Chat Panel (Overlay on mobile, right panel on desktop) */}
      <ChatPanel />
    </div>
  );
}
