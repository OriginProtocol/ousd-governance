const originThemeLegacy = {
  primary: "#007cff",
  "primary-focus": "#003cff",
  "primary-content": "#ffffff",
  secondary: "#6e3bea",
  "secondary-focus": "#6e0bea",
  "secondary-content": "#ffffff",
  accent: "#638298",
  "accent-focus": "#637298",
  "accent-content": "#ffffff",
  neutral: "#244159",
  "neutral-focus": "#061d2a",
  "neutral-content": "#ffffff",
  "base-100": "#ffffff",
  "base-200": "#f7fbfd",
  "base-300": "#dbe6eb",
  "base-content": "#061d2a",
  info: "#007cff",
  success: "#00db8d",
  warning: "#ffc000",
  error: "#ff0000",
};

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
        originTheme: {
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
