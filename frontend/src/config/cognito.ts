import { CognitoUserPool, CognitoUser, AuthenticationDetails, CognitoUserSession } from 'amazon-cognito-identity-js';

// Cognito 설정
export const cognitoConfig = {
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || 'ap-northeast-2_VrMMVwNd8',
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '2b797ioh6lhc571p8k463n3fmt',
  Region: import.meta.env.VITE_COGNITO_REGION || 'ap-northeast-2'
};

// Cognito User Pool 인스턴스 생성
export const userPool = new CognitoUserPool(cognitoConfig);

// 로그인 함수
export const login = (username: string, password: string): Promise<CognitoUserSession> => {
  return new Promise((resolve, reject) => {
    const authenticationDetails = new AuthenticationDetails({
      Username: username,
      Password: password,
    });

    const cognitoUser = new CognitoUser({
      Username: username,
      Pool: userPool,
    });

    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (result) => {
        resolve(result);
      },
      onFailure: (err) => {
        reject(err);
      },
    });
  });
};

// 로그아웃 함수
export const logout = (): void => {
  const currentUser = userPool.getCurrentUser();
  if (currentUser) {
    currentUser.signOut();
  }
};

// 토큰 가져오기 함수
export const getTokens = (): Promise<{
  accessToken: string;
  idToken: string;
  refreshToken: string;
}> => {
  return new Promise((resolve, reject) => {
    const currentUser = userPool.getCurrentUser();
    if (!currentUser) {
      reject(new Error('사용자가 로그인되지 않았습니다.'));
      return;
    }

    currentUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err) {
        reject(err);
        return;
      }

      if (!session || !session.isValid()) {
        reject(new Error('세션이 유효하지 않습니다.'));
        return;
      }

      resolve({
        accessToken: session.getAccessToken().getJwtToken(),
        idToken: session.getIdToken().getJwtToken(),
        refreshToken: session.getRefreshToken().getToken(),
      });
    });
  });
};

// 현재 사용자 확인
export const getCurrentUser = (): CognitoUser | null => {
  return userPool.getCurrentUser();
};

// JWT 토큰에서 사용자 정보 디코딩
export const decodeUserFromToken = (): any => {
  return new Promise((resolve, reject) => {
    const currentUser = userPool.getCurrentUser();
    if (!currentUser) {
      resolve(null);
      return;
    }

    currentUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session || !session.isValid()) {
        resolve(null);
        return;
      }

      try {
        const idToken = session.getIdToken().getJwtToken();
        const payload = JSON.parse(atob(idToken.split('.')[1]));
        resolve(payload);
      } catch (error) {
        console.error('토큰 디코딩 오류:', error);
        resolve(null);
      }
    });
  });
};

// 로그인 상태 확인
export const isAuthenticated = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const currentUser = userPool.getCurrentUser();
    if (!currentUser) {
      resolve(false);
      return;
    }

    currentUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session || !session.isValid()) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
};

// 사용자 정보 가져오기
export const getUserInfo = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    const currentUser = userPool.getCurrentUser();
    if (!currentUser) {
      reject(new Error('사용자가 로그인되지 않았습니다.'));
      return;
    }

    currentUser.getUserAttributes((err, attributes) => {
      if (err) {
        reject(err);
        return;
      }

      const userInfo: any = {};
      attributes?.forEach((attribute) => {
        userInfo[attribute.getName()] = attribute.getValue();
      });

      resolve(userInfo);
    });
  });
};

// 토큰 갱신
export const refreshToken = (): Promise<CognitoUserSession> => {
  return new Promise((resolve, reject) => {
    const currentUser = userPool.getCurrentUser();
    if (!currentUser) {
      reject(new Error('사용자가 로그인되지 않았습니다.'));
      return;
    }

    currentUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session) {
        reject(err || new Error('세션을 가져올 수 없습니다.'));
        return;
      }

      const refreshToken = session.getRefreshToken();
      currentUser.refreshSession(refreshToken, (refreshErr, newSession) => {
        if (refreshErr) {
          reject(refreshErr);
        } else {
          resolve(newSession);
        }
      });
    });
  });
};

