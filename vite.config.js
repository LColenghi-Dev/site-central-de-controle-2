import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const n8nApiKey = env.VITE_N8N_API_KEY
  const trafegoApiKey = env.TRAFEGO_API_KEY

  return {
    plugins: [react()],
    server: {
      port: 5199,
      proxy: {
        /* Proxy do n8n - evita CORS em desenvolvimento e injeta a API key. */
        '/n8n-api': {
          target: 'https://n8n.marazulagenciadigital.com.br',
          changeOrigin: true,
          secure: false,
          rewrite: path => path.replace(/^\/n8n-api/, ''),
          configure: proxy => {
            proxy.on('proxyReq', proxyReq => {
              if (n8nApiKey) proxyReq.setHeader('X-N8N-API-KEY', n8nApiKey)
            })
          },
        },
        /* Proxy da API de tráfego - evita CORS em desenvolvimento e injeta a API key. */
        '/trafego-api': {
          target: 'https://trafego.marazulagenciadigital.com.br',
          changeOrigin: true,
          secure: false,
          rewrite: path => path.replace(/^\/trafego-api/, ''),
          configure: proxy => {
            proxy.on('proxyReq', proxyReq => {
              if (trafegoApiKey) proxyReq.setHeader('Authorization', `Bearer ${trafegoApiKey}`)
            })
          },
        },
      },
    },
  }
})
