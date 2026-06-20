import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // Ensure this is imported cleanly

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(), // ⚠️ CRITICAL: Must be placed FIRST so Tailwind compiles before React hooks mount
    react(),
  ],
})