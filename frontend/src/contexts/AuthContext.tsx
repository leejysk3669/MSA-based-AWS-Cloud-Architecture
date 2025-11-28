import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { isAuthenticated, logout as cognitoLogout, decodeUserFromToken } from '../config/cognito';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuth, setIsAuth] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  const checkAuthStatus = async () => {
    try {
      const authenticated = await isAuthenticated();
      setIsAuth(authenticated);
      
      if (authenticated) {
        const userInfo = await decodeUserFromToken();
        // groups 정규화: 'cognito:groups'를 'groups'로 노출
        const normalized = userInfo ? {
          ...userInfo,
          groups: userInfo['cognito:groups'] || userInfo.groups || []
        } : null;
        setUser(normalized);
      }
    } catch (error) {
      console.error('인증 상태 확인 중 오류:', error);
      setIsAuth(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const login = async () => {
    setIsAuth(true);
    const userInfo = await decodeUserFromToken();
    const normalized = userInfo ? {
      ...userInfo,
      groups: userInfo['cognito:groups'] || userInfo.groups || []
    } : null;
    setUser(normalized);
  };

  const logout = async () => {
    try {
      // Cognito에서 실제 로그아웃 수행
      cognitoLogout();
      
      // 로컬 상태 초기화
      setIsAuth(false);
      setUser(null);
      
      // 페이지 새로고침으로 완전한 상태 초기화
      window.location.reload();
    } catch (error) {
      console.error('로그아웃 중 오류:', error);
      // 오류가 발생해도 로컬 상태는 초기화
      setIsAuth(false);
      setUser(null);
    }
  };



  const value: AuthContextType = {
    isAuthenticated: isAuth,
    isLoading,
    user,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
