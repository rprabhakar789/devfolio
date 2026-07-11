import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const DEFAULT_CHAT_API_BASE_URL =
  'https://portfolio-backend-ca-214629.victoriousground-7c18e3f7.eastus.azurecontainerapps.io'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const chatApiBaseUrl = (env.VITE_CHAT_API_BASE_URL || DEFAULT_CHAT_API_BASE_URL).replace(/\/+$/, '')

  return {
    plugins: [react()],
    base: '/devfolio/',
    server: {
      proxy: {
        '/api/chat': {
          target: chatApiBaseUrl,
          changeOrigin: true,
        },
      },
    },
  }
})
