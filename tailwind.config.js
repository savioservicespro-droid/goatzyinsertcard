/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif'
        ]
      },
      colors: {
        goatzy: {
          dark: '#1B4332',
          DEFAULT: '#2D6A4F',
          light: '#52B788',
          accent: '#95D5B2',
          pale: '#D8F3DC',
          bg: '#F0FFF4'
        }
      },
      letterSpacing: {
        wide: '0.02em',
        wider: '0.05em'
      }
    }
  },
  plugins: []
};
