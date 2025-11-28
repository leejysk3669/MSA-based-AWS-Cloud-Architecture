/**
 * 사용자 표시 이름을 생성하는 유틸리티 함수들
 */

/**
 * 이메일에서 @ 앞부분만 추출하여 표시 이름 생성
 * @param email 사용자 이메일
 * @returns 표시 이름
 */
export const getDisplayNameFromEmail = (email: string): string => {
  if (!email || !email.includes('@')) {
    return '사용자';
  }
  return email.split('@')[0];
};

/**
 * Cognito 사용자 정보에서 표시 이름 생성
 * @param user Cognito 사용자 객체
 * @returns 표시 이름
 */
export const getUserDisplayName = (user: any): string => {
  if (!user) return '사용자';
  
  // 1. 이메일이 있으면 @ 앞부분만 사용 (우선순위 1)
  if (user.email) {
    return getDisplayNameFromEmail(user.email);
  }
  
  // 2. 사용자명이 있고 이메일과 다르면 사용
  if (user.username && user.username !== user.email) {
    return user.username;
  }
  
  // 3. Cognito sub (UUID)인 경우 '사용자'로 표시
  if (user.sub && user.sub.includes('-')) {
    return '사용자';
  }
  
  return '사용자';
};
