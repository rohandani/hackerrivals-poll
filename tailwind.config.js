/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: '#6366f1',
        'accent-light': '#818cf8',
        highlight: '#22d3ee',
        'dark-bg': '#0a0a0f',
        'dark-surface': '#1a1a2e',
        'card-bg': 'rgba(255, 255, 255, 0.05)',
        'card-border': 'rgba(255, 255, 255, 0.1)',
      },
      fontFamily: {
        heading: ['Orbitron', 'sans-serif'],
        body: ['Rajdhani', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 15px rgba(99, 102, 241, 0.3)',
        'glow-lg': '0 0 30px rgba(99, 102, 241, 0.4)',
      },
    },
  },
  plugins: [],
};
