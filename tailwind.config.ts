import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar-background)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
      },
      fontFamily: {
        sans: ["'Fira Code'", "'Courier New'", "monospace"],
        serif: ["'Fira Code'", "'Courier New'", "monospace"],
        mono: ["'Fira Code'", "'Courier New'", "monospace"],
      },
      keyframes: {
        "scan-line": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        "glitch": {
          "0%, 100%": { 
            textShadow: "0.05em 0 0 rgba(255, 0, 128, 0.75), -0.05em -0.025em 0 rgba(0, 255, 255, 0.75), 0.025em 0.05em 0 rgba(0, 255, 0, 0.75)"
          },
          "15%": { 
            textShadow: "0.05em 0 0 rgba(255, 0, 128, 0.75), -0.05em -0.025em 0 rgba(0, 255, 255, 0.75), 0.025em 0.05em 0 rgba(0, 255, 0, 0.75)"
          },
          "16%": { 
            textShadow: "-0.05em -0.025em 0 rgba(255, 0, 128, 0.75), 0.025em 0.025em 0 rgba(0, 255, 255, 0.75), -0.05em -0.05em 0 rgba(0, 255, 0, 0.75)"
          },
          "49%": { 
            textShadow: "-0.05em -0.025em 0 rgba(255, 0, 128, 0.75), 0.025em 0.025em 0 rgba(0, 255, 255, 0.75), -0.05em -0.05em 0 rgba(0, 255, 0, 0.75)"
          },
          "50%": { 
            textShadow: "0.025em 0.05em 0 rgba(255, 0, 128, 0.75), 0.05em 0 0 rgba(0, 255, 255, 0.75), 0 -0.05em 0 rgba(0, 255, 0, 0.75)"
          },
          "99%": { 
            textShadow: "0.025em 0.05em 0 rgba(255, 0, 128, 0.75), 0.05em 0 0 rgba(0, 255, 255, 0.75), 0 -0.05em 0 rgba(0, 255, 0, 0.75)"
          },
        },
        "pulse-neon": {
          "from": {
            boxShadow: "0 0 5px var(--primary), 0 0 10px var(--primary), 0 0 15px var(--primary)",
          },
          "to": {
            boxShadow: "0 0 10px var(--primary), 0 0 20px var(--primary), 0 0 30px var(--primary)",
          },
        },
        "flicker": {
          "0%, 19.999%, 22%, 62.999%, 64%, 64.999%, 70%, 100%": {
            opacity: "0.99",
          },
          "20%, 21.999%, 63%, 63.999%, 65%, 69.999%": {
            opacity: "0.4",
          },
        },
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
      },
      animation: {
        "scan-line": "scan-line 2s linear infinite",
        "glitch": "glitch 0.3s linear infinite",
        "pulse-neon": "pulse-neon 2s ease-in-out infinite alternate",
        "flicker": "flicker 0.15s infinite linear",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
