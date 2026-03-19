/** @type {import('tailwindcss').Config} */
module.exports = {
  // どのファイルにTailwindを適用するかを指定
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: { extend: {} },
  plugins: [],
}
