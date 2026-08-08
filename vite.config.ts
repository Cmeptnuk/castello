import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    // слушать 0.0.0.0, чтобы сайт открывался с телефона по локальной сети
    host: true
  }
})
