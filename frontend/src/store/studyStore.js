import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const API_BASE = import.meta.env.VITE_API_BASE 
  ? `${import.meta.env.VITE_API_BASE}/api` 
  : (import.meta.env.PROD ? '/api' : 'http://localhost:3001/api');

const useStudyStore = create(
  persist(
    (set, get) => ({
      // ── Curriculum State ──
      topic: '',
      depth: 'beginner',
      curriculum: null,
      currentModuleId: null,
      completedModules: [],
      isGenerating: false,
      generationError: null,

      // ── Chat State ──
      chatMessages: [],  // { role: 'user'|'assistant', content: string }
      isChatLoading: false,
      chatOpen: false,
      sidebarOpen: false,

      // ── Quiz State ──
      quizData: null,
      quizAnswers: {},
      quizSubmitted: false,
      isGeneratingQuiz: false,

      // ── Setters ──
      setTopic: (topic) => set({ topic }),
      setDepth:  (depth)  => set({ depth }),
      setChatOpen: (open) => set({ chatOpen: open }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      // ── Generate Curriculum ──
      generateCurriculum: async (topic, depth, numModules = 6) => {
        set({ isGenerating: true, generationError: null, curriculum: null, completedModules: [], chatMessages: [], quizData: null });
        try {
          const res = await fetch(`${API_BASE}/generate-modules`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic, depth, numModules }),
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Failed to generate curriculum');
          }
          const data = await res.json();
          set({
            curriculum: data,
            currentModuleId: data.modules?.[0]?.id || null,
            isGenerating: false,
          });
          return data;
        } catch (err) {
          set({ isGenerating: false, generationError: err.message });
          throw err;
        }
      },

      // ── Set Current Module ──
      setCurrentModule: (moduleId) => set({ currentModuleId: moduleId, quizData: null, quizAnswers: {}, quizSubmitted: false }),

      // ── Mark Complete ──
      markComplete: (moduleId) => {
        const { completedModules } = get();
        if (!completedModules.includes(moduleId)) {
          set({ completedModules: [...completedModules, moduleId] });
        }
      },

      // ── Chat ──
      sendMessage: async (userMessage) => {
        const { chatMessages, currentModuleId, curriculum } = get();
        const currentModule = curriculum?.modules?.find(m => m.id === currentModuleId);
        const moduleContext = currentModule
          ? `${currentModule.title}: ${currentModule.summary}`
          : '';

        const newMessages = [...chatMessages, { role: 'user', content: userMessage }];
        set({ chatMessages: newMessages, isChatLoading: true });

        try {
          const res = await fetch(`${API_BASE}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: newMessages, moduleContext }),
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Chat failed');
          }

          // Stream the response
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let assistantText = '';

          // Add placeholder message
          set({ chatMessages: [...newMessages, { role: 'assistant', content: '' }] });

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.text) {
                    assistantText += data.text;
                    const msgs = get().chatMessages;
                    const updated = [...msgs.slice(0, -1), { role: 'assistant', content: assistantText }];
                    set({ chatMessages: updated });
                  }
                  if (data.done) break;
                } catch { /* skip malformed */ }
              }
            }
          }

          set({ isChatLoading: false });
        } catch (err) {
          const msgs = get().chatMessages;
          const updated = [...msgs.slice(0, -1), { role: 'assistant', content: `❌ Error: ${err.message}` }];
          set({ chatMessages: updated, isChatLoading: false });
        }
      },

      clearChat: () => set({ chatMessages: [] }),

      // ── Quiz ──
      generateQuiz: async () => {
        const { curriculum, currentModuleId } = get();
        const mod = curriculum?.modules?.find(m => m.id === currentModuleId);
        if (!mod) return;

        set({ isGeneratingQuiz: true, quizData: null, quizAnswers: {}, quizSubmitted: false });
        try {
          const res = await fetch(`${API_BASE}/generate-quiz`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ moduleTitle: mod.title, content: mod.content }),
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Failed to generate quiz');
          }
          const data = await res.json();
          set({ quizData: data, isGeneratingQuiz: false });
          return data;
        } catch (err) {
          set({ isGeneratingQuiz: false });
          throw err;
        }
      },

      setQuizAnswer: (qId, idx) => set(s => ({ quizAnswers: { ...s.quizAnswers, [qId]: idx } })),
      submitQuiz:   ()          => set({ quizSubmitted: true }),
      resetQuiz:    ()          => set({ quizData: null, quizAnswers: {}, quizSubmitted: false }),
    }),
    {
      name: 'study-assistant-store',
      partialize: (s) => ({
        completedModules: s.completedModules,
        topic: s.topic,
        depth: s.depth,
      }),
    }
  )
);

export default useStudyStore;
