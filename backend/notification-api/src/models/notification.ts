export interface Notification {
  id: string;
  userId: string;
  type: 'member_join' | 'member_leave' | 'meeting_created' | 'study_group' | 'board' | 'comment' | 'like';
  title: string;
  message: string;
  groupId?: string;
  groupName?: string;
  relatedId?: string;
  actionUrl?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotificationRequest {
  userId: string;
  type: Notification['type'];
  title: string;
  message: string;
  groupId?: string;
  groupName?: string;
  relatedId?: string;
  actionUrl?: string;
}

export interface UpdateNotificationRequest {
  isRead?: boolean;
}

export interface NotificationFilters {
  userId?: string;
  type?: Notification['type'];
  isRead?: boolean;
  limit?: number;
  offset?: number;
}
