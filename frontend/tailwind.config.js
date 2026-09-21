/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        spotify: {
          green: '#1DB954',
          black: '#121212',
          dark: '#181818',
          lighter: '#282828',
          hover: '#2a2a2a',
          text: '#b3b3b3',
        },
      },
    },
  },
  plugins: [],
}
