/**
 * JWT 토큰에서 사용자 그룹 정보를 추출하는 유틸리티 함수들
 */

export interface JWTUserInfo {
  username: string;
  groups: string[];
  isAdmin: boolean;
}

/**
 * JWT 토큰을 디코딩하여 페이로드 정보를 반환
 */
export const decodeJWTToken = (token: string): any => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch (error) {
    console.error('JWT 토큰 디코딩 오류:', error);
    return null;
  }
};

/**
 * JWT 토큰에서 사용자 그룹 정보를 추출
 */
export const getUserGroupsFromToken = (token?: string): string[] => {
  if (!token) {
    // localStorage에서 토큰 가져오기
    token = localStorage.getItem('accessToken') || 
            localStorage.getItem('idToken') || 
            sessionStorage.getItem('accessToken') ||
            sessionStorage.getItem('idToken') ||
            undefined;
  }
  
  if (!token) {
    return [];
  }
  
  const payload = decodeJWTToken(token);
  if (!payload) {
    return [];
  }
  
  // Cognito 그룹 정보 추출
  const groups = payload['cognito:groups'] || [];
  return Array.isArray(groups) ? groups : [groups];
};

/**
 * JWT 토큰에서 사용자 정보를 추출
 */
export const getUserInfoFromToken = (token?: string): JWTUserInfo | null => {
  if (!token) {
    token = localStorage.getItem('accessToken') || 
            localStorage.getItem('idToken') || 
            sessionStorage.getItem('accessToken') ||
            sessionStorage.getItem('idToken') ||
            undefined;
  }
  
  if (!token) {
    return null;
  }
  
  const payload = decodeJWTToken(token);
  if (!payload) {
    return null;
  }
  
  const groups = getUserGroupsFromToken(token);
  const username = payload.email || payload.username || payload.sub || '';
  
  return {
    username,
    groups,
    isAdmin: groups.includes('admin')
  };
};

/**
 * 현재 로그인한 사용자가 관리자인지 확인
 */
export const isCurrentUserAdmin = (): boolean => {
  const userInfo = getUserInfoFromToken();
  return userInfo?.isAdmin || false;
};

/**
 * 특정 사용자가 관리자인지 확인
 */
export const isUserAdmin = (username: string): boolean => {
  const userInfo = getUserInfoFromToken();
  return userInfo?.username === username && userInfo?.isAdmin;
};
