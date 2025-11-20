import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Esto es para que escuche en todas las IPs, como hicimos con --host
    host: true, 
    // ¡Esta es la línea clave!
    // Permite cualquier host que termine en .trycloudflare.com
    allowedHosts: ['.trycloudflare.com'] 
  }
})