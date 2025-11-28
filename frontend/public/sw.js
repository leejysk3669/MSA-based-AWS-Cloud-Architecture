// Service Worker for Push Notifications
const CACHE_NAME = 'notification-cache-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(self.clients.claim());
});

// Push event - 브라우저 알림 표시
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  if (event.data) {
    const notification = event.data.json();
    
    const options = {
      body: notification.message,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: notification.id, // 중복 알림 방지
      requireInteraction: false,
      actions: [
        {
          action: 'view',
          title: '보기',
          icon: '/favicon.ico'
        },
        {
          action: 'dismiss',
          title: '닫기'
        }
      ],
      data: {
        url: notification.actionUrl,
        notificationId: notification.id
      }
    };

    event.waitUntil(
      self.registration.showNotification(notification.title, options)
    );
  }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'view' && event.notification.data.url) {
    // 알림 클릭 시 해당 페이지로 이동
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        if (clients.length > 0) {
          // 기존 탭이 있으면 해당 탭에서 열기
          clients[0].postMessage({
            type: 'NOTIFICATION_CLICK',
            url: event.notification.data.url,
            notificationId: event.notification.data.notificationId
          });
        } else {
          // 새 탭에서 열기
          self.clients.openWindow(event.notification.data.url);
        }
      })
    );
  }
});

// Background sync (선택사항)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Background sync triggered');
    // 백그라운드에서 알림 동기화
  }
});
