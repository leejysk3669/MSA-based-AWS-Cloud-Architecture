import { Notification as AppNotification } from './notificationService';

class BrowserNotificationService {
  private isSupported: boolean;
  private permission: NotificationPermission = 'default';
  private registration: ServiceWorkerRegistration | null = null;

  constructor() {
    this.isSupported = 'Notification' in window && 'serviceWorker' in navigator;
    // 자동 초기화 제거 - 필요할 때만 초기화
  }

  private async init() {
    if (!this.isSupported) {
      console.log('Browser notifications not supported');
      return;
    }

    try {
      // 권한 상태 확인 (Service Worker 등록 전에)
      this.permission = Notification.permission;

      // Service Worker 등록 (더 안전하게)
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', this.registration);
      } catch (swError) {
        console.error('Service Worker registration failed:', swError);
        // Service Worker 실패해도 기본 알림은 작동하도록
      }

      // 권한 변경 이벤트 리스너
      if ('permissions' in navigator) {
        try {
          const result = await navigator.permissions.query({ name: 'notifications' });
          result.onchange = () => {
            this.permission = result.state as NotificationPermission;
          };
        } catch (permError) {
          console.log('Permission query not supported:', permError);
        }
      }
    } catch (error) {
      console.error('Browser notification service init failed:', error);
      // 전체 초기화 실패해도 앱은 계속 작동하도록
    }
  }

  // 알림 권한 요청
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported) return false;

    try {
      // 필요할 때만 초기화
      if (!this.registration) {
        await this.init();
      }

      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }

  // 권한 상태 확인
  getPermissionStatus(): NotificationPermission {
    return this.permission;
  }

  // 브라우저 알림 표시
  async showNotification(notification: AppNotification): Promise<void> {
    if (!this.isSupported || this.permission !== 'granted') {
      return;
    }

    try {
      // Service Worker 없이 기본 Notification API 사용
      if (this.registration) {
        await this.registration.showNotification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: notification.id,
          requireInteraction: false,
          data: {
            url: notification.actionUrl,
            notificationId: notification.id
          }
        });
      } else {
        // Service Worker가 없으면 기본 Notification 사용
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          tag: notification.id
        });
      }
    } catch (error) {
      console.error('Failed to show notification:', error);
      // 기본 Notification으로 폴백
      try {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico'
        });
      } catch (fallbackError) {
        console.error('Fallback notification also failed:', fallbackError);
      }
    }
  }

  // 알림 클릭 이벤트 처리
  handleNotificationClick(url: string, notificationId: string) {
    // 알림 읽음 처리
    if (notificationId) {
      // notificationService.markAsRead(notificationId);
    }

    // URL로 이동
    if (url) {
      // 현재 탭에서 페이지 이동
      window.location.href = url;
    }
  }

  // 알림 설정 저장
  saveNotificationSettings(settings: {
    enabled: boolean;
    sound: boolean;
    vibration: boolean;
  }) {
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
  }

  // 알림 설정 로드
  loadNotificationSettings() {
    const saved = localStorage.getItem('notificationSettings');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      enabled: true,
      sound: true,
      vibration: false
    };
  }

  // 알림 테스트
  async testNotification(): Promise<void> {
    if (!this.isSupported) {
      alert('브라우저가 알림을 지원하지 않습니다.');
      return;
    }

    try {
      // 필요할 때만 초기화
      if (!this.registration) {
        await this.init();
      }

      if (this.permission !== 'granted') {
        const granted = await this.requestPermission();
        if (!granted) {
          alert('알림 권한이 필요합니다.');
          return;
        }
      }

      await this.showNotification({
        id: 'test',
        userId: 'test',
        type: 'study_group',
        title: '알림 테스트',
        message: '브라우저 알림이 정상적으로 작동합니다!',
        isRead: false,
        createdAt: new Date().toISOString(),
        actionUrl: '/'
      });
    } catch (error) {
      console.error('Test notification failed:', error);
      alert('알림 테스트에 실패했습니다.');
    }
  }
}

// 싱글톤 인스턴스
export const browserNotificationService = new BrowserNotificationService();
