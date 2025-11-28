import { CognitoUserPool, CognitoUser, AuthenticationDetails, CognitoUserAttribute } from 'amazon-cognito-identity-js';

export interface User {
  sub: string;
  email: string;
  username: string;
  groups?: string[];
}

export class AuthService {
  private userPool: CognitoUserPool;

  constructor() {
    // 정적 환경에서 동적 설정 읽기
    let userPoolId = (import.meta as any).env?.VITE_COGNITO_USER_POOL_ID;
    let clientId = (import.meta as any).env?.VITE_COGNITO_CLIENT_ID;
    
    if (typeof window !== 'undefined' && (window as any).APP_CONFIG) {
      userPoolId = (window as any).APP_CONFIG.COGNITO_USER_POOL_ID || userPoolId;
      clientId = (window as any).APP_CONFIG.COGNITO_CLIENT_ID || clientId;
    }
    
    this.userPool = new CognitoUserPool({
      UserPoolId: userPoolId!,
      ClientId: clientId!
    });
  }

  // 로그인
  async login(username: string, password: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const user = new CognitoUser({ Username: username, Pool: this.userPool });
      const authDetails = new AuthenticationDetails({ Username: username, Password: password });

      user.authenticateUser(authDetails, {
        onSuccess: (result) => {
          const token = result.getIdToken().getJwtToken();
          localStorage.setItem('authToken', token);
          localStorage.setItem('userInfo', JSON.stringify({
            sub: result.getIdToken().payload.sub,
            email: result.getIdToken().payload.email,
            username: username
          }));
          resolve(token);
        },
        onFailure: (err) => {
          console.error('Login failed:', err);
          reject(err);
        }
      });
    });
  }

  // 로그아웃
  async logout(): Promise<void> {
    return new Promise((resolve, reject) => {
      const user = this.userPool.getCurrentUser();
      if (user) {
        user.signOut(() => {
          localStorage.removeItem('authToken');
          localStorage.removeItem('userInfo');
          resolve();
        });
      } else {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userInfo');
        resolve();
      }
    });
  }

  // 회원가입
  async register(email: string, password: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const attributeList = [
        new CognitoUserAttribute({
          Name: 'email',
          Value: email
        })
      ];

      this.userPool.signUp(email, password, attributeList, [], (err, result) => {
        if (err) {
          console.error('Registration failed:', err);
          reject(err);
        } else {
          console.log('Registration successful:', result);
          resolve();
        }
      });
    });
  }

  // 비밀번호 찾기
  async forgotPassword(email: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const user = new CognitoUser({ Username: email, Pool: this.userPool });
      user.forgotPassword({
        onSuccess: () => {
          console.log('Password reset email sent');
          resolve();
        },
        onFailure: (err) => {
          console.error('Password reset failed:', err);
          reject(err);
        }
      });
    });
  }

  // 비밀번호 재설정
  async confirmForgotPassword(email: string, code: string, newPassword: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const user = new CognitoUser({ Username: email, Pool: this.userPool });
      user.confirmPassword(code, newPassword, {
        onSuccess: () => {
          console.log('Password reset successful');
          resolve();
        },
        onFailure: (err) => {
          console.error('Password reset confirmation failed:', err);
          reject(err);
        }
      });
    });
  }

  // 이메일 인증 확인
  async confirmRegistration(username: string, code: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const user = new CognitoUser({ Username: username, Pool: this.userPool });
      user.confirmRegistration(code, true, (err, result) => {
        if (err) {
          console.error('Email confirmation failed:', err);
          reject(err);
        } else {
          console.log('Email confirmation successful:', result);
          resolve();
        }
      });
    });
  }

  // 인증번호 재전송
  async resendConfirmationCode(username: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const user = new CognitoUser({ Username: username, Pool: this.userPool });
      user.resendConfirmationCode((err, result) => {
        if (err) {
          console.error('Resend confirmation code failed:', err);
          reject(err);
        } else {
          console.log('Confirmation code resent:', result);
          resolve();
        }
      });
    });
  }

  // 토큰 가져오기
  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  // 사용자 정보 가져오기
  getUser(): User | null {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
  }

  // 인증 상태 확인
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // 현재 사용자 가져오기
  getCurrentUser(): CognitoUser | null {
    return this.userPool.getCurrentUser();
  }

  // 토큰 새로고침
  async refreshToken(): Promise<string | null> {
    return new Promise((resolve, reject) => {
      const user = this.getCurrentUser();
      if (user) {
        user.getSession((err, session) => {
          if (err) {
            reject(err);
          } else if (session.isValid()) {
            const token = session.getIdToken().getJwtToken();
            localStorage.setItem('authToken', token);
            resolve(token);
          } else {
            resolve(null);
          }
        });
      } else {
        resolve(null);
      }
    });
  }
}

// 싱글톤 인스턴스
export const authService = new AuthService();
