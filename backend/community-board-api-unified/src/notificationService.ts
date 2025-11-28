import axios from 'axios';

export interface NotificationData {
  id?: string;
  userId: string;
  type: 'comment' | 'like_milestone';
  title: string;
  message: string;
  postId?: string;
  postTitle?: string;
  relatedId?: string;
  actionUrl?: string;
  isRead?: boolean;
  createdAt?: string;
}

export class NotificationService {
  private notificationApiUrl: string;

  constructor() {
    this.notificationApiUrl = process.env.NOTIFICATION_API_URL || 'http://localhost:3004';
  }

  // 알림 생성 (별도 알림 API 서버로 HTTP 요청)
  async createNotification(notificationData: Omit<NotificationData, 'id' | 'createdAt'>): Promise<NotificationData> {
    try {
      const response = await axios.post(`${this.notificationApiUrl}`, {
        userId: notificationData.userId,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        relatedId: notificationData.postId,
        actionUrl: notificationData.actionUrl
      });

      console.log(`✅ 게시판 알림 API 서버로 전송 완료: ${notificationData.userId} - ${notificationData.type}`);
      console.log('응답 데이터:', response.data);

      return response.data.data;
    } catch (error) {
      console.error('게시판 알림 API 서버 전송 실패:', error);
      // API 서버 실패 시에도 로컬 로그는 남김
      const fallbackNotification: NotificationData = {
        ...notificationData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        isRead: false
      };
      
      console.log('로컬 폴백 알림 생성:', fallbackNotification);
      return fallbackNotification;
    }
  }

  // 댓글 알림 발송
  async sendCommentNotification(postId: string, postTitle: string, postAuthorId: string, commentAuthor: string) {
    if (!postAuthorId || postAuthorId === 'admin') {
      return; // 관리자 글에는 알림 발송하지 않음
    }

    await this.createNotification({
      userId: postAuthorId,
      type: 'comment',
      title: '새로운 댓글',
      message: `"${postTitle}" 게시글에 ${commentAuthor}님이 댓글을 남겼습니다.`,
      postId,
      postTitle,
      actionUrl: `/board/posts/${postId}`
    });
  }

  // 추천수 마일스톤 알림 발송
  async sendLikeMilestoneNotification(postId: string, postTitle: string, postAuthorId: string, likeCount: number) {
    if (!postAuthorId || postAuthorId === 'admin') {
      return; // 관리자 글에는 알림 발송하지 않음
    }

    // 50단위로 마일스톤 체크
    if (likeCount % 50 === 0 && likeCount > 0) {
      await this.createNotification({
        userId: postAuthorId,
        type: 'like_milestone',
        title: '추천수 마일스톤 달성!',
        message: `"${postTitle}" 게시글이 ${likeCount}개의 추천을 받았습니다!`,
        postId,
        postTitle,
        actionUrl: `/board/posts/${postId}`
      });
    }
  }
}

// 싱글톤 인스턴스
export const notificationService = new NotificationService();
