/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        /* Accent corail / terracotta — couleur de marque teachMe */
        coral: {
          50:  '#fdf2ef',
          100: '#fadfd8',
          200: '#f4bfb1',
          300: '#ef9f8b',
          400: '#eb8670',
          DEFAULT: '#e8735a',
          600: '#d4604a',
          700: '#c2553e',
          800: '#9a4231',
          900: '#6b2e22',
        },
        /* Navy profond — base de la marque */
        navy: {
          50:  '#edf0f5',
          100: '#d2dae6',
          200: '#a5b4cb',
          300: '#6f84a6',
          400: '#3f5681',
          DEFAULT: '#1b2a4a',
          600: '#16233e',
          700: '#121c32',
          800: '#0d1524',
          900: '#080d17',
        },
        /* Crème — fond clair de la marque */
        cream: {
          DEFAULT: '#f7f5f0',
          100: '#fbfaf7',
          200: '#f7f5f0',
          300: '#efebe3',
          400: '#e3ddd1',
        },
        slate_brand: '#4a5468',
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
      backgroundImage: {
        'grid-pattern': "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