// API 요청용 Authorization 헤더 생성
export const getAuthHeader = async (): Promise<{ Authorization: string } | null> => {
  try {
    const tokens = await getTokens();
    return {
      Authorization: `Bearer ${tokens.idToken}`
    };
  } catch (error) {
    console.error('인증 토큰을 가져올 수 없습니다:', error);
    return null;
  }
};

// 사용자 탈퇴 함수 (비밀번호 확인 포함)
export const deleteUser = (password: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const currentUser = userPool.getCurrentUser();
    if (!currentUser) {
      reject(new Error('사용자가 로그인되지 않았습니다.'));
      return;
    }

    // 비밀번호 확인을 위한 AuthenticationDetails 생성
    const authenticationDetails = new AuthenticationDetails({
      Username: currentUser.getUsername(),
      Password: password,
    });

    // 먼저 비밀번호를 확인한 후 계정 삭제
    currentUser.authenticateUser(authenticationDetails, {
      onSuccess: () => {
        // 인증 성공 후 계정 삭제
        currentUser.deleteUser((err) => {
          if (err) {
            console.error('계정 삭제 오류:', err);
            reject(new Error('계정 삭제 중 오류가 발생했습니다.'));
          } else {
            console.log('계정 삭제 성공');
            resolve();
          }
        });
      },
      onFailure: (err) => {
        console.error('비밀번호 확인 실패:', err);
        reject(new Error('비밀번호가 올바르지 않습니다.'));
      },
    });
  });
};

// 사용자 속성 업데이트 함수
export const updateUserAttributes = (attributes: { [key: string]: string }): Promise<void> => {
  return new Promise((resolve, reject) => {
    const currentUser = userPool.getCurrentUser();
    if (!currentUser) {
      reject(new Error('사용자가 로그인되지 않았습니다.'));
      return;
    }

    // Cognito 사용자 속성 형식으로 변환
    const cognitoAttributes: any[] = [];
    Object.entries(attributes).forEach(([key, value]) => {
      cognitoAttributes.push({
        Name: key,
        Value: value
      });
    });

    currentUser.updateAttributes(cognitoAttributes, (err) => {
      if (err) {
        console.error('사용자 속성 업데이트 오류:', err);
        reject(new Error('사용자 정보 업데이트 중 오류가 발생했습니다.'));
      } else {
        console.log('사용자 속성 업데이트 성공');
        resolve();
      }
    });
  });
};

// 비밀번호 변경 함수
export const changePassword = (oldPassword: string, newPassword: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    console.log('🔍 비밀번호 변경 시작:', { hasOldPassword: !!oldPassword, hasNewPassword: !!newPassword });
    
    const currentUser = userPool.getCurrentUser();
    if (!currentUser) {
      console.error('❌ 현재 사용자를 찾을 수 없음');
      reject(new Error('사용자가 로그인되지 않았습니다.'));
      return;
    }

    console.log('✅ 현재 사용자 확인됨:', currentUser.getUsername());

    // 먼저 현재 세션이 유효한지 확인
    currentUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session || !session.isValid()) {
        console.error('❌ 세션이 유효하지 않음:', err);
        reject(new Error('인증 세션이 만료되었습니다. 다시 로그인해주세요.'));
        return;
      }

      console.log('✅ 세션 유효성 확인됨');

      // 비밀번호 변경 시도
      currentUser.changePassword(oldPassword, newPassword, (changeErr) => {
        if (changeErr) {
          console.error('❌ 비밀번호 변경 오류:', changeErr);
          console.error('에러 상세 정보:', {
            name: changeErr.name,
            message: changeErr.message
          });
          
          // 구체적인 오류 메시지 처리
          if (changeErr.name === 'NotAuthorizedException') {
            reject(new Error('현재 비밀번호가 올바르지 않습니다.'));
          } else if (changeErr.name === 'InvalidPasswordException') {
            reject(new Error('새 비밀번호가 요구사항을 충족하지 않습니다. (8자 이상, 1개 이상의 특수문자 포함)'));
          } else {
            reject(new Error(`비밀번호 변경 중 오류가 발생했습니다: ${changeErr.message}`));
          }
        } else {
          console.log('✅ 비밀번호 변경 성공');
          resolve();
        }
      });
    });
  });
};

