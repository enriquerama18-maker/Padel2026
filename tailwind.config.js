// Configuración de colores y breakpoints de Tailwind (igual que tu HTML original)
if (typeof tailwind !== 'undefined') tailwind.config = {
  theme: {
    extend: {
      screens: {
        'xs': '380px'
      },
      colors: {
        neon: '#ccff00',
        padelGreen: '#10b981',
        padelDark: '#080d1a',
        courtCard: '#0f172a',
        courtSurface: '#020617'
      }
    }
  }
};
