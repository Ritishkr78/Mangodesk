const { fontFamily } = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Sora", ...fontFamily.sans],
      },
      boxShadow: {
        "2xl-soft": "0 25px 50px -12px rgba(0, 0, 0, 0.1)",
        "lg-soft": "0 10px 15px -3px rgba(0, 0, 0, 0.05)",
      },
    },
  },
  plugins: [],
};
