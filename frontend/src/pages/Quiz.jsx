import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStudyStore from '../store/studyStore';

export default function Quiz() {
  const navigate = useNavigate();
  const {
    quizData, quizAnswers, quizSubmitted, isGeneratingQuiz,
    setQuizAnswer, submitQuiz, resetQuiz, generateQuiz,
    markComplete, currentModuleId, curriculum,
  } = useStudyStore();

  const [activeQ, setActiveQ] = useState(0);

  const currentModule = curriculum?.modules?.find(m => m.id === currentModuleId);

  if (isGeneratingQuiz) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, position: 'relative', zIndex: 1 }}>
        <div className="spinner spinner-lg" />
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700 }}>Generating your quiz…</div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Gemma AI is crafting personalized questions</div>
      </div>
    );
  }

  if (!quizData || !quizData.questions?.length) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: '4rem' }}>📝</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700 }}>No quiz loaded</div>
        <div style={{ color: 'var(--text-muted)' }}>Go back to the study page and click "Take Quiz" on a module.</div>
        <button className="btn btn-primary" onClick={() => navigate('/study')}>← Back to Study</button>
      </div>
    );
  }

  const { questions, moduleTitle } = quizData;
  const answeredCount = Object.keys(quizAnswers).length;
  const allAnswered = answeredCount === questions.length;

  // Score calculation
  const score = quizSubmitted
    ? questions.reduce((acc, q) => acc + (quizAnswers[q.id] === q.correctIndex ? 1 : 0), 0)
    : 0;
  const scorePercent = Math.round((score / questions.length) * 100);
  const passed = scorePercent >= 70;

  const handleSubmit = () => {
    if (!allAnswered) return;
    submitQuiz();
    if (passed) markComplete(currentModuleId);
  };

  const handleRetry = () => {
    resetQuiz();
    setActiveQ(0);
    generateQuiz().catch(() => {});
  };

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: 'rgba(8,12,20,0.92)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '0 24px', height: 'var(--header-height)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost btn-sm" id="quiz-back-btn" onClick={() => navigate('/study')}>
            ← Study
          </button>
          <div className="divider" style={{ width: 1, height: 20 }} />
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.975rem' }}>
              Quiz: {moduleTitle}
            </div>
            {!quizSubmitted && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {answeredCount}/{questions.length} answered
              </div>
            )}
          </div>
        </div>

        {!quizSubmitted && (
          <button
            id="submit-quiz-btn"
            className="btn btn-primary btn-sm"
            onClick={handleSubmit}
            disabled={!allAnswered}
          >
            Submit Quiz
          </button>
        )}
      </header>

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '32px 24px' }}>
        {/* Score card (after submit) */}
        {quizSubmitted && (
          <div className={`card anim-scale`} style={{
            padding: '36px',
            marginBottom: 36,
            textAlign: 'center',
            background: passed
              ? 'linear-gradient(145deg, rgba(16,185,129,0.1), rgba(6,182,212,0.06))'
              : 'linear-gradient(145deg, rgba(244,63,94,0.1), rgba(251,146,60,0.06))',
            border: `1px solid ${passed ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'}`,
          }}>
            <div style={{
              fontFamily: 'var(--font-display)', fontWeight: 800,
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              color: passed ? '#34d399' : '#fb7185',
              lineHeight: 1,
              marginBottom: 8,
            }}>
              {scorePercent}%
            </div>
            <div style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: 6 }}>
              {score} / {questions.length} correct
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 24 }}>
              {scorePercent === 100 ? 'Perfect score! Outstanding!' :
               passed ? 'Great job! Module marked as complete' :
               'Keep practicing — you\'ve got this!'}
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" id="back-study-btn" onClick={() => navigate('/study')}>
                ← Back to Study
              </button>
              <button className="btn btn-primary" id="retry-quiz-btn" onClick={handleRetry}>
                Retry Quiz
              </button>
            </div>
          </div>
        )}

        {/* Question Navigator */}
        {questions.length > 1 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
            {questions.map((q, i) => {
              const answered = quizAnswers[q.id] !== undefined;
              const correct  = quizSubmitted && quizAnswers[q.id] === q.correctIndex;
              const wrong    = quizSubmitted && answered && quizAnswers[q.id] !== q.correctIndex;
              return (
                <button
                  key={q.id}
                  id={`q-nav-${i}`}
                  onClick={() => setActiveQ(i)}
                  style={{
                    width: 36, height: 36, borderRadius: 8, border: 'none',
                    fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: wrong    ? 'rgba(244,63,94,0.2)'   :
                                correct  ? 'rgba(16,185,129,0.2)'  :
                                answered ? 'rgba(99,102,241,0.2)'  :
                                           'var(--bg-glass)',
                    color: wrong    ? '#fb7185' :
                           correct  ? '#34d399' :
                           answered ? 'var(--accent-glow)' :
                                      'var(--text-muted)',
                    outline: activeQ === i ? '2px solid var(--accent-primary)' : 'none',
                    outlineOffset: 2,
                  }}
                >
                  {wrong ? '✗' : correct ? '✓' : i + 1}
                </button>
              );
            })}
          </div>
        )}

        {/* Questions */}
        {questions.map((q, qIdx) => {
          const userAnswer = quizAnswers[q.id];
          const isCorrect  = quizSubmitted && userAnswer === q.correctIndex;
          const isWrong    = quizSubmitted && userAnswer !== undefined && userAnswer !== q.correctIndex;
          const isHidden   = questions.length > 1 && activeQ !== qIdx;

          if (isHidden && !quizSubmitted) return null;

          return (
            <div
              key={q.id}
              id={`question-${q.id}`}
              className="card anim-up"
              style={{
                padding: '26px 28px',
                marginBottom: 20,
                border: `1px solid ${isCorrect ? 'rgba(16,185,129,0.35)' : isWrong ? 'rgba(244,63,94,0.35)' : 'var(--border-subtle)'}`,
                background: isCorrect ? 'rgba(16,185,129,0.05)' : isWrong ? 'rgba(244,63,94,0.05)' : 'var(--bg-card)',
              }}
            >
              {/* Q Number & Text */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.85rem', fontWeight: 700,
                  background: isCorrect ? 'rgba(16,185,129,0.2)' : isWrong ? 'rgba(244,63,94,0.2)' : 'rgba(99,102,241,0.15)',
                  color: isCorrect ? '#34d399' : isWrong ? '#fb7185' : 'var(--accent-glow)',
                  border: `1px solid ${isCorrect ? 'rgba(16,185,129,0.3)' : isWrong ? 'rgba(244,63,94,0.3)' : 'rgba(99,102,241,0.3)'}`,
                }}>
                  {quizSubmitted ? (isCorrect ? '✓' : '✗') : `Q${qIdx + 1}`}
                </div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.0rem', lineHeight: 1.45, color: 'var(--text-primary)', margin: 0 }}>
                  {q.question}
                </h2>
              </div>

              {/* Options */}
              <div className="quiz-options-container">
                {q.options.map((opt, idx) => {
                  const isSelected = userAnswer === idx;
                  const isCorrectOpt = quizSubmitted && idx === q.correctIndex;
                  const isWrongOpt   = quizSubmitted && isSelected && idx !== q.correctIndex;

                  let bg = 'var(--bg-glass)';
                  let border = 'var(--border-subtle)';
                  let color = 'var(--text-secondary)';

                  if (!quizSubmitted && isSelected) { bg = 'rgba(99,102,241,0.15)'; border = 'var(--border-accent)'; color = 'var(--text-primary)'; }
                  if (isCorrectOpt)  { bg = 'rgba(16,185,129,0.12)'; border = 'rgba(16,185,129,0.4)'; color = '#34d399'; }
                  if (isWrongOpt)    { bg = 'rgba(244,63,94,0.12)';  border = 'rgba(244,63,94,0.4)';  color = '#fb7185'; }

                  return (
                    <button
                      key={idx}
                      id={`option-${q.id}-${idx}`}
                      onClick={() => !quizSubmitted && setQuizAnswer(q.id, idx)}
                      disabled={quizSubmitted}
                      style={{
                        width: '100%', textAlign: 'left', padding: '12px 16px',
                        borderRadius: 'var(--radius-md)', border: `1px solid ${border}`,
                        background: bg, color, cursor: quizSubmitted ? 'default' : 'pointer',
                        transition: 'all 0.2s', fontSize: '0.9rem', lineHeight: 1.5,
                        display: 'flex', alignItems: 'center', gap: 10,
                      }}
                    >
                      <span style={{
                        width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.75rem', fontWeight: 700,
                        background: isCorrectOpt ? 'rgba(16,185,129,0.2)' : isWrongOpt ? 'rgba(244,63,94,0.2)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${border}`,
                      }}>
                        {isCorrectOpt ? '✓' : isWrongOpt ? '✗' : String.fromCharCode(65 + idx)}
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>

              {/* Explanation */}
              {quizSubmitted && q.explanation && (
                <div className="quiz-explanation-container">
                  <span style={{ fontWeight: 700, color: 'var(--accent-glow)', marginRight: 6 }}>Explanation:</span>
                  {q.explanation}
                </div>
              )}

              {/* Next button */}
              {!quizSubmitted && qIdx < questions.length - 1 && (
                <div className="quiz-next-container">
                  <button
                    className="btn btn-secondary btn-sm"
                    id={`next-q-${qIdx}`}
                    onClick={() => setActiveQ(qIdx + 1)}
                    disabled={userAnswer === undefined}
                  >
                    Next Question →
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Submit at bottom */}
        {!quizSubmitted && (
          <div style={{ textAlign: 'center', padding: '8px 0 40px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>
              {answeredCount} of {questions.length} questions answered
            </div>
            <button
              id="submit-quiz-bottom-btn"
              className="btn btn-primary btn-lg"
              onClick={handleSubmit}
              disabled={!allAnswered}
            >
              Submit Quiz
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
