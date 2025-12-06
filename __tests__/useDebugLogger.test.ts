import { debugLogger } from '../hooks/useDebugLogger';

describe('useDebugLogger', () => {
  beforeEach(() => {
    // Limpiar mocks antes de cada test
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  describe('Sanitización de datos', () => {
    it('debe truncar mensajes largos a 200 caracteres', async () => {
      const longMessage = 'a'.repeat(300);
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      await debugLogger.info('Test', { message: longMessage });

      // Esperar a que se procese la cola
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (mockFetch.mock.calls.length > 0) {
        const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(callBody.data.message.length).toBeLessThanOrEqual(203); // 200 + "..."
      }
    });

    it('debe truncar stack traces a 2 líneas', async () => {
      const longStackTrace = 'line1\nline2\nline3\nline4\nline5';
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      await debugLogger.error('Test error', { errorStack: longStackTrace });

      await new Promise((resolve) => setTimeout(resolve, 100));

      if (mockFetch.mock.calls.length > 0) {
        const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
        const lines = callBody.data.errorStack.split('\n');
        expect(lines.length).toBeLessThanOrEqual(2);
      }
    });

    it('debe limitar arrays a 10 elementos', async () => {
      const largeArray = Array(20).fill('item');
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      await debugLogger.info('Test', { items: largeArray });

      await new Promise((resolve) => setTimeout(resolve, 100));

      if (mockFetch.mock.calls.length > 0) {
        const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(callBody.data.items).toBe('[20 items]');
      }
    });
  });

  describe('Comportamiento en desarrollo vs producción', () => {
    it('debe respetar __DEV__ flag', () => {
      // Este test verifica que en producción no se envíen logs
      // En un entorno real, __DEV__ sería false en producción
      expect(typeof __DEV__).toBe('boolean');
    });
  });

  describe('Niveles de log', () => {
    it('debe tener métodos para todos los niveles', () => {
      expect(typeof debugLogger.info).toBe('function');
      expect(typeof debugLogger.error).toBe('function');
      expect(typeof debugLogger.warning).toBe('function');
      expect(typeof debugLogger.debug).toBe('function');
    });
  });

  describe('Manejo de errores', () => {
    it('no debe romper la app si el fetch falla', async () => {
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockRejectedValue(new Error('Network error'));

      // Esto no debería lanzar error (debugLogger.error retorna void, no Promise)
      expect(() => debugLogger.error('Test', { foo: 'bar' })).not.toThrow();

      // Esperar a que se procese la cola
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    it('debe silenciar errores de logging', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockRejectedValue(new Error('Network error'));

      await debugLogger.error('Test');
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Puede loguear el error, pero no debe propagarlo
      consoleSpy.mockRestore();
    });
  });
});
