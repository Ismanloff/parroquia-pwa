'use client';

import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Message, QuickActionButton } from '@/types/chat';
import { AttachmentCard } from './AttachmentCard';
import { QuickActionButtons } from './QuickActionButtons';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  message: Message;
  onQuickAction?: (button: QuickActionButton) => void;
}

function MessageBubbleComponent({ message, onQuickAction }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn('flex gap-4', isUser ? 'justify-end' : 'justify-start')}
    >
      {!isUser && (
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
      )}

      <div className="flex flex-col max-w-2xl">
        <div
          className={cn(
            isUser
              ? 'rounded-2xl px-4 py-3 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'
              : 'text-slate-900 dark:text-white'
          )}
        >
          <div className={cn(
            "leading-relaxed markdown-content",
            isUser ? "text-sm" : "text-sm"
          )}>
            <ReactMarkdown
              components={{
                p: ({ children }) => (
                  <p className="mb-2 last:mb-0">{children}</p>
                ),
                strong: ({ children }) => (
                  <strong className="font-bold">{children}</strong>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside space-y-1 my-2">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside space-y-1 my-2">
                    {children}
                  </ol>
                ),
                li: ({ children }) => <li className="ml-2">{children}</li>,
                a: ({ children, href }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'underline hover:no-underline',
                      isUser ? 'text-blue-600 dark:text-blue-400' : 'text-blue-600 dark:text-blue-400'
                    )}
                  >
                    {children}
                  </a>
                ),
                code: ({ children }) => (
                  <code
                    className={cn(
                      'px-1.5 py-0.5 rounded text-xs font-mono',
                      isUser ? 'bg-slate-300 dark:bg-slate-600 text-slate-800 dark:text-slate-200' : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                    )}
                  >
                    {children}
                  </code>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </div>

        {/* Attachments */}
        {!isUser && message.attachments && message.attachments.length > 0 && (
          <div className="space-y-2 ml-0">
            {message.attachments.map((attachment, index) => (
              <AttachmentCard key={index} attachment={attachment} />
            ))}
          </div>
        )}

        {/* Quick Actions */}
        {!isUser &&
          message.quickActions &&
          message.quickActions.buttons.length > 0 &&
          onQuickAction && (
            <QuickActionButtons
              buttons={message.quickActions.buttons}
              onActionPress={onQuickAction}
            />
          )}
      </div>

    </div>
  );
}

// Memoize to prevent unnecessary re-renders
export const MessageBubble = memo(MessageBubbleComponent);
