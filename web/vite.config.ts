import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// BASE is set by the GitHub Pages workflow ("/portfolio/"); locally the site runs at "/".
export default defineConfig({
  base: process.env.BASE ?? '/',
  plugins: [react()],
})
