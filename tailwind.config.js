/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "#e6c6d8", 
        secondary: "#f4a6b5",
        accent: "#c2410c",
      },
    },
  },
  plugins: [],
}