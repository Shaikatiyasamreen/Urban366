/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          violet: "#5B21B6",
          violetDark: "#4C1D95",
          violetLight: "#EDE9FE",
          emerald: "#34D399",
          emeraldDark: "#059669",
          cyan: "#00A3FF",
          gold: "#D4AF37",
          dark: "#262626",
          grayText: "#757575",
          border: "#E5E7EB",
          cardBg: "#F8F8F8"
        }
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Oxygen-Sans",
          "Ubuntu",
          "Cantarell",
          "Helvetica",
          "Arial",
          "sans-serif"
        ]
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 8px 20px rgba(0, 0, 0, 0.1)',
        'dock': '0 4px 24px rgba(0, 0, 0, 0.12)'
      }
    },
  },
  plugins: [],
}
