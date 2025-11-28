/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_GATEWAY_URL: string
  readonly VITE_CLOUDFRONT_URL: string
  readonly VITE_COGNITO_USER_POOL_ID: string
  readonly VITE_COGNITO_CLIENT_ID: string
  readonly VITE_COGNITO_REGION: string
  readonly VITE_USE_API_GATEWAY: string
  readonly VITE_NODE_ENV: string
  readonly NODE_ENV: string
  
  // API 환경별 URL 설정
  readonly VITE_DEV_API_URL: string
  readonly VITE_TEST_API_URL: string
  readonly VITE_PROD_API_URL: string
  
  // Vite 기본 환경 변수들
  readonly DEV: boolean
  readonly MODE: string
  readonly PROD: boolean
  readonly SSR: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
