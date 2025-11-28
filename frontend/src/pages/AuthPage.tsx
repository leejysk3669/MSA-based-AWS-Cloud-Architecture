import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { login as cognitoLogin } from '../config/cognito';
import { userPool } from '../config/cognito';
import { CognitoUser, CognitoUserAttribute } from 'amazon-cognito-identity-js';
import ForgotPasswordModal from '../components/auth/ForgotPasswordModal';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);


  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // Cognito 로그인
      await cognitoLogin(email, password);
      // AuthContext 상태 업데이트
      login();
      setSuccess('로그인 성공!');
      // 로그인 성공 시 메인 페이지로 리다이렉트
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || '로그인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    // 비밀번호 확인
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      setIsLoading(false);
      return;
    }

    // 비밀번호 유효성 검사
    if (password.length < 8) {
      setError('비밀번호는 최소 8자 이상이어야 합니다.');
      setIsLoading(false);
      return;
    }

    // 특수문자 포함 여부 확인
    const specialCharRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
    if (!specialCharRegex.test(password)) {
      setError('비밀번호는 특수문자를 1개 이상 포함해야 합니다.');
      setIsLoading(false);
      return;
    }

    try {
      console.log('회원가입 시작:', email);
      
      // Cognito 회원가입
      const attributeList = [
        new CognitoUserAttribute({
          Name: 'email',
          Value: email
        })
      ];

      userPool.signUp(
        email,
        password,
        attributeList,
        [],
        (err, result) => {
          if (err) {
            setError(err.message || '회원가입에 실패했습니다.');
            setIsLoading(false);
          } else {
            console.log('회원가입 성공!');
            setSuccess('회원가입이 완료되었습니다. 이메일을 확인하여 인증 링크를 클릭해주세요.');
            setIsLoading(false);
            
            // 3초 후 자동으로 로그인 화면으로 전환
            setTimeout(() => {
              setIsLogin(true);
              setSuccess('');
              setEmail('');
              setPassword('');
              setConfirmPassword('');
            }, 3000);
          }
        }
      );
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || '회원가입에 실패했습니다.');
      setIsLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {isLogin ? '로그인' : '회원가입'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isLogin ? (
            <>
              계정이 없으신가요?{' '}
              <button
                onClick={() => setIsLogin(false)}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                회원가입
              </button>
            </>
          ) : (
            <>
              이미 계정이 있으신가요?{' '}
              <button
                onClick={() => setIsLogin(true)}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                로그인
              </button>
            </>
          )}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded">
                {success}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                이메일
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                비밀번호
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isLogin ? "비밀번호를 입력하세요" : "8자 이상, 특수문자 포함"}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              {!isLogin && (
                <p className="text-xs text-gray-500 mt-1">최소 8자 이상, 특수문자 1개 이상 포함</p>
              )}
            </div>

            {!isLogin && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  비밀번호 확인
                </label>
                <div className="mt-1">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (isLogin ? '로그인 중...' : '회원가입 중...') : (isLogin ? '로그인' : '회원가입')}
              </button>
            </div>

            {/* 비밀번호 찾기 링크 - 로그인 모드에서만 표시 */}
            {isLogin && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  비밀번호 찾기
                </button>
              </div>
            )}
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">또는</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => window.location.href = '/'}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                메인 페이지로 돌아가기
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 비밀번호 찾기 모달 */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        onSwitchToLogin={() => setShowForgotPassword(false)}
      />
    </div>
  );
};

export default AuthPage;
