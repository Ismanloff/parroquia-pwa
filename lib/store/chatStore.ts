import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Message } from '@/types/chat';

interface ChatStore {
  messages: Message[];
  inputText: string;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  setInputText: (text: string) => void;
  clearMessages: () => void;
  removeQuickActions: (messageId: string) => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      messages: [],
      inputText: '',

      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message],
        })),

      updateMessage: (id, updates) =>
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === id ? { ...msg, ...updates } : msg
          ),
        })),

      setInputText: (text) => set({ inputText: text }),

      clearMessages: () => set({ messages: [] }),

      removeQuickActions: (messageId) =>
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === messageId ? { ...msg, quickActions: null } : msg
          ),
        })),
    }),
    {
      name: 'chat-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist messages, not inputText
      partialize: (state) => ({ messages: state.messages }),
    }
  )
);
