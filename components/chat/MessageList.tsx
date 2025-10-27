'use client';

import { useEffect, useRef } from 'react';
import { Message, QuickActionButton } from '@/types/chat';
import { MessageBubble } from './MessageBubble';
import { Sparkles } from 'lucide-react';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  streamingStatus?: 'searching' | 'writing' | null;
  onQuickAction?: (button: QuickActionButton) => void;
}

export function MessageList({
  messages,
  isLoading,
  streamingStatus,
  onQuickAction,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingStatus]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Bienvenido al Chatbot IA
        </h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-md">
          Haz una pregunta para comenzar. Estoy aquí para ayudarte 24/7.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          onQuickAction={onQuickAction}
        />
      ))}

      {/* Status indicator */}
      {streamingStatus && (
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <div className="w-2 h-2 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-pulse"></div>
          {streamingStatus === 'searching'
            ? 'Buscando datos...'
            : 'Escribiendo...'}
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
