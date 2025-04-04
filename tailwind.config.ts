import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Roboto', 'sans-serif'],
        'google-sans': ['"Google Sans"', 'sans-serif'],
        'mono': ['"Roboto Mono"', 'monospace'],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          50: "#e8f0fe",
          100: "#d2e3fc",
          200: "#a6c8fa",
          300: "#79acf7",
          400: "#4d91f4",
          500: "#1a73e8",
          600: "#1765cc",
          700: "#1258b0",
          800: "#0e4b94",
          900: "#0a3e78"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          50: "#e6e6e6",
          100: "#cccccc",
          200: "#b3b3b3",
          300: "#999999",
          400: "#808080",
          500: "#666666",
          600: "#4d4d4d",
          700: "#333333",
          800: "#1a1a1a",
          900: "#000000"
        },
        error: {
          DEFAULT: "#d93025",
          50: "#fce8e6",
          100: "#f9d1cd",
          200: "#f6bab4",
          300: "#f2a29b",
          400: "#ef8b82",
          500: "#ea4335",
          600: "#d93025",
          700: "#c5221f",
          800: "#b31412",
          900: "#a50e0e"
        },
        success: {
          DEFAULT: "#1e8e3e",
          50: "#e6f4ea",
          100: "#ceead6",
          200: "#a8d5ac",
          300: "#81c995",
          400: "#5bb974",
          500: "#34a853",
          600: "#1e8e3e",
          700: "#188038",
          800: "#137333",
          900: "#0f672d"
        },
        warning: {
          DEFAULT: "#f9ab00",
          50: "#fef7e0",
          100: "#feefc3",
          200: "#fee7a0",
          300: "#fddf7d",
          400: "#fcd757",
          500: "#fbbc04",
          600: "#f9ab00",
          700: "#ea9a00",
          800: "#db8a00",
          900: "#cb7900"
        },
        neutral: {
          DEFAULT: "#5f6368",
          50: "#f8f9fa",
          100: "#f1f3f4",
          200: "#e8eaed",
          300: "#dadce0",
          400: "#bdc1c6",
          500: "#9aa0a6",
          600: "#80868b",
          700: "#5f6368",
          800: "#3c4043",
          900: "#202124"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // Google AI Studio theme colors
        lightbg: "#ffffff",
        darkbg: "#202124",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "bounce": {
          "0%, 100%": {
            transform: "translateY(0)",
          },
          "50%": {
            transform: "translateY(-25%)",
          },
        },
        "pulse": {
          "0%, 100%": {
            opacity: "1",
          },
          "50%": {
            opacity: "0.5",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "bounce": "bounce 1s ease-in-out infinite",
        "pulse": "pulse 1.5s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
