import React, { useState } from 'react';
import { X, Eye, EyeOff, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { changePassword } from '../config/cognito';

interface EditAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EditAccountModal: React.FC<EditAccountModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  
  // 비밀번호 변경
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // 상태 관리
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 폼 초기화
  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccess(null);
  };

  // 모달 닫기
  const handleClose = () => {
    resetForm();
    onClose();
  };



  // 비밀번호 변경
  const handlePasswordChange = async () => {
    if (!currentPassword) {
      setError('현재 비밀번호를 입력해주세요.');
      return;
    }

    if (!newPassword) {
      setError('새 비밀번호를 입력해주세요.');
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
    setSuccess(null);

    try {
      console.log('🔍 비밀번호 변경 시도 시작');
      
      // Cognito 비밀번호 변경
      await changePassword(currentPassword, newPassword);
      
      console.log('✅ 비밀번호 변경 성공');
      setSuccess('비밀번호가 성공적으로 변경되었습니다.');
      
      // 폼 초기화
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // 3초 후 성공 메시지 제거
      setTimeout(() => {
        setSuccess(null);
        // 성공 후 모달 닫기
        setTimeout(() => {
          handleClose();
        }, 500);
      }, 3000);
      
    } catch (err: any) {
      console.error('❌ 비밀번호 변경 오류:', err);
      
      // 구체적인 오류 메시지 표시
      if (err.message.includes('인증 세션이 만료')) {
        setError('로그인 세션이 만료되었습니다. 다시 로그인해주세요.');
      } else if (err.message.includes('현재 비밀번호가 올바르지 않습니다')) {
        setError('현재 비밀번호가 올바르지 않습니다.');
      } else if (err.message.includes('새 비밀번호가 요구사항을 충족하지 않습니다')) {
        setError('새 비밀번호는 8자 이상이며, 1개 이상의 특수문자를 포함해야 합니다.');
      } else {
        setError(err.message || '비밀번호 변경 중 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Lock className="text-blue-500" size={24} />
            <h2 className="text-xl font-bold text-gray-900">비밀번호 변경</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="p-6">
          {/* 비밀번호 변경 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">비밀번호 변경</h3>
              
              {/* 현재 비밀번호 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  현재 비밀번호
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="현재 비밀번호를 입력하세요"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* 새 비밀번호 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  새 비밀번호
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="새 비밀번호를 입력하세요 (8자 이상, 특수문자 포함)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* 새 비밀번호 확인 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  새 비밀번호 확인
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="새 비밀번호를 다시 입력하세요"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* 비밀번호 변경 버튼 */}
              <button
                onClick={handlePasswordChange}
                disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
                className="w-full px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-600/80 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    처리 중...
                  </>
                ) : (
                  <>
                    <Lock size={16} />
                    비밀번호 변경
                  </>
                )}
              </button>
            </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* 성공 메시지 */}
          {success && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditAccountModal;
