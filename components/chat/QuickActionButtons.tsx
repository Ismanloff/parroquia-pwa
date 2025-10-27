import { QuickActionButton } from '@/types/chat';

interface QuickActionButtonsProps {
  buttons: QuickActionButton[];
  onActionPress: (button: QuickActionButton) => void;
}

export function QuickActionButtons({
  buttons,
  onActionPress,
}: QuickActionButtonsProps) {
  if (!buttons || buttons.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {buttons.map((button, index) => (
        <button
          key={index}
          onClick={() => onActionPress(button)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 rounded-full text-sm font-medium text-slate-700 dark:text-slate-300 transition-all hover:shadow-md hover:scale-105"
        >
          <span className="text-base">{button.emoji}</span>
          <span>{button.label}</span>
        </button>
      ))}
    </div>
  );
}
