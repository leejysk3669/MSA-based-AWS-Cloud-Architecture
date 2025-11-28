import { v4 as uuidv4 } from 'uuid';

export interface Notification {
  id: string;
  userId: string;
  type: 'study_group' | 'board' | 'comment' | 'like';
  title: string;
  message: string;
  relatedId?: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

export type NotificationType = Notification['type'];

class NotificationService {
  private notifications: Notification[] = [];
  private currentUserId: string | null = null;

  constructor() {
    this.loadNotifications();
  }

  // 현재 사용자 설정
  setCurrentUser(userId: string) {
    this.currentUserId = userId;
    // 사용자 변경 시 알림 로드
    this.loadNotifications();
  }

  // 현재 사용자 제거 (로그아웃 시 사용)
  clearCurrentUser() {
    this.currentUserId = null;
    // 사용자 제거 시 알림 초기화
    this.notifications = [];
    this.saveNotifications();
  }

  // 현재 사용자 조회
  getCurrentUser(): string | null {
    return this.currentUserId;
  }

  // 알림 생성
  createNotification(data: Omit<Notification, 'id' | 'isRead' | 'createdAt'>): Notification {
    console.log('알림 생성 시작:', data);
    
    const notification: Notification = {
      id: uuidv4(),
      isRead: false,
      createdAt: new Date().toISOString(),
      ...data
    };

    console.log('생성된 알림 객체:', notification);
    
    this.notifications.push(notification);
    console.log('알림 배열에 추가됨. 현재 알림 개수:', this.notifications.length);
    
    this.saveNotifications();
    console.log('알림 저장 완료');
    
    // 브라우저 알림 표시 (임시 비활성화 - 문제 해결 후 재활성화)
    // this.showBrowserNotification(notification);
    
    return notification;
  }

  // 브라우저 알림 표시
  private async showBrowserNotification(notification: Notification) {
    try {
      const { browserNotificationService } = await import('./browserNotificationService');
      await browserNotificationService.showNotification(notification);
    } catch (error) {
      console.error('Failed to show browser notification:', error);
      // 브라우저 알림 실패해도 앱은 계속 작동하도록
    }
  }

  // 사용자별 알림 조회
  getUserNotifications(userId: string): Notification[] {
    console.log('사용자 알림 조회:', { userId, totalNotifications: this.notifications.length });
    
    const userNotifications = this.notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    console.log('필터링된 알림:', userNotifications);
    
    return userNotifications;
  }

  // 전체 알림 조회 (디버깅용)
  getAllNotifications(): Notification[] {
    return this.notifications;
  }

  // 읽지 않은 알림 개수
  getUnreadCount(userId: string): number {
    return this.notifications.filter(n => n.userId === userId && !n.isRead).length;
  }

  // 알림 읽음 처리
  markAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
      this.saveNotifications();
    }
  }

  // 모든 알림 읽음 처리
  markAllAsRead(userId: string): void {
    this.notifications.forEach(n => {
      if (n.userId === userId && !n.isRead) {
        n.isRead = true;
      }
    });
    this.saveNotifications();
  }

  // 알림 삭제
  deleteNotification(notificationId: string): void {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.saveNotifications();
  }

  // 오래된 알림 정리 (30일 이상)
  cleanupOldNotifications(): void {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    this.notifications = this.notifications.filter(n => 
      new Date(n.createdAt) > thirtyDaysAgo
    );
    this.saveNotifications();
  }

  // 스터디 그룹 알림 생성
  createStudyGroupNotification(
    userId: string,
    type: 'member_join' | 'meeting_change' | 'attendance_update' | 'group_update',
    groupId: string,
    groupName: string,
    additionalInfo?: string
  ): Notification {
    const notifications = {
      member_join: {
        title: '새로운 멤버 가입',
        message: `"${groupName}" 스터디 그룹에 새로운 멤버가 가입했습니다.`,
        actionUrl: `/study-groups/${groupId}`
      },
      meeting_change: {
        title: '모임 일정 변경',
        message: `"${groupName}" 스터디 그룹의 모임 일정이 변경되었습니다.`,
        actionUrl: `/study-groups/${groupId}`
      },
      attendance_update: {
        title: '참석 상태 업데이트',
        message: `"${groupName}" 스터디 그룹의 참석 상태가 업데이트되었습니다.`,
        actionUrl: `/study-groups/${groupId}`
      },
      group_update: {
        title: '그룹 정보 변경',
        message: `"${groupName}" 스터디 그룹의 정보가 변경되었습니다.`,
        actionUrl: `/study-groups/${groupId}`
      }
    };

    const notificationData = notifications[type];
    return this.createNotification({
      userId,
      type: 'study_group',
      title: notificationData.title,
      message: additionalInfo ? `${notificationData.message} ${additionalInfo}` : notificationData.message,
      relatedId: groupId,
      actionUrl: notificationData.actionUrl
    });
  }

  // 게시판 알림 생성
  createBoardNotification(
    userId: string,
    type: 'comment' | 'like' | 'reply',
    postId: string,
    postTitle: string,
    authorName?: string,
    count?: number
  ): Notification {
    const notifications = {
      comment: {
        title: '새로운 댓글',
        message: `"${postTitle}" 글에 새로운 댓글이 달렸습니다.`,
        actionUrl: `/board/posts/${postId}`
      },
      like: {
        title: '추천 알림',
        message: `"${postTitle}" 글의 추천이 ${count}개를 달성했습니다!`,
        actionUrl: `/board/posts/${postId}`
      },
      reply: {
        title: '답글 알림',
        message: `${authorName}님이 내 댓글에 답글을 달았습니다.`,
        actionUrl: `/board/posts/${postId}`
      }
    };

    const notificationData = notifications[type];
    return this.createNotification({
      userId,
      type: 'board',
      title: notificationData.title,
      message: notificationData.message,
      relatedId: postId,
      actionUrl: notificationData.actionUrl
    });
  }

  // 로컬 스토리지 저장
  private saveNotifications(): void {
    try {
      localStorage.setItem('notifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.error('알림 저장 실패:', error);
    }
  }

  // 로컬 스토리지 로드
  private loadNotifications(): void {
    try {
      const saved = localStorage.getItem('notifications');
      if (saved) {
        this.notifications = JSON.parse(saved);
      }
    } catch (error) {
      console.error('알림 로드 실패:', error);
      this.notifications = [];
    }
  }

  // 테스트용 알림 생성
  createTestNotification(userId: string): Notification {
    return this.createNotification({
      userId,
      type: 'study_group',
      title: '테스트 알림',
      message: '새로고침 후에도 알림이 제대로 표시되는지 테스트합니다.',
      actionUrl: '/study'
    });
  }

  // 모든 알림 삭제 (테스트용)
  clearAllNotifications(): void {
    this.notifications = [];
    this.saveNotifications();
  }
}

// 싱글톤 인스턴스
export const notificationService = new NotificationService();
