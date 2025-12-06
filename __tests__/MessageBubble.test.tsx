import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { MessageBubble } from '../components/chat/MessageBubble';
import type { Attachment } from '../types/chat';

// Mock del ThemeContext
jest.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        primary: '#0EA5E9',
        secondary: '#14B8A6',
        background: '#FAFBFC',
        foreground: '#1A202C',
        mutedForeground: '#64748B',
        card: '#F0F4F8',
      },
      isDark: false,
    },
  }),
}));

describe('MessageBubble', () => {
  describe('Renderizado básico', () => {
    it('debe renderizar un mensaje de usuario', () => {
      render(<MessageBubble text="Hola, ¿cómo estás?" isUser={true} />);

      expect(screen.getByText('Hola, ¿cómo estás?')).toBeTruthy();
    });

    it('debe renderizar un mensaje del bot', () => {
      render(<MessageBubble text="Estoy bien, gracias." isUser={false} />);

      expect(screen.getByText('Estoy bien, gracias.')).toBeTruthy();
    });

    it('debe renderizar el indicador de "escribiendo..."', () => {
      render(<MessageBubble text="" isUser={false} />);

      // Buscar texto que empiece con "Escribiendo"
      const typingIndicator = screen.getByText(/Escribiendo/);
      expect(typingIndicator).toBeTruthy();
    });
  });

  describe('Attachments', () => {
    it('debe renderizar attachments cuando se proporcionan', () => {
      const attachments: Attachment[] = [
        {
          title: 'Documento PDF',
          url: '/files/test.pdf',
          type: 'pdf',
          description: 'Un archivo de prueba',
        },
      ];

      render(
        <MessageBubble
          text="Aquí está el documento"
          isUser={false}
          attachments={attachments}
        />
      );

      expect(screen.getByText('Aquí está el documento')).toBeTruthy();
      expect(screen.getByText('Documento PDF')).toBeTruthy();
    });

    it('no debe fallar con attachments nulos', () => {
      render(
        <MessageBubble text="Sin attachments" isUser={false} attachments={null} />
      );

      expect(screen.getByText('Sin attachments')).toBeTruthy();
    });

    it('no debe fallar con array vacío de attachments', () => {
      render(
        <MessageBubble text="Array vacío" isUser={false} attachments={[]} />
      );

      expect(screen.getByText('Array vacío')).toBeTruthy();
    });
  });

  describe('Markdown', () => {
    it('debe renderizar texto con formato markdown', () => {
      const markdownText = '**Negrita** y *cursiva*';

      render(<MessageBubble text={markdownText} isUser={false} />);

      // El componente Markdown debe estar presente
      expect(screen.getByText(/Negrita/)).toBeTruthy();
      expect(screen.getByText(/cursiva/)).toBeTruthy();
    });
  });

  describe('Edge cases', () => {
    it('debe manejar texto vacío', () => {
      render(<MessageBubble text="" isUser={true} />);

      // No debería lanzar error
      expect(screen.toJSON()).toBeTruthy();
    });

    it('debe manejar texto muy largo', () => {
      const longText = 'a'.repeat(1000);

      render(<MessageBubble text={longText} isUser={false} />);

      expect(screen.getByText(longText)).toBeTruthy();
    });

    it('debe manejar caracteres especiales', () => {
      const specialText = '<script>alert("test")</script>';

      render(<MessageBubble text={specialText} isUser={false} />);

      // Markdown escapa los caracteres HTML automáticamente
      // Buscar el texto escapado
      expect(screen.getByText(/script.*alert.*test.*script/)).toBeTruthy();
    });
  });

  describe('Accesibilidad', () => {
    it('debe tener estructura accesible', () => {
      const { toJSON } = render(
        <MessageBubble text="Mensaje de prueba" isUser={true} />
      );

      // Verificar que renderiza correctamente
      const tree = toJSON();
      expect(tree).toBeTruthy();
    });
  });
});
