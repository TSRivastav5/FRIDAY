/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Luminous Finance — 3D-glassmorphism on a bright canvas. Growth
        // green primary, trust-blue secondary, gold tertiary for premium
        // moments. Same semantic role names as before so every existing
        // bg-primary / text-on-surface usage repaints from one place.
        "surface": "#faf8ff",
        "surface-dim": "#d2d9f4",
        "surface-bright": "#faf8ff",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f2f3ff",
        "surface-container": "#eaedff",
        "surface-container-high": "#e2e7ff",
        "surface-container-highest": "#dae2fd",
        "on-surface": "#131b2e",
        "on-surface-variant": "#3c4a43",
        "inverse-surface": "#283044",
        "inverse-on-surface": "#eef0ff",
        "outline": "#6b7b72",
        "outline-variant": "#bacac1",
        "surface-tint": "#006c4f",
        "primary": "#006c4f",
        "on-primary": "#ffffff",
        "primary-container": "#00d09c",
        "on-primary-container": "#00533c",
        "inverse-primary": "#2fe0aa",
        "secondary": "#2b2ae8",
        "on-secondary": "#ffffff",
        "secondary-container": "#494cff",
        "on-secondary-container": "#e7e6ff",
        "tertiary": "#7c5800",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#e6ae41",
        "on-tertiary-container": "#604300",
        "error": "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
        "primary-fixed": "#59fdc5",
        "primary-fixed-dim": "#2fe0aa",
        "on-primary-fixed": "#002116",
        "on-primary-fixed-variant": "#00513b",
        "secondary-fixed": "#e1e0ff",
        "secondary-fixed-dim": "#c0c1ff",
        "on-secondary-fixed": "#04006d",
        "on-secondary-fixed-variant": "#1e17e0",
        "tertiary-fixed": "#ffdea8",
        "tertiary-fixed-dim": "#f7bd4f",
        "on-tertiary-fixed": "#271900",
        "on-tertiary-fixed-variant": "#5e4200",
        "background": "#faf8ff",
        "on-background": "#131b2e",
        "surface-variant": "#dae2fd"
      },
      borderRadius: {
        "sm": "0.25rem",
        "DEFAULT": "0.5rem",
        "md": "0.75rem",
        "lg": "1rem",
        "xl": "1.5rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
        "full": "9999px"
      },
      fontFamily: {
        "body": ["Inter", "sans-serif"],
        "headline": ["Space Grotesk", "sans-serif"],
        "label": ["Inter", "sans-serif"],
        "mono": ["JetBrains Mono", "monospace"]
      },
      boxShadow: {
        'premium': '0 4px 20px -4px rgba(19, 27, 46, 0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
        'glass': '0 8px 32px rgba(0, 108, 79, 0.1)',
        'ambient-primary': '0 8px 24px -4px rgba(0, 108, 79, 0.25)',
        'ambient-secondary': '0 8px 24px -4px rgba(43, 42, 232, 0.25)',
        'ambient-tertiary': '0 8px 24px -4px rgba(230, 174, 65, 0.25)',
      },
      backdropBlur: {
        'glass': '20px',
      }
    },
  },
  darkMode: 'class',
  plugins: [],
}
