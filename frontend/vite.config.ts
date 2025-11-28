import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 환경변수에서 백엔드 서비스 URL 가져오기
const getBackendUrl = (service: string, defaultPort: string) => {
  const envVar = `VITE_${service.toUpperCase()}_URL`;
  return process.env[envVar] || `http://localhost:${defaultPort}`;
};

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'window',
  },
  server: {
    // API Gateway 사용 시에도 프록시 활성화 (CORS 문제 해결)
    proxy: {
      '/api/search': {
        target: getBackendUrl('CERTIFICATE_SEARCH', '3007'),
        changeOrigin: true,
        secure: false,
      },
      '/api/autocomplete': {
        target: getBackendUrl('CERTIFICATE_SEARCH', '3007'),
        changeOrigin: true,
        secure: false,
      },
      '/api/certificates': {
        target: getBackendUrl('CERTIFICATE_SEARCH', '3007'),
        changeOrigin: true,
        secure: false,
      },
      '/api/study-groups': {
        target: getBackendUrl('STUDY_GROUP', '3003'),
        changeOrigin: true,
        secure: false,
      },
      '/api/portfolio': {
        target: getBackendUrl('AI_PORTFOLIO', '3008'),
        changeOrigin: true,
        secure: false,
      },
      '/api/jobs-news': {
        target: getBackendUrl('JOBS_NEWS', '3006'),
        changeOrigin: true,
        secure: false,
      },
      '/api/notifications': {
        target: getBackendUrl('NOTIFICATION', '3004'),
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: process.env.VITE_USE_API_GATEWAY === 'true' 
          ? 'https://7d1opsumn9.execute-api.ap-northeast-2.amazonaws.com/dev'
          : getBackendUrl('COMMUNITY_BOARD', '3002'),
        changeOrigin: true,
        secure: process.env.VITE_USE_API_GATEWAY === 'true',
        headers: process.env.VITE_USE_API_GATEWAY === 'true' ? {
          'Origin': 'https://d12so42486otqg.cloudfront.net'
        } : {}
      }
    },
    allowedHosts: true, // 모든 호스트 허용 (ngrok 포함)
    host: true, // 모든 네트워크 인터페이스에서 접근 허용
  }
})