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
  "primary-focus": "#39996e",
  neutral: "#183140",
  "base-100": "#ffffff",
  "--btn-text-case": "capitalize",
  "--rounded-btn": "1rem",
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
