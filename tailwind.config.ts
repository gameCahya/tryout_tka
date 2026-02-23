/** @type {import('tailwindcss').Config} */

import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography'; // ← tambahkan ini

const config: Config = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: 'inherit',
            a: {
              color: '#3b82f6',
              '&:hover': {
                color: '#2563eb',
              },
            },
            strong: {
              color: 'inherit',
            },
            em: {
              color: 'inherit',
            },
            code: {
              color: 'inherit',
            },
            'ul > li': {
              paddingLeft: '0',
            },
            'ol > li': {
              paddingLeft: '0',
            },
          },
        },
        invert: {
          css: {
            color: 'inherit',
            a: {
              color: '#60a5fa',
              '&:hover': {
                color: '#93c5fd',
              },
            },
          },
        },
      },
    },
  },
  plugins: [
    typography,
  ],
};

export default config;