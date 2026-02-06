/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: "#D4AF37",
        "primary-dark": "#AA8C2C",
        "accent-red": "#8B0000",
        "sky-blue": "#00A3E0",
        "bg-dark": "#050608",
        "bg-card": "rgba(15, 18, 25, 0.7)",
      },
      fontFamily: {
        display: ["var(--font-cinzel)", "serif"],
        heritage: ["var(--font-marcellus)", "serif"],
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(135deg, #D4AF37 0%, #F1D592 50%, #D4AF37 100%)",
        "red-gold-gradient": "linear-gradient(135deg, #8B0000 0%, #D4AF37 100%)",
      },
    },
  },
  plugins: [],
};

