/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      /**
       * Brand navy palette aligned with frontend design tokens.
       * Primary: #0F172A (navy-900) — matches --color-primary.
       * CTA: #0369A1 (navy-600) — matches --color-cta.
       */
      colors: {
        navy: {
          50: '#f0f4ff',
          100: '#dbeafe',
          200: '#bdd5f7',
          300: '#93bbee',
          400: '#5d94e1',
          500: '#3472d4',
          600: '#0369A1',
          700: '#075985',
          800: '#1E293B',
          900: '#0F172A',
          950: '#020617',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'System'],
      },
    },
  },
  plugins: [],
};
