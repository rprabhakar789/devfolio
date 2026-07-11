import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const DEFAULT_CHAT_API_BASE_URL =
  'https://portfolio-backend-ca-214629.victoriousground-7c18e3f7.eastus.azurecontainerapps.io'

function createChatProxy(target) {
  return {
    target,
    changeOrigin: true,
    configure(proxy) {
      proxy.on('proxyReq', (proxyReq) => {
        proxyReq.removeHeader('origin')
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const chatApiBaseUrl = (env.VITE_CHAT_API_BASE_URL || DEFAULT_CHAT_API_BASE_URL).replace(/\/+$/, '')
  const chatProxy = createChatProxy(chatApiBaseUrl)

  return {
    plugins: [react()],
    base: '/devfolio/',
    server: {
      proxy: {
        '/api/chat': chatProxy,
      },
    },
    preview: {
      proxy: {
        '/api/chat': chatProxy,
      },
    },
  }
})
