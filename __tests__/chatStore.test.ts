import { renderHook, act } from '@testing-library/react-native';
import { useChatStore } from '../stores/chatStore';
import type { Message } from '../types/chat';

describe('chatStore', () => {
  beforeEach(() => {
    // Resetear el store antes de cada test
    const { result } = renderHook(() => useChatStore());
    act(() => {
      result.current.clearMessages();
      result.current.setInputText('');
    });
  });

  describe('Estado inicial', () => {
    it('debe tener un array vacío de mensajes', () => {
      const { result } = renderHook(() => useChatStore());

      expect(result.current.messages).toEqual([]);
    });

    it('debe tener inputText vacío', () => {
      const { result } = renderHook(() => useChatStore());

      expect(result.current.inputText).toBe('');
    });
  });

  describe('setInputText', () => {
    it('debe actualizar el texto del input', () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        result.current.setInputText('Hola mundo');
      });

      expect(result.current.inputText).toBe('Hola mundo');
    });

    it('debe permitir actualizar múltiples veces', () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        result.current.setInputText('Primera actualización');
      });

      expect(result.current.inputText).toBe('Primera actualización');

      act(() => {
        result.current.setInputText('Segunda actualización');
      });

      expect(result.current.inputText).toBe('Segunda actualización');
    });
  });

  describe('addMessage', () => {
    it('debe agregar un mensaje al store', () => {
      const { result } = renderHook(() => useChatStore());

      const newMessage: Message = {
        id: '1',
        role: 'user',
        content: 'Hola',
        timestamp: Date.now(),
      };

      act(() => {
        result.current.addMessage(newMessage);
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0]).toEqual(newMessage);
    });

    it('debe mantener el orden de los mensajes', () => {
      const { result } = renderHook(() => useChatStore());

      const message1: Message = {
        id: '1',
        role: 'user',
        content: 'Primer mensaje',
        timestamp: Date.now(),
      };

      const message2: Message = {
        id: '2',
        role: 'assistant',
        content: 'Segundo mensaje',
        timestamp: Date.now(),
      };

      act(() => {
        result.current.addMessage(message1);
        result.current.addMessage(message2);
      });

      expect(result.current.messages).toHaveLength(2);
      expect(result.current.messages[0].id).toBe('1');
      expect(result.current.messages[1].id).toBe('2');
    });
  });

  describe('updateMessage', () => {
    it('debe actualizar un mensaje existente', () => {
      const { result } = renderHook(() => useChatStore());

      const message: Message = {
        id: '1',
        role: 'assistant',
        content: 'Mensaje original',
        timestamp: Date.now(),
      };

      act(() => {
        result.current.addMessage(message);
      });

      act(() => {
        result.current.updateMessage('1', { content: 'Mensaje actualizado' });
      });

      expect(result.current.messages[0].content).toBe('Mensaje actualizado');
    });

    it('debe actualizar solo el mensaje especificado', () => {
      const { result } = renderHook(() => useChatStore());

      const message1: Message = {
        id: '1',
        role: 'user',
        content: 'Mensaje 1',
        timestamp: Date.now(),
      };

      const message2: Message = {
        id: '2',
        role: 'assistant',
        content: 'Mensaje 2',
        timestamp: Date.now(),
      };

      act(() => {
        result.current.addMessage(message1);
        result.current.addMessage(message2);
      });

      act(() => {
        result.current.updateMessage('2', { content: 'Mensaje 2 actualizado' });
      });

      expect(result.current.messages[0].content).toBe('Mensaje 1');
      expect(result.current.messages[1].content).toBe('Mensaje 2 actualizado');
    });

    it('no debe hacer nada si el ID no existe', () => {
      const { result } = renderHook(() => useChatStore());

      const message: Message = {
        id: '1',
        role: 'user',
        content: 'Mensaje original',
        timestamp: Date.now(),
      };

      act(() => {
        result.current.addMessage(message);
      });

      act(() => {
        result.current.updateMessage('999', { content: 'No debería cambiar' });
      });

      expect(result.current.messages[0].content).toBe('Mensaje original');
    });
  });

  describe('clearMessages', () => {
    it('debe eliminar todos los mensajes', () => {
      const { result } = renderHook(() => useChatStore());

      const message1: Message = {
        id: '1',
        role: 'user',
        content: 'Mensaje 1',
        timestamp: Date.now(),
      };

      const message2: Message = {
        id: '2',
        role: 'assistant',
        content: 'Mensaje 2',
        timestamp: Date.now(),
      };

      act(() => {
        result.current.addMessage(message1);
        result.current.addMessage(message2);
      });

      expect(result.current.messages).toHaveLength(2);

      act(() => {
        result.current.clearMessages();
      });

      expect(result.current.messages).toEqual([]);
    });

    it('no debe afectar al inputText', () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        result.current.setInputText('Texto importante');
        result.current.addMessage({
          id: '1',
          role: 'user',
          content: 'Mensaje',
          timestamp: Date.now(),
        });
      });

      act(() => {
        result.current.clearMessages();
      });

      expect(result.current.messages).toEqual([]);
      expect(result.current.inputText).toBe('Texto importante');
    });
  });

  describe('Integración', () => {
    it('debe manejar un flujo completo de conversación', () => {
      const { result } = renderHook(() => useChatStore());

      // Usuario escribe mensaje
      act(() => {
        result.current.setInputText('¿Cuál es el horario de misas?');
      });

      expect(result.current.inputText).toBe('¿Cuál es el horario de misas?');

      // Se envía el mensaje
      act(() => {
        result.current.addMessage({
          id: '1',
          role: 'user',
          content: result.current.inputText,
          timestamp: Date.now(),
        });
        result.current.setInputText('');
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.inputText).toBe('');

      // Se agrega mensaje temporal del bot
      act(() => {
        result.current.addMessage({
          id: '2',
          role: 'assistant',
          content: '',
          timestamp: Date.now(),
        });
      });

      expect(result.current.messages).toHaveLength(2);

      // Se actualiza con la respuesta real
      act(() => {
        result.current.updateMessage('2', {
          content: 'Las misas son los domingos a las 10:00 AM',
        });
      });

      expect(result.current.messages[1].content).toBe(
        'Las misas son los domingos a las 10:00 AM'
      );
    });
  });
});
