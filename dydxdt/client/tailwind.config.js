/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        acid:    '#e8ff00',
        neon:    '#00ffb3',
        violet:  '#a78bfa',
        danger:  '#ff3366',
        surface: '#0a0a0a',
        border:  'rgba(255,255,255,0.06)',
      },
      fontFamily: {
        display: ["'Bebas Neue'", 'Impact', 'sans-serif'],
        mono:    ["'Space Mono'", 'monospace'],
      },
      animation: {
        blink: 'blink 1s step-end infinite',
        scan:  'scan 4s linear infinite',
        'fade-in': 'fadeIn 0.3s ease',
      },
      keyframes: {
        blink:  { '0%,100%': { opacity: 1 }, '50%': { opacity: 0 } },
        scan:   { '0%': { transform: 'translateY(-100%)' }, '100%': { transform: 'translateY(100vh)' } },
        fadeIn: { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      }
    }
  },
  plugins: [],
};
