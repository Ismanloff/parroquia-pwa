import { Attachment } from '@/types/chat';
import { FileText, Link as LinkIcon, Image, Video, Music, File } from 'lucide-react';

interface AttachmentCardProps {
  attachment: Attachment;
}

export function AttachmentCard({ attachment }: AttachmentCardProps) {
  const getIcon = () => {
    switch (attachment.type) {
      case 'pdf':
      case 'document':
        return <FileText className="w-5 h-5" />;
      case 'url':
        return <LinkIcon className="w-5 h-5" />;
      case 'image':
        return <Image className="w-5 h-5" />;
      case 'video':
        return <Video className="w-5 h-5" />;
      case 'audio':
        return <Music className="w-5 h-5" />;
      default:
        return <File className="w-5 h-5" />;
    }
  };

  const handleClick = () => {
    window.open(attachment.url, '_blank');
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-start gap-3 p-3 mt-3 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 rounded-lg transition-colors text-left w-full"
    >
      <div className="flex-shrink-0 w-10 h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-400">
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
          {attachment.title}
        </p>
        {attachment.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
            {attachment.description}
          </p>
        )}
        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Abrir →</p>
      </div>
    </button>
  );
}
