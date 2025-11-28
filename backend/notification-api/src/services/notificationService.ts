import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { Notification, CreateNotificationRequest, UpdateNotificationRequest, NotificationFilters } from '../models/notification';

export class NotificationService {
  // 알림 생성
  async createNotification(data: CreateNotificationRequest): Promise<Notification> {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const query = `
      INSERT INTO notifications (
        id, user_id, type, title, message, group_id, group_name, 
        related_id, action_url, is_read, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;
    
    const values = [
      id,
      data.userId,
      data.type,
      data.title,
      data.message,
      data.groupId || null,
      data.groupName || null,
      data.relatedId || null,
      data.actionUrl || null,
      false, // 기본적으로 읽지 않음
      now,
      now
    ];
    
    try {
      const result = await pool.query(query, values);
      return this.mapDbRowToNotification(result.rows[0]);
    } catch (error) {
      console.error('알림 생성 오류:', error);
      throw new Error('알림 생성에 실패했습니다.');
    }
  }

  // 모든 알림 조회 (테스트용)
  async getAllNotifications(): Promise<Notification[]> {
    const query = `
      SELECT * FROM notification.notifications 
      ORDER BY created_at DESC
    `;
    
    try {
      const result = await pool.query(query);
      return result.rows.map(row => this.mapDbRowToNotification(row));
    } catch (error) {
      console.error('모든 알림 조회 오류:', error);
      throw new Error('모든 알림 조회에 실패했습니다.');
    }
  }

  // 사용자별 읽지 않은 알림 개수 조회
  async getUnreadCount(userId: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as count FROM notification.notifications 
      WHERE user_id = $1 AND is_read = false
    `;
    
    try {
      const result = await pool.query(query, [userId]);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      console.error('읽지 않은 알림 개수 조회 오류:', error);
      throw new Error('읽지 않은 알림 개수 조회에 실패했습니다.');
    }
  }

  // 사용자별 알림 조회
  async getNotificationsByUser(userId: string, filters?: NotificationFilters): Promise<Notification[]> {
    let query = `
      SELECT * FROM notification.notifications 
      WHERE user_id = $1
    `;
    
    const values: any[] = [userId];
    let paramIndex = 2;
    
    // 필터 적용
    if (filters?.type) {
      query += ` AND type = $${paramIndex}`;
      values.push(filters.type);
      paramIndex++;
    }
    
    if (filters?.isRead !== undefined) {
      query += ` AND is_read = $${paramIndex}`;
      values.push(filters.isRead);
      paramIndex++;
    }
    
    // 정렬 (최신순)
    query += ` ORDER BY created_at DESC`;
    
    // 페이징
    if (filters?.limit) {
      query += ` LIMIT $${paramIndex}`;
      values.push(filters.limit);
      paramIndex++;
      
      if (filters?.offset) {
        query += ` OFFSET $${paramIndex}`;
        values.push(filters.offset);
      }
    }
    
    try {
      const result = await pool.query(query, values);
      return result.rows.map(row => this.mapDbRowToNotification(row));
    } catch (error) {
      console.error('알림 조회 오류:', error);
      throw new Error('알림 조회에 실패했습니다.');
    }
  }

  // 알림 읽음 처리
  async markAsRead(notificationId: string): Promise<Notification> {
    const query = `
      UPDATE notification.notifications 
      SET is_read = true, updated_at = $1
      WHERE id = $2
      RETURNING *
    `;
    
    try {
      const result = await pool.query(query, [new Date().toISOString(), notificationId]);
      
      if (result.rows.length === 0) {
        throw new Error('알림을 찾을 수 없습니다.');
      }
      
      return this.mapDbRowToNotification(result.rows[0]);
    } catch (error) {
      console.error('알림 읽음 처리 오류:', error);
      throw new Error('알림 읽음 처리에 실패했습니다.');
    }
  }

  // 사용자의 모든 알림 읽음 처리
  async markAllAsRead(userId: string): Promise<number> {
    const query = `
      UPDATE notification.notifications 
      SET is_read = true, updated_at = $1
      WHERE user_id = $2 AND is_read = false
    `;
    
    try {
      const result = await pool.query(query, [new Date().toISOString(), userId]);
      return result.rowCount || 0;
    } catch (error) {
      console.error('모든 알림 읽음 처리 오류:', error);
      throw new Error('모든 알림 읽음 처리에 실패했습니다.');
    }
  }

  // 알림 삭제
  async deleteNotification(notificationId: string): Promise<boolean> {
    const query = `DELETE FROM notification.notifications WHERE id = $1`;
    
    try {
      const result = await pool.query(query, [notificationId]);
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('알림 삭제 오류:', error);
      throw new Error('알림 삭제에 실패했습니다.');
    }
  }



  // 특정 알림 조회
  async getNotificationById(notificationId: string): Promise<Notification | null> {
    const query = `SELECT * FROM notification.notifications WHERE id = $1`;
    
    try {
      const result = await pool.query(query, [notificationId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapDbRowToNotification(result.rows[0]);
    } catch (error) {
      console.error('알림 조회 오류:', error);
      throw new Error('알림 조회에 실패했습니다.');
    }
  }

  // 데이터베이스 행을 Notification 객체로 변환
  private mapDbRowToNotification(row: any): Notification {
    return {
      id: row.id,
      userId: row.user_id,
      type: row.type,
      title: row.title,
      message: row.message,
      groupId: row.group_id,
      groupName: row.group_name,
      relatedId: row.related_id,
      actionUrl: row.action_url,
      isRead: row.is_read,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

export const notificationService = new NotificationService();
