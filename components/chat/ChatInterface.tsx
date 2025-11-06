'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, FileText, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  timestamp: Date;
}

interface Source {
  filename: string;
  score: number;
  text: string;
}

interface ChatInterfaceProps {
  workspaceId: string;
  userId?: string;
  onConversationCreate?: (conversationId: string) => void;
}

export default function ChatInterface({ workspaceId, userId: propUserId, onConversationCreate }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(propUserId || null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Get user ID from Supabase auth
  useEffect(() => {
    if (!userId) {
      supabase.auth.getUser().then(({ data }) => {
        if (data.user) {
          setUserId(data.user.id);
        }
      });
    }
  }, [userId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  // Create or get conversation
  const ensureConversation = async () => {
    if (conversationId) return conversationId;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    console.log('Creating new conversation...');
    const response = await fetch('/api/conversations/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspaceId: workspaceId,
        userId: userId,
        channel: 'web',
        metadata: {},
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create conversation');
    }

    const data = await response.json();
    const newConversationId = data.conversation.id;
    setConversationId(newConversationId);

    if (onConversationCreate) {
      onConversationCreate(newConversationId);
    }

    console.log('Conversation created:', newConversationId);
    return newConversationId;
  };

  // Save message to database
  const saveMessage = async (conversationId: string, role: 'user' | 'assistant', content: string, metadata: any = {}) => {
    try {
      await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          content,
          metadata,
        }),
      });
    } catch (error) {
      console.error('Error saving message:', error);
      // Don't throw - we want the chat to continue even if DB save fails
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Ensure we have a conversation ID
      const convId = await ensureConversation();

      // Save user message to database
      await saveMessage(convId, 'user', userMessage.content);
      // Step 1: RAG Search
      console.log('Searching for relevant context...');
      const ragResponse = await fetch('/api/chat/rag-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userMessage.content,
          workspaceId: workspaceId,
          topK: 3,
          includeMetadata: true,
          expandQuery: false, // Can enable for better search
        }),
      });

      if (!ragResponse.ok) {
        throw new Error('Failed to search knowledge base');
      }

      const ragData = await ragResponse.json();
      console.log('Found context:', ragData.results.length, 'chunks');

      // Prepare context for generation
      const context = ragData.results.map((result: any) => ({
        text: result.text,
        filename: result.metadata.filename,
        score: result.score,
      }));

      // Step 2: Generate response with streaming
      setIsStreaming(true);
      const assistantMessageId = (Date.now() + 1).toString();
      let assistantContent = '';

      // Add placeholder message
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          sources: context,
          timestamp: new Date(),
        },
      ]);

      const generateResponse = await fetch('/api/chat/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: userMessage.content }],
          context: context,
          model: 'gpt-4o-mini',
          temperature: 0.7,
          stream: true,
        }),
      });

      if (!generateResponse.ok) {
        throw new Error('Failed to generate response');
      }

      // Handle streaming response
      const reader = generateResponse.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No reader available');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              break;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                assistantContent += parsed.content;

                // Update message with new content
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: assistantContent }
                      : msg
                  )
                );
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      console.log('Response completed');

      // Save assistant message to database
      if (assistantContent && convId) {
        await saveMessage(convId, 'assistant', assistantContent, {
          sources: context.map((c: any) => ({
            filename: c.filename,
            score: c.score,
          })),
        });
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Failed to send message');

      // Add error message
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Lo siento, ocurrió un error al procesar tu mensaje. Por favor intenta de nuevo.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/20 rounded-full flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                ¿En qué puedo ayudarte?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
                Pregúntame cualquier cosa sobre tus documentos. Buscaré en tu base de conocimiento
                para darte la mejor respuesta.
              </p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-3xl ${
                message.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
              } rounded-lg px-4 py-3 shadow-sm`}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>

              {/* Show sources for assistant messages */}
              {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mb-2">
                    <FileText className="w-3 h-3" />
                    <span className="font-medium">Fuentes:</span>
                  </div>
                  <div className="space-y-1">
                    {message.sources.map((source, idx) => (
                      <div
                        key={idx}
                        className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2"
                      >
                        <span className="w-5 h-5 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-[10px] font-medium">
                          {idx + 1}
                        </span>
                        <span className="truncate">{source.filename}</span>
                        <span className="text-gray-400">
                          ({Math.round(source.score * 100)}% relevancia)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Streaming indicator */}
              {message.role === 'assistant' && message.content === '' && isStreaming && (
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Escribiendo...</span>
                </div>
              )}
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu pregunta aquí..."
              disabled={isLoading}
              rows={1}
              className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] max-h-[200px]"
            />
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Presiona Enter para enviar, Shift+Enter para nueva línea
          </div>
        </div>
      </div>
    </div>
  );
}
