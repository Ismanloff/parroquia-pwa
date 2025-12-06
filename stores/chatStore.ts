import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Message } from '@/types/chat';

type ChatState = {
  // Estado
  messages: Message[];
  inputText: string;

  // Acciones
  setInputText: (text: string) => void;
  clearMessages: () => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
};

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      // Estado inicial
      messages: [],
      inputText: '',

      // Acción: Actualizar texto de input
      setInputText: (text: string) => {
        set({ inputText: text });
      },

      // Acción: Limpiar todos los mensajes
      clearMessages: () => {
        set({ messages: [] });
      },

      // Acción: Agregar un mensaje
      addMessage: (message: Message) => {
        set((state) => ({
          messages: [...state.messages, message],
        }));
      },

      // Acción: Actualizar un mensaje existente
      updateMessage: (id: string, updates: Partial<Message>) => {
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          ),
        }));
      },
    }),
    {
      name: 'chat-storage', // Nombre único en AsyncStorage
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Solo persistir mensajes, NO inputText
        messages: state.messages,
      }),
    }
  )
);
