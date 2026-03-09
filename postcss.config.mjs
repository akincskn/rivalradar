/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    // NEDEN postcss-import önce: CSS @import'larını resolve eder.
    // Tailwind'den önce olmazsa @import "tw-animate-css" çözülmez.
    "postcss-import": {},
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
