import axios from 'axios';

export interface NotificationData {
  id?: string;
  userId: string;
  type: 'member_join' | 'member_leave' | 'meeting_created';
  title: string;
  message: string;
  groupId: string;
  groupName: string;
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
    console.log('🔔 알림 생성 시작:', {
      notificationApiUrl: this.notificationApiUrl,
      notificationData
    });
    
    try {
      const requestData = {
        userId: notificationData.userId,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        groupId: notificationData.groupId,
        groupName: notificationData.groupName,
        relatedId: notificationData.relatedId,
        actionUrl: notificationData.actionUrl
      };
      
      console.log('📤 알림 API 서버로 전송할 데이터:', requestData);
      
      const response = await axios.post(`${this.notificationApiUrl}`, requestData);

      console.log(`✅ 알림 API 서버로 전송 완료: ${notificationData.userId} - ${notificationData.type}`);
      console.log('응답 데이터:', response.data);

      return response.data.data;
    } catch (error: any) {
      console.error('❌ 알림 API 서버 전송 실패:', error);
      console.error('에러 상세 정보:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status
      });
      
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

  // 실시간 알림 발송 (기존 메서드명 유지, 내부 로직만 변경)
  async sendRealTimeNotification(notificationData: NotificationData) {
    return this.createNotification(notificationData);
  }

  // 그룹장에게 멤버 가입 알림
  async sendMemberJoinNotification(groupId: string, groupName: string, leaderId: string, newMemberName: string) {
    console.log('🔔 멤버 가입 알림 생성:', {
      groupId,
      groupName,
      leaderId,
      newMemberName
    });
    
    await this.sendRealTimeNotification({
      userId: leaderId,
      type: 'member_join',
      title: '새로운 멤버 가입',
      message: `"${groupName}" 스터디 그룹에 ${newMemberName}님이 가입했습니다.`,
      groupId,
      groupName,
      actionUrl: `/study-groups/${groupId}`
    });
  }

  // 그룹장에게 멤버 탈퇴 알림
  async sendMemberLeaveNotification(groupId: string, groupName: string, leaderId: string, memberName: string) {
    console.log('🔔 멤버 탈퇴 알림 생성:', {
      groupId,
      groupName,
      leaderId,
      memberName
    });
    
    await this.sendRealTimeNotification({
      userId: leaderId,
      type: 'member_leave',
      title: '멤버 탈퇴',
      message: `"${groupName}" 스터디 그룹에서 ${memberName}님이 탈퇴했습니다.`,
      groupId,
      groupName,
      actionUrl: `/study-groups/${groupId}`
    });
  }

  // 그룹 전체에 모임 일정 생성 알림
  async sendMeetingCreatedNotification(groupId: string, groupName: string, meetingTitle: string, memberIds: string[], excludeUserId?: string) {
    const notificationData = {
      type: 'meeting_created' as const,
      title: '새로운 모임 일정',
      message: `"${groupName}" 스터디 그룹에 새로운 모임 "${meetingTitle}"이 생성되었습니다.`,
      groupId,
      groupName,
      actionUrl: `/study-groups/${groupId}`
    };

    // 모든 멤버에게 알림 발송 (특정 사용자 제외)
    for (const memberId of memberIds) {
      if (memberId !== excludeUserId) {
        await this.sendRealTimeNotification({
          ...notificationData,
          userId: memberId
        });
      }
    }
  }

  // 그룹 전체에 브로드캐스트
  async broadcastToGroup(groupId: string, notificationData: Omit<NotificationData, 'userId'>, excludeUserId?: string) {
    try {
      // TODO: 그룹 멤버 정보를 스터디 그룹 API에서 조회하여 알림 발송
      console.log(`그룹 브로드캐스트 요청: ${groupId}`);
      console.log('알림 데이터:', notificationData);
    } catch (error) {
      console.error('그룹 브로드캐스트 실패:', error);
    }
  }

  // 스터디 그룹 정보 조회 (임시로 null 반환, 필요시 별도 API 호출)
  private async getStudyGroupById(groupId: string) {
    try {
      // TODO: 필요시 스터디 그룹 API에서 정보 조회
      console.log(`스터디 그룹 정보 조회 요청: ${groupId}`);
      return null;
    } catch (error) {
      console.error('스터디 그룹 정보 조회 실패:', error);
      return null;
    }
  }
}

// 싱글톤 인스턴스
export const notificationService = new NotificationService();
