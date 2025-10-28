'use client';

import { useChat } from '@/lib/hooks/useChat';
import { Sparkles, Trash2 } from 'lucide-react';
import { MessageList } from './chat/MessageList';
import { ChatInput } from './chat/ChatInput';
import { useEffect, useState } from 'react';

export function Chat() {
  const {
    messages,
    inputText,
    setInputText,
    isLoading,
    streamingStatus,
    handleSend,
    handleQuickAction,
    clearMessages,
  } = useChat();

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detectar cuando un input tiene focus (teclado visible)
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT'
      ) {
        setIsKeyboardVisible(true);
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT'
      ) {
        setIsKeyboardVisible(false);
      }
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header compacto - iOS 26 Liquid Glass Lite */}
      <header className="relative px-4 py-2.5 overflow-hidden backdrop-blur-xl border-b border-white/20 dark:border-slate-700/30 shadow-sm flex-shrink-0">
        {/* Efecto Liquid Glass */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-indigo-700/15 dark:from-blue-500/10 dark:to-indigo-600/15" />
        <div
          className="absolute inset-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl"
          style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
        />

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-[15px] font-bold text-slate-900 dark:text-white tracking-tight leading-none">
                Chatbot Parroquial
              </h1>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium tracking-tight leading-none mt-0.5">
                Asistente con IA 24/7
              </p>
            </div>
          </div>

          {messages.length > 0 && (
            <button
              onClick={clearMessages}
              className="p-2 hover:bg-white/60 dark:hover:bg-slate-700/60 backdrop-blur-md rounded-lg transition-all shadow-sm"
              style={{ backdropFilter: 'blur(10px)' }}
              title="Limpiar conversación"
            >
              <Trash2
                className="w-4.5 h-4.5 text-slate-500 dark:text-slate-400"
                strokeWidth={2.5}
              />
            </button>
          )}
        </div>
      </header>

      {/* Messages - área de scroll optimizada */}
      <div className={`flex-1 overflow-y-auto px-4 py-4 ${isKeyboardVisible ? 'pb-4' : 'pb-32'}`}>
        <MessageList
          messages={messages}
          isLoading={isLoading}
          streamingStatus={streamingStatus}
          onQuickAction={(button) => {
            // Find the message with this quick action
            const message = messages.find((m) =>
              m.quickActions?.buttons.some((b) => b.label === button.label)
            );
            if (message) {
              handleQuickAction(button, message.id);
            }
          }}
        />
      </div>

      {/* Input - padding dinámico: grande cuando hay menú, pequeño cuando hay teclado */}
      <div className={`flex-shrink-0 ${isKeyboardVisible ? 'pb-2' : 'pb-28'}`}>
        <ChatInput
          value={inputText}
          onChange={setInputText}
          onSend={() => handleSend()}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
