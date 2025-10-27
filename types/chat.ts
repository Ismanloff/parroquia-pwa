export type Attachment = {
  title: string;
  url: string;
  type: 'pdf' | 'url' | 'image' | 'document' | 'video' | 'audio';
  description: string | null;
};

export type QuickActionButton = {
  emoji: string;
  label: string;
  type: 'message' | 'url';
  action: string;
};

export type QuickActionsConfig = {
  buttons: QuickActionButton[];
};

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  attachments?: Attachment[] | null;
  quickActions?: QuickActionsConfig | null;
};
