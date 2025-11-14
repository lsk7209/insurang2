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
        primary: {
          DEFAULT: '#0052FF',
          light: '#3375FF',
          dark: '#003ECC',
        },
        accent: {
          DEFAULT: '#5AA7E1',
          light: '#7BC4F0',
          dark: '#3D8BC4',
        },
        cta: {
          DEFAULT: '#FF9F4A',
          light: '#FFB366',
          dark: '#E67E22',
        },
        warning: {
          DEFAULT: '#ED6C02',
          light: '#FF9F4A',
          dark: '#FF8C2A',
        },
        background: {
          light: '#FCFCFC',
          dark: '#1D1D1F',
        },
        text: {
          light: '#1D1D1F',
          dark: '#FCFCFC',
          primary: '#1D1D1F',
        },
        subtle: {
          light: '#E5E5E5',
          dark: '#333333',
        },
      },
      fontFamily: {
        sans: [
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'Roboto',
          'sans-serif',
        ],
        display: ['Inter', 'Pretendard', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
      },
    },
  },
  plugins: [],
}

