const originTheme = {
  fontFamily: "Inter, sans-serif",
  primary: "#0274F1",
  "primary-content": "#141519",
  "primary-focus": "#141519",
  secondary: "#101113",
  "secondary-content": "#1E1F25",
  "secondary-focus": "#1E1F25",
  accent: "#101113",
  "accent-content": "#1E1F25",
  white: "#FAFBFB",
  warning: "#f0c102",
  neutral: "#828699",
  "neutral-content": "#333333",
  "neutral-focus": "#ffffff",
  "base-100": "#fafbfc",
  "base-200": "#f2f3f5",
  "base-300": "#cdd7e0",
  success: "#66FE90",
  error: "#FF4E4E",
  "--border-color": "#FF4E4E",
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
        all: "all",
        right: "right",
      },
      fontFamily: {
        primary: ["Inter", "sans-serif"],
        header: ["Sailec", "sans-serif"],
      },
      colors: {
        "gradient-from": "#8C66FC",
        "gradient-to": "#0274F1",
      },
    },
  },
  plugins: [require("daisyui"), require("@tailwindcss/typography")],
  daisyui: {
    styled: true,
    themes: [
      {
        "origin-theme": {
          ...require("daisyui/src/colors/themes")["[data-theme=light]"],
          ...originTheme,
        },
      },
    ],
    base: true,
    utils: true,
    logs: true,
    rtl: false,
  },
};
