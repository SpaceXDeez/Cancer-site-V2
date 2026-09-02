/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          teal:       '#1a7a9e',
          'teal-mid': '#0e4a63',
          'teal-dark':'#0c3547',
          'teal-hover':'#1d8fb7',
          'teal-light':'#e6f4f9',
          'teal-muted':'#94c9e0',
          cream:      '#fdf6ee',
          'cream-dark':'#f0e8d8',
          border:     '#e0d5c5',
          gold:       '#d4a757',
          'text-dark':'#1a3a4a',
        },
      },
    },
  },
  plugins: [],
};
