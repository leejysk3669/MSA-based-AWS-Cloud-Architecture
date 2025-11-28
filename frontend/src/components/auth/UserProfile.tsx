import React, { useState, useEffect } from 'react';
import { getUserInfo, logout } from '../../config/cognito';

interface UserProfileProps {
  onLogout: () => void;
}

interface UserInfo {
  email: string;
  sub: string;
  [key: string]: string;
}

const UserProfile: React.FC<UserProfileProps> = ({ onLogout }) => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const info = await getUserInfo();
        setUserInfo(info);
      } catch (err: any) {
        setError(err.message || '사용자 정보를 가져올 수 없습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  const handleLogout = () => {
    logout();
    onLogout();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">사용자 프로필</h2>
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          로그아웃
        </button>
      </div>

      {userInfo && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">이메일</label>
            <p className="mt-1 text-sm text-gray-900">{userInfo.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">사용자 ID</label>
            <p className="mt-1 text-sm text-gray-900">{userInfo.sub}</p>
          </div>
          {userInfo.name && (
            <div>
              <label className="block text-sm font-medium text-gray-700">이름</label>
              <p className="mt-1 text-sm text-gray-900">{userInfo.name}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserProfile;