// 관리자 권한 확인 함수
export const isAdmin = async (): Promise<boolean> => {
  try {
    const userInfo = await decodeUserFromToken();
    if (!userInfo) {
      return false;
    }
    
    // Cognito 그룹 정보 확인
    const groups = userInfo['cognito:groups'] || [];
    return groups.includes('admin') || groups.includes('Admin');
  } catch (error) {
    console.error('관리자 권한 확인 오류:', error);
    return false;
  }
};

// 사용자 정보와 관리자 권한을 함께 가져오는 함수
export const getUserInfoWithAdminStatus = async (): Promise<{
  userInfo: any;
  isAdmin: boolean;
}> => {
  try {
    const userInfo = await decodeUserFromToken();
    if (!userInfo) {
      return { userInfo: null, isAdmin: false };
    }
    
    const groups = userInfo['cognito:groups'] || [];
    const adminStatus = groups.includes('admin') || groups.includes('Admin');
    
    return { userInfo, isAdmin: adminStatus };
  } catch (error) {
    console.error('사용자 정보 및 관리자 권한 확인 오류:', error);
    return { userInfo: null, isAdmin: false };
  }
};

// 비밀번호 재설정 함수 (사용자가 로그인하지 않은 상태)
export const forgotPassword = (username: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    console.log('🔍 비밀번호 재설정 시작:', { username });
    
    const cognitoUser = new CognitoUser({
      Username: username,
      Pool: userPool,
    });

    cognitoUser.forgotPassword({
      onSuccess: () => {
        console.log('✅ 비밀번호 재설정 이메일 발송 성공');
        resolve();
      },
      onFailure: (err) => {
        console.error('❌ 비밀번호 재설정 이메일 발송 실패:', err);
        
        // 구체적인 오류 메시지 처리
        if (err.name === 'UserNotFoundException') {
          reject(new Error('해당 사용자명으로 등록된 계정을 찾을 수 없습니다.'));
        } else if (err.name === 'InvalidParameterException') {
          reject(new Error('사용자명 형식이 올바르지 않습니다.'));
        } else {
          reject(new Error(`비밀번호 재설정 이메일 발송에 실패했습니다: ${err.message}`));
        }
      },
    });
  });
};

// 비밀번호 재설정 확인 함수
export const confirmForgotPassword = (
  username: string,
  code: string,
  newPassword: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    console.log('🔍 비밀번호 재설정 확인 시작:', { username, hasCode: !!code, hasNewPassword: !!newPassword });
    
    const cognitoUser = new CognitoUser({
      Username: username,
      Pool: userPool,
    });

    cognitoUser.confirmPassword(code, newPassword, {
      onSuccess: () => {
        console.log('✅ 비밀번호 재설정 성공');
        resolve();
      },
      onFailure: (err) => {
        console.error('❌ 비밀번호 재설정 실패:', err);
        
        // 구체적인 오류 메시지 처리
        if (err.name === 'CodeMismatchException') {
          reject(new Error('인증 코드가 올바르지 않습니다.'));
        } else if (err.name === 'ExpiredCodeException') {
          reject(new Error('인증 코드가 만료되었습니다. 다시 요청해주세요.'));
        } else if (err.name === 'InvalidPasswordException') {
          reject(new Error('새 비밀번호가 요구사항을 충족하지 않습니다. (8자 이상, 1개 이상의 특수문자 포함)'));
        } else {
          reject(new Error(`비밀번호 재설정에 실패했습니다: ${err.message}`));
        }
      },
    });
  });
};
