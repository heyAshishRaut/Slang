/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                ranade: ['Ranade', 'sans-serif'],
                gambarino: ['Gambarino', 'serif'],
                roboto: ['Roboto', 'sans-serif'],
                fira: ['"Fira Sans"', 'sans-serif'],
            },
        },
    },
    plugins: [],
  }