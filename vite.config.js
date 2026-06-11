import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5199,
    proxy: {
      /* Proxy do n8n — evita CORS em desenvolvimento.
         Em produção, configure N8N_CORS_ALLOW_ORIGINS no seu servidor n8n
         ou replique esta regra no Nginx/Caddy da hospedagem. */
      '/n8n-api': {
        target: 'https://n8n.marazulagenciadigital.com.br',
        changeOrigin: true,
        secure: false,          // aceita certificado do servidor n8n
        rewrite: path => path.replace(/^\/n8n-api/, ''),
      },
    },
  },
})
