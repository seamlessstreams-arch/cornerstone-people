import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f7f4",
          100: "#d9ebe3",
          200: "#b3d7c7",
          300: "#84bca6",
          400: "#569a82",
          500: "#3a7e68",
          600: "#2c6453",
          700: "#255044",
          800: "#204138",
          900: "#1c3630",
        },
      },
    },
  },
  plugins: [],
};
export default config;
