import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Settings } from 'lucide-react';
import { browserNotificationService } from '../services/browserNotificationService';

const NotificationPermission: React.FC = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    checkNotificationSupport();
  }, []);

  const checkNotificationSupport = () => {
    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
      
      // 권한이 허용되지 않았고, 아직 요청하지 않았다면 배너 표시
      if (Notification.permission === 'default') {
        const hasRequested = localStorage.getItem('notificationPermissionRequested');
        if (!hasRequested) {
          setShowBanner(true);
        }
      }
    }
  };

  const handleRequestPermission = async () => {
    try {
      const granted = await browserNotificationService.requestPermission();
      setPermission(granted ? 'granted' : 'denied');
      setShowBanner(false);
      
      // 권한 요청 기록
      localStorage.setItem('notificationPermissionRequested', 'true');
      
      if (granted) {
        // 테스트 알림 표시
        await browserNotificationService.testNotification();
      }
    } catch (error) {
      console.error('Failed to request permission:', error);
    }
  };

  const handleTestNotification = async () => {
    await browserNotificationService.testNotification();
  };

  const handleDismissBanner = () => {
    setShowBanner(false);
    localStorage.setItem('notificationPermissionRequested', 'true');
  };

  if (!isSupported) {
    return null; // 지원하지 않는 브라우저에서는 표시하지 않음
  }

  return (
    <>
      {/* 권한 요청 배너 */}
      {showBanner && (
        <div className="fixed top-4 right-4 bg-sky-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm">
          <div className="flex items-start gap-3">
            <Bell size={20} className="flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium mb-1">알림 권한</h4>
              <p className="text-sm text-blue-100 mb-3">
                새로운 알림을 받으려면 브라우저 알림 권한을 허용해주세요.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleRequestPermission}
                  className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium hover:bg-blue-50 transition-colors"
                >
                  허용하기
                </button>
                <button
                  onClick={handleDismissBanner}
                  className="text-blue-100 hover:text-white text-sm transition-colors"
                >
                  나중에
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 권한 상태 표시 */}
      {permission === 'granted' && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white p-3 rounded-lg shadow-lg z-40">
          <div className="flex items-center gap-2">
            <Bell size={16} />
            <span className="text-sm">알림 활성화됨</span>
            <button
              onClick={handleTestNotification}
              className="ml-2 text-xs bg-white text-green-600 px-2 py-1 rounded hover:bg-green-50 transition-colors"
            >
              테스트
            </button>
          </div>
        </div>
      )}

      {permission === 'denied' && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white p-3 rounded-lg shadow-lg z-40">
          <div className="flex items-center gap-2">
            <BellOff size={16} />
            <span className="text-sm">알림이 차단됨</span>
            <button
              onClick={() => {
                alert('브라우저 설정에서 알림 권한을 허용해주세요.');
              }}
              className="ml-2 text-xs bg-white text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors"
            >
              설정
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default NotificationPermission;
