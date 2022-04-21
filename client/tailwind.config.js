const originTheme = {
  fontFamily: "Lato, sans-serif",
  primary: "#4bbc8a",
  "primary-content": "#ffffff",
  "primary-focus": "#39996e",
  secondary: "#183140",
  "secondary-content": "#ffffff",
  "secondary-focus": "#0d2330",
  accent: "#4bbc8a",
  "accent-content": "#ffffff",
  neutral: "#d8d8d8",
  "neutral-content": "#333333",
  "neutral-focus": "#c2c2c2",
  "base-100": "#fafbfc",
  "base-200": "#f2f3f5",
  "base-300": "#cdd7e0",
  "--border-color": "red",
  "--btn-text-case": "capitalize",
  "--rounded-btn": "0.6125rem",
  "--rounded-badge": "0.25rem",
};

module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      transitionProperty: {
        'all': 'all',
        'right': 'right',
      },
    },
  },
  plugins: [require("daisyui"), require("@tailwindcss/typography")],
  daisyui: {
    styled: true,
    themes: [
      {
        'origin-theme': {
          ...require("daisyui/src/colors/themes")["[data-theme=light]"],
          ...originTheme,
        }
      }
    ],
    base: true,
    utils: true,
    logs: true,
    rtl: false,
  },
};
