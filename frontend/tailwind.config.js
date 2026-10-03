/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  HÀO KHÍ ĐẠI VIỆT — Tailwind CSS Configuration
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Integrated with the Global Art Direction design tokens.
 *  All color, font, and animation values reference the design system.
 *
 *  Usage: standard Tailwind classes like `bg-imperial-crimson`, `text-hk-gold`,
 *         `font-display`, `animate-pulse-glow`, etc.
 * ═══════════════════════════════════════════════════════════════════════════
 *  @type {import('tailwindcss').Config}
 */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        imperial: {
          crimson: '#8B1E0F',
          darkred: '#520B05',
          gold: '#D4AF37',
          lightgold: '#F3E5AB',
          bronze: '#CD7F32',
          darkbronze: '#784212',
          obsidian: '#0B0C10',
          lacquer: '#13141C',
          slate: '#1E2230',
          border: '#3D362A',
          jade: '#10B981',
          jadeDark: '#047857',
        },
        /* ── Design token aliases via CSS variables ──────────── */
        hk: {
          gold:      'var(--hk-color-gold)',
          lightgold: 'var(--hk-color-light-gold)',
          crimson:   'var(--hk-color-crimson)',
          jade:      'var(--hk-color-jade)',
          bronze:    'var(--hk-color-bronze)',
          obsidian:  'var(--hk-color-obsidian)',
          lacquer:   'var(--hk-color-lacquer)',
          border:    'var(--hk-ui-border-gold)',
          panel:     'var(--hk-ui-panel)',
          'text':    'var(--hk-ui-text-body)',
        },
        /* ── Side colors ────────────────────────────────────── */
        side: {
          player:      'var(--hk-side-player)',
          'player-accent': 'var(--hk-side-player-accent)',
          enemy:       'var(--hk-side-enemy)',
          'enemy-accent': 'var(--hk-side-enemy-accent)',
        },
        /* ── Rarity tiers ───────────────────────────────────── */
        rarity: {
          common:    'var(--hk-rarity-common)',
          rare:      'var(--hk-rarity-rare)',
          epic:      'var(--hk-rarity-epic)',
          legendary: 'var(--hk-rarity-legendary)',
        },
      },
      fontFamily: {
        display: ['Noto Serif', 'Be Vietnam Pro', 'serif'],
        serif: ['Noto Serif', 'Be Vietnam Pro', 'serif'],
        sans: ['Be Vietnam Pro', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'drum-pattern': "radial-gradient(circle, rgba(212,175,55,0.08) 1px, transparent 1px)",
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        /* ── Art Direction gradients ─────────────────────────── */
        'hk-panel':    'linear-gradient(to bottom, var(--hk-ui-panel), rgba(0,0,0,0.9))',
        'hk-card':     'linear-gradient(135deg, #0d2636, #071724)',
        'hk-sunset':   'linear-gradient(180deg, #FBD097 0%, #FF9B49 40%, #0C1B26 100%)',
        'hk-lacquer':  'radial-gradient(circle at 50% 20%, rgba(139,30,15,0.25), transparent 55%), radial-gradient(circle at 80% 80%, rgba(212,175,55,0.12), transparent 40%)',
      },
      boxShadow: {
        'hk-gold':    'var(--hk-glow-gold)',
        'hk-crimson': 'var(--hk-glow-crimson)',
        'hk-jade':    'var(--hk-glow-jade)',
      },
      animation: {
        'spin-slow': 'spin 30s linear infinite',
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 4s ease-in-out infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.8', filter: 'drop-shadow(0 0 15px rgba(212,175,55,0.6))' },
          '50%': { opacity: '1', filter: 'drop-shadow(0 0 25px rgba(212,175,55,0.9))' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      }
    },
  },
  plugins: [],
}
