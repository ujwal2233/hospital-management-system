module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
        sidebar: {
          DEFAULT: '#062823',
          hover: 'rgba(20, 184, 166, 0.16)',
          active: 'rgba(13, 148, 136, 0.28)',
          text: '#f0fdfa',
          muted: '#88a49e',
          border: '#114038',
        }
      },
      boxShadow: {
        'card': '0 2px 12px -2px rgba(13, 148, 136, 0.08), 0 1px 4px -1px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 8px 24px -4px rgba(13, 148, 136, 0.14), 0 4px 10px -2px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
