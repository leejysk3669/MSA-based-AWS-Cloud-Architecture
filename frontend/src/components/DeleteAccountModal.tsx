import React, { useState } from 'react';
import { AlertTriangle, X, Eye, EyeOff } from 'lucide-react';
import { deleteUser } from '../config/cognito';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleDeleteAccount = async () => {
    if (confirmText !== '탈퇴') {
      setError('정확히 "탈퇴"를 입력해주세요.');
      return;
    }

    if (!password) {
      setError('비밀번호를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);

    console.log('🔍 계정 탈퇴 시작:', { confirmText, hasPassword: !!password });

    try {
      await deleteUser(password);
      console.log('✅ 계정 탈퇴 성공');
      setIsSuccess(true);
      
      // 3초 후 홈페이지로 이동
      setTimeout(() => {
        onSuccess();
      }, 3000);
    } catch (err: any) {
      console.error('❌ 탈퇴 중 오류:', err);
      setError(err.message || '탈퇴 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (isSuccess) {
      // 성공 상태일 때는 모달을 닫지 않음
      return;
    }
    
    setPassword('');
    setShowPassword(false);
    setError(null);
    setConfirmText('');
    setIsSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-red-500" size={24} />
            <h2 className="text-xl font-bold text-gray-900">계정 탈퇴</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* 경고 메시지 */}
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-red-500 mt-0.5" size={20} />
            <div>
              <h3 className="font-semibold text-red-800 mb-2">⚠️ 주의사항</h3>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• 계정 탈퇴 시 모든 데이터가 영구적으로 삭제되며, 작성한 게시글, 댓글, 스터디 그룹 정보가 모두 사라집니다.</li>
                <li>• 탈퇴 후에는 복구가 불가능하므로 신중히 결정해주세요.</li>
                <li>• 탈퇴를 원하시면 아래에 "탈퇴"를 정확히 입력해주세요.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 비밀번호 입력 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            비밀번호 확인
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="현재 비밀번호를 입력하세요"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {/* 확인 텍스트 입력 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            탈퇴 확인
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            placeholder="탈퇴"
          />
          <p className="text-xs text-gray-500 mt-1">
            위에 "탈퇴"를 정확히 입력해주세요.
          </p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* 성공 메시지 */}
        {isSuccess && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-green-800 mb-1">✅ 계정 탈퇴 완료</h3>
                <p className="text-sm text-green-700">
                  계정이 성공적으로 탈퇴되었습니다. 잠시 후 홈페이지로 이동합니다.
                </p>
                <div className="mt-2 w-full bg-green-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full transition-all duration-3000" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 버튼 */}
        <div className="flex gap-3">
          {!isSuccess ? (
            <>
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                취소
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isLoading || !password || confirmText !== '탈퇴'}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    처리 중...
                  </div>
                ) : (
                  '계정 탈퇴'
                )}
              </button>
            </>
          ) : (
            <button
              onClick={onSuccess}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              홈페이지로 이동
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountModal;
