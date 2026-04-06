/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "rgb(173, 138, 70)",
        warning: "rgb(190, 21, 21)",
      },
    },
  },
  plugins: [],
};
