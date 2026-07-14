import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import useStudyStore from '../store/studyStore';

export default function ChatPanel() {
  const { chatMessages, isChatLoading, sendMessage, clearChat, curriculum, currentModuleId, chatOpen, setChatOpen } = useStudyStore();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const currentModule = curriculum?.modules?.find(m => m.id === currentModuleId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    if (chatOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [chatOpen]);

  const handleSend = (e) => {
    e.preventDefault();
    const msg = input.trim();
    if (!msg || isChatLoading) return;
    setInput('');
    sendMessage(msg);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { handleSend(e); }
  };

  const QUICK_ASKS = [
    'Explain this in simple terms',
    'Give me a real-world example',
    'What are common mistakes?',
    'Summarize the key points',
  ];

  return (
    <div
      className={`anim-right chat-panel-container ${chatOpen ? 'active' : ''}`}
      style={{
        width: 'var(--chat-width)',
        minWidth: 320,
        maxWidth: 380,
        height: '100vh',
        position: 'sticky',
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(8,12,20,0.94)',
        borderLeft: '1px solid var(--border-subtle)',
        backdropFilter: 'blur(20px)',
        zIndex: 10,
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div style={{
        padding: '16px 18px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.975rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            AI Tutor
            <div className="pulse-dot" />
          </div>
          {currentModule && (
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
              Context: {currentModule.title}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {chatMessages.length > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={clearChat} id="clear-chat-btn" title="Clear chat" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>
              Clear
            </button>
          )}
          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setChatOpen(false)} id="close-chat-btn" title="Close chat">
            ✕
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {chatMessages.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 40 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--text-primary)', fontSize: '1rem', marginBottom: 8 }}>
              Your AI Study Tutor
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', lineHeight: 1.6, marginBottom: 28 }}>
              Ask me anything about{currentModule ? ` ${currentModule.title}` : ' this topic'}.
            </div>
            {/* Quick asks */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {QUICK_ASKS.map(q => (
                <button
                  key={q}
                  id={`quick-ask-${q.replace(/\s+/g, '-').toLowerCase()}`}
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', justifyContent: 'flex-start', textAlign: 'left', fontSize: '0.75rem' }}
                  onClick={() => { setInput(q); inputRef.current?.focus(); }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          chatMessages.map((msg, i) => (
            <div
              key={i}
              className="anim-up"
              style={{
                marginBottom: 16,
                display: 'flex',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                alignItems: 'flex-start',
                gap: 8,
              }}
            >
              {/* Avatar */}
              <div style={{
                width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem',
                fontWeight: 800,
                background: msg.role === 'user' ? 'var(--grad-primary)' : 'rgba(34,211,238,0.15)',
                border: `1px solid ${msg.role === 'user' ? 'rgba(99,102,241,0.4)' : 'rgba(34,211,238,0.3)'}`,
                color: '#fff'
              }}>
                {msg.role === 'user' ? 'U' : 'AI'}
              </div>

              {/* Bubble */}
              <div style={{
                maxWidth: '80%',
                padding: '10px 14px',
                borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.15))'
                  : 'rgba(255,255,255,0.04)',
                border: `1px solid ${msg.role === 'user' ? 'rgba(99,102,241,0.3)' : 'var(--border-subtle)'}`,
                fontSize: '0.8375rem',
                lineHeight: 1.65,
              }}>
                {msg.role === 'assistant' ? (
                  msg.content ? (
                    <div className="md-content" style={{ fontSize: '0.8125rem' }}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center', color: 'var(--text-muted)' }}>
                      <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                      <span style={{ fontSize: '0.8rem' }}>Thinking…</span>
                    </div>
                  )
                ) : (
                  <span style={{ color: 'var(--text-primary)' }}>{msg.content}</span>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border-subtle)' }}>
        <form onSubmit={handleSend} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            id="chat-input"
            className="input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question… (Enter to send)"
            rows={2}
            disabled={isChatLoading}
            style={{ resize: 'none', flex: 1, fontSize: '0.875rem', lineHeight: 1.5 }}
          />
          <button
            id="send-chat-btn"
            type="submit"
            className="btn btn-primary btn-icon"
            disabled={isChatLoading || !input.trim()}
            style={{ padding: '10px 14px', alignSelf: 'flex-end', flexShrink: 0 }}
          >
            {isChatLoading ? (
              <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
            ) : '➤'}
          </button>
        </form>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 6, textAlign: 'center' }}>
          Powered by Gemma AI · Context-aware responses
        </div>
      </div>
    </div>
  );
}
