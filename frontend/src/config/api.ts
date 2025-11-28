// 환경별 API 설정
export const API_CONFIG = {
  development: {
    baseURL: import.meta.env.VITE_DEV_API_URL || 'http://localhost:5173',
    endpoints: {
      board: '/api/board',
      studyGroups: '/api/study-groups',
      notifications: '/api/notifications',
      jobsNews: '/api/jobs-news',
      search: '/api/search',
      autocomplete: '/api/autocomplete',
      portfolio: '/api/portfolio'
    }
  },
  test: {
    baseURL: import.meta.env.VITE_TEST_API_URL || 'http://localhost:30080',
    endpoints: {
      board: '/api/board',
      studyGroups: '/api/study-groups',
      notifications: '/api/notifications',
      jobsNews: '/api/jobs-news',
      search: '/api/search',
      autocomplete: '/api/autocomplete',
      portfolio: '/api/portfolio'
    }
  },
  production: {
    baseURL: import.meta.env.VITE_PROD_API_URL || 'https://api.seesun.cloud',
    endpoints: {
      board: '/api/board',
      studyGroups: '/api/study-groups',
      notifications: '/api/notifications',
      jobsNews: '/api/jobs-news',
      search: '/api/search',
      autocomplete: '/api/autocomplete',
      portfolio: '/api/portfolio'
    }
  },
  // API Gateway 환경
  apiGateway: {
    baseURL: import.meta.env.VITE_API_GATEWAY_URL || 'https://7d1opsumn9.execute-api.ap-northeast-2.amazonaws.com/dev',
    endpoints: {
      board: '/api/board',
      studyGroups: '/api/study-groups',
      notifications: '/api/notifications',
      jobsNews: '/api/jobs-news',
      search: '/api/search',
      autocomplete: '/api/autocomplete',
      portfolio: '/api/portfolio'
    }
  }
};

// 현재 환경 감지
const getCurrentEnvironment = (): 'development' | 'test' | 'production' | 'apiGateway' => {
  // API Gateway 환경 강제 설정 (배포 환경)
  if (import.meta.env.VITE_USE_API_GATEWAY === 'true') {
    return 'apiGateway';
  }
  
  if (import.meta.env.DEV) {
    return 'development';
  }
  if (import.meta.env.MODE === 'test') {
    return 'test';
  }
  
  // Route53 도메인과 CloudFront 도메인 구분
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'd12so42486otqg.cloudfront.net') {
      return 'apiGateway'; // CloudFront에서는 API Gateway 직접 URL 사용
    }
    if (hostname === 'seesun.cloud' || hostname === 'www.seesun.cloud') {
      return 'production'; // Route53에서는 커스텀 도메인 사용
    }
  }
  
  return 'production';
};

// 정적 환경에서 동적 설정 읽기
const getStaticConfig = () => {
  if (typeof window !== 'undefined' && (window as any).APP_CONFIG) {
    return {
      baseURL: (window as any).APP_CONFIG.API_BASE_URL || '',
      endpoints: {
        board: '/api/board',
        studyGroups: '/api/study-groups',
        notifications: '/api/notifications',
        jobsNews: '/api/jobs-news',
        search: '/api/search',
        autocomplete: '/api/autocomplete',
        portfolio: '/api/portfolio'
      }
    };
  }
  return null;
};

// 현재 환경의 API 설정 반환
export const getApiConfig = () => {
  // 정적 환경 설정 우선 확인
  const staticConfig = getStaticConfig();
  if (staticConfig) {
    return staticConfig;
  }
  
  const env = getCurrentEnvironment();
  return API_CONFIG[env];
};

// 환경별 API URL 생성
export const getApiUrl = (endpoint: string) => {
  const config = getApiConfig();
  return `${config.baseURL}${config.endpoints[endpoint as keyof typeof config.endpoints]}`;
};
