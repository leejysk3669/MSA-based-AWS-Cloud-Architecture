import React, { useState } from 'react';
import { forgotPassword, confirmForgotPassword } from '../../config/cognito';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  onSwitchToLogin
}) => {
  const [username, setUsername] = useState('');
  const [step, setStep] = useState<'email' | 'code' | 'success'>('email');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 폼 초기화
  const resetForm = () => {
    setUsername('');
    setVerificationCode('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setStep('email');
  };

  // 모달 닫기
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // 비밀번호 재설정 이메일 발송
  const handleSendResetEmail = async () => {
    if (!username) {
      setError('사용자명 또는 이메일을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await forgotPassword(username);
      setStep('code');
    } catch (error: any) {
      setError(error.message || '비밀번호 재설정 이메일 발송에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 비밀번호 재설정 확인
  const handleConfirmReset = async () => {
    if (!verificationCode || !newPassword || !confirmPassword) {
      setError('모든 필드를 입력해주세요.');
      return;
    }

    if (newPassword.length < 8) {
      setError('새 비밀번호는 8자 이상이어야 합니다.');
      return;
    }

    // 특수문자 포함 여부 확인
    const specialCharRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
    if (!specialCharRegex.test(newPassword)) {
      setError('새 비밀번호는 1개 이상의 특수문자를 포함해야 합니다.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await confirmForgotPassword(username, verificationCode, newPassword);
      setStep('success');
    } catch (error: any) {
      setError(error.message || '비밀번호 재설정에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">비밀번호 찾기</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {step === 'email' && (
          <div className="space-y-4">
            <p className="text-gray-600 text-sm">
              등록된 사용자명 또는 이메일을 입력하세요. 비밀번호 재설정 링크를 이메일로 발송합니다.
            </p>
            
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                사용자명 또는 이메일
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="사용자명 또는 이메일을 입력하세요"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleSendResetEmail}
                disabled={isLoading}
                className="flex-1 bg-sky-600 text-white py-2 px-4 rounded-md hover:bg-sky-600/80 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '발송 중...' : '재설정 이메일 발송'}
              </button>
              
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                로그인으로
              </button>
            </div>
          </div>
        )}

        {step === 'code' && (
          <div className="space-y-4">
            <p className="text-gray-600 text-sm">
              이메일로 발송된 인증 코드를 입력하고 새 비밀번호를 설정하세요.
            </p>
            
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                인증 코드
              </label>
              <input
                type="text"
                id="code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="6자리 인증 코드"
                required
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                새 비밀번호
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="8자 이상, 특수문자 1개 이상"
                required
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                새 비밀번호 확인
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="새 비밀번호를 다시 입력하세요"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleConfirmReset}
                disabled={isLoading}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '처리 중...' : '비밀번호 변경'}
              </button>
              
              <button
                type="button"
                onClick={() => setStep('email')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                뒤로
              </button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center space-y-4">
            <div className="text-green-600 text-6xl">✅</div>
            <h3 className="text-xl font-bold text-green-600">
              비밀번호 재설정 완료!
            </h3>
            <p className="text-gray-600 text-sm">
              새 비밀번호로 로그인할 수 있습니다.
            </p>
            
            <button
              onClick={onSwitchToLogin}
              className="w-full bg-sky-600 text-white py-2 px-4 rounded-md hover:bg-sky-600/80 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              로그인하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
