import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fdf4f3',
          100: '#fbe8e6',
          200: '#f8d5d1',
          300: '#f2b5ae',
          400: '#e8887d',
          500: '#da6152',
          600: '#c64536',
          700: '#a6372a',
          800: '#8a3127',
          900: '#732e26',
          950: '#3e140f',
        },
        accent: {
          50: '#fdf8ef',
          100: '#fbedd4',
          200: '#f6d8a8',
          300: '#f0bc71',
          400: '#e99a3e',
          500: '#e3801f',
          600: '#d46617',
          700: '#b04c15',
          800: '#8d3d18',
          900: '#733316',
          950: '#3e1909',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
