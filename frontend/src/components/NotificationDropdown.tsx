import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, Trash2, ExternalLink, Eye } from 'lucide-react';
import { Notification as NotificationType, notificationAPI } from '../services/api';


interface NotificationDropdownProps {
  currentUserId: string;
  onNavigate?: (url: string) => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  currentUserId,
  onNavigate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [allNotifications, setAllNotifications] = useState<NotificationType[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [previousUnreadCount, setPreviousUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 컴포넌트 마운트 시 즉시 로드
    loadNotifications();
    
    // 페이지 포커스 시 즉시 업데이트
    const handleFocus = () => {
      loadNotifications();
    };
    
    // 페이지 가시성 변경 시 업데이트
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadNotifications();
      }
    };
    
    // 주기적 알림 조회 (30초마다)
    const intervalId = setInterval(() => {
      loadNotifications();
    }, 30000); // 30초
    
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, [currentUserId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await notificationAPI.getNotificationsByUser(currentUserId);
      if (response.success && Array.isArray(response.data)) {
        // 읽지 않은 알림만 필터링
        const unreadNotifications = response.data.filter(notification => !notification.isRead);
        setNotifications(unreadNotifications);
        // 전체 알림 저장
        setAllNotifications(response.data);
      }
      
      const unreadResponse = await notificationAPI.getUnreadCount(currentUserId);
      const newUnreadCount = unreadResponse.count;
      
      // 새로운 알림이 있는지 확인
      if (newUnreadCount > previousUnreadCount && previousUnreadCount > 0) {
        // 브라우저 알림 표시
        showNewNotificationAlert(newUnreadCount - previousUnreadCount);
      }
      
      setPreviousUnreadCount(newUnreadCount);
      setUnreadCount(newUnreadCount);
    } catch (error: any) {
      console.error('알림 로드 실패:', error);
    }
  };

  const loadAllNotifications = async () => {
    try {
      const response = await notificationAPI.getNotificationsByUser(currentUserId);
      if (response.success && Array.isArray(response.data)) {
        setAllNotifications(response.data);
      }
    } catch (error: any) {
      console.error('전체 알림 로드 실패:', error);
    }
  };

  const showNewNotificationAlert = (count: number) => {
    if (Notification.permission === 'granted') {
      new Notification('새로운 알림', {
        body: `${count}개의 새로운 알림이 도착했습니다.`,
        icon: '/favicon.ico',
        tag: 'new-notification'
      });
    }
  };

  const handleNotificationClick = async (notification: NotificationType) => {
    try {
      console.log('🔍 알림 클릭 처리 시작:', {
        id: notification.id,
        title: notification.title,
        actionUrl: notification.actionUrl,
        hasOnNavigate: !!onNavigate
      });
      
      // 알림 읽음 처리
      console.log('📤 markAsRead API 호출 시작');
      const result = await notificationAPI.markAsRead(notification.id);
      console.log('✅ 알림 읽음 처리 완료:', result);
      
      // 관련 페이지로 이동
      if (notification.actionUrl && onNavigate) {
        console.log('🚀 페이지 이동 시도:', notification.actionUrl);
        onNavigate(notification.actionUrl);
      } else {
        console.log('⚠️ actionUrl 또는 onNavigate가 없음:', {
          actionUrl: notification.actionUrl,
          hasOnNavigate: !!onNavigate
        });
      }
      
      // 드롭다운 닫기
      setIsOpen(false);
      
      // 알림 목록 새로고침
      loadNotifications();
    } catch (error: any) {
      console.error('❌ 알림 클릭 처리 실패:', error);
      console.error('에러 상세 정보:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        config: error?.config
      });
    }
  };

  const handleMarkAsRead = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      console.log('🔍 알림 읽음 처리 시작:', notificationId);
      await notificationAPI.markAsRead(notificationId);
      console.log('✅ 알림 읽음 처리 완료');
      loadNotifications();
    } catch (error: any) {
      console.error('❌ 알림 읽음 처리 실패:', error);
    }
  };



  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead(currentUserId);
      loadNotifications();
    } catch (error: any) {
      console.error('모든 알림 읽음 처리 실패:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // 삭제 확인
    if (!window.confirm('이 알림을 삭제하시겠습니까?')) {
      return;
    }
    
    try {
      await notificationAPI.deleteNotification(notificationId);
      loadNotifications();
      loadAllNotifications();
    } catch (error: any) {
      console.error('알림 삭제 실패:', error);
      alert('알림 삭제에 실패했습니다.');
    }
  };

  const handleOpenAllNotifications = async () => {
    setIsModalOpen(true);
    await loadAllNotifications();
  };

  const handleDeleteAllNotifications = async () => {
    if (!window.confirm('모든 알림을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    try {
      // 모든 알림을 순차적으로 삭제
      const deletePromises = allNotifications.map(notification => 
        notificationAPI.deleteNotification(notification.id)
      );
      
      await Promise.all(deletePromises);
      
      // 알림 목록 새로고침
      loadNotifications();
      loadAllNotifications();
      
      alert('모든 알림이 삭제되었습니다.');
    } catch (error: any) {
      console.error('모든 알림 삭제 실패:', error);
      alert('일부 알림 삭제에 실패했습니다.');
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}시간 전`;
    return date.toLocaleDateString('ko-KR');
  };

  const getNotificationIcon = (type: NotificationType['type']) => {
    switch (type) {
      case 'study_group':
        return '👥';
      case 'board':
        return '📝';
      case 'comment':
        return '💬';
      case 'like':
        return '❤️';
      case 'like_milestone':
        return '🏆';
      default:
        return '🔔';
    }
  };



  return (
    <div className="relative" ref={dropdownRef}>
      {/* 알림 아이콘 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-800 transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* 알림 드롭다운 */}
      {isOpen && (
        <div className="absolute mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden" 
             style={{ 
               width: 'min(320px, calc(100vw - 2rem))',
               left: 'auto',
               maxWidth: 'calc(100vw - 1rem)',
               transform: 'translateX(0)',
               position: 'fixed',
               top: '60px',
               right: '1rem'
             }}>
          {/* 헤더 */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">알림</h3>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  모두 읽음
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* 알림 목록 */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                알림이 없습니다
              </div>
            ) : (
              <>

                
                                 {/* 실제 알림 API 데이터 */}
                 {notifications.map((notification) => (
                   <div
                     key={notification.id}
                     onClick={() => handleNotificationClick(notification)}
                     className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                       !notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                     }`}
                   >
                                         <div className="flex items-start gap-3">
                       <span className="text-lg">
                         {getNotificationIcon(notification.type)}
                       </span>
                       <div className="flex-1 min-w-0">
                                                                                                    <div className="flex items-start justify-between">
                           <h4 className="font-medium text-sm text-gray-900 font-semibold">
                             {notification.title}
                           </h4>
                           <button
                             onClick={(e) => handleMarkAsRead(notification.id, e)}
                             className="text-xs text-gray-500 hover:text-green-600 transition-colors px-2 py-1 rounded hover:bg-green-50 border border-gray-200 hover:border-green-300"
                             title="읽음 처리"
                           >
                             읽음
                           </button>
                         </div>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                                                     <div className="flex items-center mt-2">
                             <span className="text-xs text-gray-400">
                               {formatTime(notification.createdAt)}
                             </span>
                           </div>
                                                 </div>
                       </div>
                  </div>
                ))}
              </>
            )}
          </div>

                     {/* 푸터 */}
           <div className="p-3 border-t border-gray-200 bg-gray-50">
             <div className="flex justify-between items-center">
                               <button
                  onClick={handleOpenAllNotifications}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  모든 알림 보기
                </button>
               <button
                 onClick={() => {
                   // 현재 알림 상태 디버깅
                   console.log('=== 알림 상태 디버깅 ===');
                   console.log('현재 사용자:', currentUserId);
                   console.log('알림 개수:', notifications.length);
                   console.log('읽지 않은 알림 개수:', unreadCount);
                   loadNotifications();
                 }}
                 className="text-xs text-gray-500 hover:text-gray-700"
               >
                 새로고침
               </button>
             </div>
           </div>
                 </div>
       )}

       {/* 모든 알림 모달 */}
       {isModalOpen && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
                           {/* 모달 헤더 */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">모든 알림</h2>
                <div className="flex items-center gap-3">
                  {allNotifications.length > 0 && (
                    <button
                      onClick={handleDeleteAllNotifications}
                      className="text-sm text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1 rounded transition-colors"
                      title="모든 알림 삭제"
                    >
                      모두 삭제
                    </button>
                  )}
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

             {/* 모달 내용 */}
             <div className="max-h-[60vh] overflow-y-auto">
               {allNotifications.length === 0 ? (
                 <div className="p-8 text-center text-gray-500">
                   알림이 없습니다
                 </div>
               ) : (
                 <div className="divide-y divide-gray-100">
                   {allNotifications.map((notification) => (
                     <div
                       key={notification.id}
                       className={`p-4 hover:bg-gray-50 transition-colors ${
                         !notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                       }`}
                     >
                       <div className="flex items-start gap-3">
                         <span className="text-lg">
                           {getNotificationIcon(notification.type)}
                         </span>
                         <div className="flex-1 min-w-0">
                           <div className="flex items-start justify-between">
                             <h4 className={`font-medium text-sm ${
                               !notification.isRead ? 'text-gray-900 font-semibold' : 'text-gray-600'
                             }`}>
                               {notification.title}
                               {!notification.isRead && (
                                 <span className="ml-2 text-xs bg-sky-500 text-white px-2 py-1 rounded-full">
                                   새
                                 </span>
                               )}
                             </h4>
                             <div className="flex gap-2">
                               {!notification.isRead && (
                                 <button
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     notificationAPI.markAsRead(notification.id).then(() => {
                                       loadNotifications();
                                       loadAllNotifications();
                                     });
                                   }}
                                   className="text-xs text-gray-500 hover:text-green-600 transition-colors px-2 py-1 rounded hover:bg-green-50 border border-gray-200 hover:border-green-300"
                                 >
                                   읽음
                                 </button>
                               )}
                               <button
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   if (window.confirm('이 알림을 삭제하시겠습니까?')) {
                                     notificationAPI.deleteNotification(notification.id).then(() => {
                                       loadNotifications();
                                       loadAllNotifications();
                                     });
                                   }
                                 }}
                                 className="text-xs text-gray-500 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50 border border-gray-200 hover:border-red-300"
                               >
                                 삭제
                               </button>
                             </div>
                           </div>
                           <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                             {notification.message}
                           </p>
                           <div className="flex items-center justify-between mt-2">
                             <span className="text-xs text-gray-400">
                               {formatTime(notification.createdAt)}
                             </span>
                             {notification.actionUrl && (
                               <button
                                 onClick={() => {
                                   if (onNavigate && notification.actionUrl) {
                                     onNavigate(notification.actionUrl);
                                     setIsModalOpen(false);
                                   }
                                 }}
                                 className="text-xs text-blue-600 hover:text-blue-800"
                               >
                                 보기 →
                               </button>
                             )}
                           </div>
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
             </div>

             {/* 모달 푸터 */}
             <div className="p-4 border-t border-gray-200 bg-gray-50">
               <div className="flex justify-between items-center">
                 <span className="text-sm text-gray-600">
                   총 {allNotifications.length}개의 알림
                 </span>
                 <button
                   onClick={() => setIsModalOpen(false)}
                   className="text-sm text-gray-600 hover:text-gray-800"
                 >
                   닫기
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 };

export default NotificationDropdown;
