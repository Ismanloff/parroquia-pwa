/** @type {import('tailwindcss').Config} */
module.exports = {
  // ✅ Habilitar dark mode con clase
  darkMode: 'class',
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./contexts/**/*.{js,jsx,ts,tsx}",
    "./hooks/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // 🎨 SEMANTIC COLORS - Tendencias 2025: Vibrantes y modernos
      colors: {
        // Base colors
        background: '#FAFBFC',
        foreground: '#1A202C',

        // Card/Surface
        card: {
          DEFAULT: '#F0F4F8',
          foreground: '#1A202C',
        },

        // Primary brand - Cyan vibrante
        primary: {
          DEFAULT: '#0EA5E9',
          foreground: '#FFFFFF',
        },

        // Secondary - Teal moderno
        secondary: {
          DEFAULT: '#14B8A6',
          foreground: '#FFFFFF',
        },

        // Muted/subtle
        muted: {
          DEFAULT: '#E2E8F0',
          foreground: '#64748B',
        },

        // Accent - Púrpura vibrante
        accent: {
          DEFAULT: '#8B5CF6',
          foreground: '#FFFFFF',
        },

        // Destructive/error
        destructive: {
          DEFAULT: '#EF4444',
          foreground: '#FFFFFF',
        },

        // Success
        success: {
          DEFAULT: '#10B981',
          foreground: '#FFFFFF',
        },

        // Warning
        warning: {
          DEFAULT: '#F59E0B',
          foreground: '#1A202C',
        },

        // Info
        info: {
          DEFAULT: '#0EA5E9',
          foreground: '#FFFFFF',
        },

        // Borders
        border: '#CBD5E1',
        'border-light': '#E2E8F0',

        // Input
        input: {
          DEFAULT: '#FFFFFF',
          foreground: '#1A202C',
        },

        // Ring (focus) - Cyan
        ring: '#0EA5E9',
      },

      // 📏 SPACING (8pt grid)
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
        '3xl': '64px',
      },

      // 🔲 BORDER RADIUS
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
        '3xl': '32px',
      },

      // 📝 TYPOGRAPHY
      fontSize: {
        xs: ['12px', { lineHeight: '16px' }],
        sm: ['14px', { lineHeight: '20px' }],
        base: ['16px', { lineHeight: '24px' }],
        lg: ['18px', { lineHeight: '28px' }],
        xl: ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['30px', { lineHeight: '36px' }],
        '4xl': ['36px', { lineHeight: '40px' }],
      },

      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
      },

      // ⏱️ ANIMATION DURATIONS
      transitionDuration: {
        fast: '150ms',
        base: '250ms',
        slow: '350ms',
      },

      // 📈 EASING FUNCTIONS
      transitionTimingFunction: {
        'ease-in-out-cubic': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [
    // Plugin para colores dark mode
    function ({ addUtilities, theme }) {
      const darkColors = {
        '.dark .bg-background': { backgroundColor: '#0B0F19' },
        '.dark .text-foreground': { color: '#F8FAFC' },
        '.dark .bg-card': { backgroundColor: '#1E293B' },
        '.dark .text-card-foreground': { color: '#F8FAFC' },
        '.dark .bg-primary': { backgroundColor: '#06B6D4' },
        '.dark .text-primary-foreground': { color: '#0B0F19' },
        '.dark .bg-secondary': { backgroundColor: '#2DD4BF' },
        '.dark .text-secondary-foreground': { color: '#0B0F19' },
        '.dark .bg-muted': { backgroundColor: '#334155' },
        '.dark .text-muted-foreground': { color: '#94A3B8' },
        '.dark .bg-accent': { backgroundColor: '#A78BFA' },
        '.dark .text-accent-foreground': { color: '#0B0F19' },
        '.dark .bg-destructive': { backgroundColor: '#F43F5E' },
        '.dark .text-destructive-foreground': { color: '#FFFFFF' },
        '.dark .bg-success': { backgroundColor: '#22D3EE' },
        '.dark .text-success-foreground': { color: '#0B0F19' },
        '.dark .bg-warning': { backgroundColor: '#FBBF24' },
        '.dark .text-warning-foreground': { color: '#0B0F19' },
        '.dark .bg-info': { backgroundColor: '#06B6D4' },
        '.dark .text-info-foreground': { color: '#0B0F19' },
        '.dark .border-border': { borderColor: '#334155' },
        '.dark .border-border-light': { borderColor: '#475569' },
        '.dark .bg-input': { backgroundColor: '#1E293B' },
        '.dark .text-input-foreground': { color: '#F8FAFC' },
        '.dark .ring-ring': { '--tw-ring-color': '#06B6D4' },
      };
      addUtilities(darkColors);
    },
  ],
}
