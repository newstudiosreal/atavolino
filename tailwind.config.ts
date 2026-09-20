import type { Config } from "tailwindcss";

// Palette di aTavolino: giallo caldo come colore principale,
// blu / rosso / verde come colori dei semi delle carte,
// bianco e grigio scuro/nero per superfici e testo.
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          yellow: "#F5B93D",
          "yellow-dark": "#D99A1E",
          ink: "#1F2226",
          panel: "#2A2D33"
        },
        card: {
          red: "#E14B3B",
          blue: "#2D6FE0",
          green: "#2FA35E",
          yellow: "#F0B429",
          neutral: "#2A2D33"
        },
        felt: {
          DEFAULT: "#0F3D2E",
          light: "#155A43"
        }
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"]
      },
      boxShadow: {
        card: "0 2px 6px rgba(0,0,0,0.25), 0 1px 2px rgba(0,0,0,0.15)",
        panel: "0 8px 24px rgba(0,0,0,0.25)"
      },
      borderRadius: {
        card: "0.85rem"
      }
    }
  },
  plugins: []
};

export default config;
