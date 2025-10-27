// Example Test - Vitest + React Testing Library
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { EmptyCalendar, EmptyChat, OfflineState, ErrorState } from '@/components/ui/EmptyState';

describe('EmptyState Components', () => {
  describe('EmptyCalendar', () => {
    it('renders calendar empty state with correct message', () => {
      render(<EmptyCalendar />);

      expect(screen.getByText('No hay eventos esta semana')).toBeInTheDocument();
      expect(
        screen.getByText(
          'No hay eventos programados para esta semana. Revisa otras fechas o vuelve más tarde.'
        )
      ).toBeInTheDocument();
    });

    it('calls onRefresh when refresh button is clicked', async () => {
      const user = userEvent.setup();
      const onRefresh = vi.fn();

      render(<EmptyCalendar onRefresh={onRefresh} />);

      const refreshButton = screen.getByRole('button', { name: /actualizar/i });
      await user.click(refreshButton);

      expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    it('does not render button when onRefresh is not provided', () => {
      render(<EmptyCalendar />);

      const refreshButton = screen.queryByRole('button');
      expect(refreshButton).not.toBeInTheDocument();
    });
  });

  describe('EmptyChat', () => {
    it('renders chat empty state with correct message', () => {
      render(<EmptyChat />);

      expect(screen.getByText('Haz tu primera pregunta')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Pregunta sobre horarios de misa, sacramentos, actividades parroquiales o la fe católica.'
        )
      ).toBeInTheDocument();
    });

    it('does not render action button', () => {
      render(<EmptyChat />);

      const button = screen.queryByRole('button');
      expect(button).not.toBeInTheDocument();
    });
  });

  describe('OfflineState', () => {
    it('renders offline state with correct message', () => {
      render(<OfflineState />);

      expect(screen.getByText('Sin conexión')).toBeInTheDocument();
      expect(
        screen.getByText('Revisa tu conexión a internet e intenta de nuevo.')
      ).toBeInTheDocument();
    });

    it('calls onRetry when retry button is clicked', async () => {
      const user = userEvent.setup();
      const onRetry = vi.fn();

      render(<OfflineState onRetry={onRetry} />);

      const retryButton = screen.getByRole('button', { name: /reintentar/i });
      await user.click(retryButton);

      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('ErrorState', () => {
    it('renders error state with correct message', () => {
      render(<ErrorState />);

      expect(screen.getByText('Error al cargar')).toBeInTheDocument();
      expect(
        screen.getByText('No se pudo cargar el contenido. Por favor, intenta de nuevo.')
      ).toBeInTheDocument();
    });

    it('calls onRetry when retry button is clicked', async () => {
      const user = userEvent.setup();
      const onRetry = vi.fn();

      render(<ErrorState onRetry={onRetry} />);

      const retryButton = screen.getByRole('button', { name: /reintentar/i });
      await user.click(retryButton);

      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });
});
