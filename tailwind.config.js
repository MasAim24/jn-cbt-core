/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        arabic: ['"Amiri"', '"Scheherazade New"', '"Traditional Arabic"', 'serif'],
      },
      colors: {
        surface: 'var(--bg-surface)',
        elevated: 'var(--bg-elevated)',
        'text-main': 'var(--text-primary)',
        'text-muted': 'var(--text-secondary)',
        'border-subtle': 'var(--border-subtle)',
        brand: {
          DEFAULT: 'var(--brand-primary)',
          hover: 'var(--brand-primary-hover)',
          deep: 'var(--indigo-900)',
        },
        accent: {
          peach: 'var(--peach-400)',
          amber: 'var(--amber-500)',
          teal: 'var(--teal-500)',
          coral: 'var(--coral-500)',
        }
      },
      boxShadow: {
        'soft': '0 10px 30px -10px rgba(33, 25, 85, 0.06)',
        'card': '0 4px 20px -2px rgba(33, 25, 85, 0.05)',
        'floating': '0 20px 45px -15px rgba(33, 25, 85, 0.14)',
      }
    },
  },
  plugins: [],
}
