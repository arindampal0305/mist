/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#F4F1EC',       // warm off-white background
        surface: '#FFFFFF',      // card white
        navy: '#1E1E2F',         // deep dark navy for headings
        'navy-light': '#3A3A52', // secondary text
        coral: '#E8564A',        // primary coral accent
        'coral-deep': '#D14A3F',
        teal: '#2DD4BF',         // teal accent
        'teal-deep': '#14B8A6',
        mint: '#D1FAE5',         // light teal wash
        blush: '#FEE2E2',       // light coral wash
        amber: '#F59E0B',
        'amber-wash': '#FEF3C7',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'Consolas', 'monospace'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)',
        'card-hover': '0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.05)',
        'sidebar': '2px 0 20px rgba(0,0,0,0.04)',
      },
    },
  },
  plugins: [],
}
