/**
 * Botón de expansión para respuestas graduales
 *
 * Aparece cuando el backend devuelve { hasMoreInfo: true }
 * Al presionarlo, envía mensaje especial para obtener info detallada
 */

import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { ChevronDown, FileText, Info } from 'lucide-react-native';

interface ExpandButtonProps {
  topic: string;
  onExpand: () => void;
  variant?: 'default' | 'documents' | 'details';
  disabled?: boolean;
}

export const ExpandButton: React.FC<ExpandButtonProps> = ({
  topic,
  onExpand,
  variant = 'default',
  disabled = false,
}) => {
  // Configuración visual según variante
  const config = {
    default: {
      icon: ChevronDown,
      label: '📋 Ver información completa',
      color: '#3B82F6',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
    },
    documents: {
      icon: FileText,
      label: '📄 Ver lista completa de documentos',
      color: '#10B981',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
    },
    details: {
      icon: Info,
      label: 'ℹ️ Ver todos los detalles',
      color: '#8B5CF6',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      borderColor: 'border-purple-200 dark:border-purple-800',
    },
  };

  const { icon: Icon, label, color, bgColor, borderColor } = config[variant];

  return (
    <TouchableOpacity
      onPress={onExpand}
      disabled={disabled}
      className={`
        ${bgColor}
        border ${borderColor}
        rounded-lg
        p-3
        mt-2
        flex-row
        items-center
        justify-center
        active:opacity-70
        ${disabled ? 'opacity-50' : ''}
      `}
    >
      <Icon size={18} color={color} />
      <Text
        className="ml-2 text-sm font-medium"
        style={{ color }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

/**
 * Variante compacta para mostrar inline
 */
export const ExpandButtonCompact: React.FC<Omit<ExpandButtonProps, 'variant'>> = ({
  topic,
  onExpand,
  disabled = false,
}) => {
  return (
    <TouchableOpacity
      onPress={onExpand}
      disabled={disabled}
      className={`
        inline-flex
        items-center
        px-3
        py-1.5
        bg-blue-100 dark:bg-blue-900/30
        border border-blue-300 dark:border-blue-700
        rounded-full
        active:opacity-70
        ${disabled ? 'opacity-50' : ''}
      `}
    >
      <Text className="text-xs font-medium text-blue-700 dark:text-blue-300">
        Más información
      </Text>
      <ChevronDown size={14} color="#3B82F6" className="ml-1" />
    </TouchableOpacity>
  );
};
