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
  
  // 1. 사용자명이 있으면 사용
  if (user.username && user.username !== user.email) {
    return user.username;
  }
  
  // 2. 이메일이 있으면 @ 앞부분만 사용
  if (user.email) {
    return getDisplayNameFromEmail(user.email);
  }
  
  // 3. Cognito sub (UUID)인 경우 '사용자'로 표시
  if (user.sub && user.sub.includes('-')) {
    return '사용자';
  }
  
  return '사용자';
};

/**
 * 사용자 이메일의 전체 주소 반환 (짧은 경우에만)
 * @param email 사용자 이메일
 * @returns 전체 이메일 또는 @ 앞부분
 */
export const getFullEmailOrUsername = (email: string): string => {
  if (!email) return '사용자';
  
  // 이메일이 20자 이하면 전체 표시, 아니면 @ 앞부분만
  if (email.length <= 20) {
    return email;
  }
  
  return getDisplayNameFromEmail(email);
};

/**
 * 게시글 작성자 표시명 생성 (단순히 원래 이름 반환)
 * @param author 원본 작성자명
 * @param authorId 작성자 ID (사용하지 않음)
 * @param currentUser 현재 로그인한 사용자 정보 (사용하지 않음)
 * @returns 표시명
 */
export const getPostAuthorDisplayName = (
  author: string, 
  authorId?: string, 
  currentUser?: any
): string => {
  if (!author) return '사용자';
  
  // 단순히 원본 작성자명 반환 (관리자 로직 제거됨)
  return author;
};

/**
 * 게시글 작성자 표시명 생성 (간단한 버전 - 기존 호환성 유지)
 * @param author 원본 작성자명
 * @param authorId 작성자 ID
 * @returns 표시명
 */
export const getPostAuthorDisplayNameSimple = (author: string, authorId?: string): string => {
  if (!author) return '사용자';
  
  // 단순히 원본 작성자명 반환 (관리자 로직 제거됨)
  return author;
};
