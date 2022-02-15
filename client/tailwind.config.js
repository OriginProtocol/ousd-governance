const originTheme = {
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

module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui"), require("@tailwindcss/typography")],
  daisyui: {
    styled: true,
    themes: ["light"],
    base: true,
    utils: true,
    logs: true,
    rtl: false,
  },
};
