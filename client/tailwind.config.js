import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
  darkMode: ["class"],
  content: [
    path.join(__dirname, "./index.html"),
    path.join(__dirname, "./src/**/*.{js,jsx,ts,tsx}")
  ],
  theme: {
    extend: {
      // The same theme as your root config
      fontFamily: {
        'sans': ['Roboto', 'sans-serif'],
        'google-sans': ['"Google Sans"', 'sans-serif'],
        'mono': ['"Roboto Mono"', 'monospace'],
      },
      // ... other theme settings from your main config
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};
