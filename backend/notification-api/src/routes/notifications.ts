import { Router, Request, Response } from 'express';
import { notificationService } from '../services/notificationService';
import { CreateNotificationRequest, UpdateNotificationRequest } from '../models/notification';

const router = Router();

// 알림 생성
router.post('/', async (req: Request, res: Response) => {
  try {
    const notificationData: CreateNotificationRequest = req.body;
    
    // 필수 필드 검증
    if (!notificationData.userId || !notificationData.type || !notificationData.title || !notificationData.message) {
      return res.status(400).json({
        success: false,
        message: '필수 필드가 누락되었습니다. (userId, type, title, message)'
      });
    }
    
    const notification = await notificationService.createNotification(notificationData);
    
    res.status(201).json({
      success: true,
      data: notification,
      message: '알림이 성공적으로 생성되었습니다.'
    });
  } catch (error) {
    console.error('알림 생성 API 오류:', error);
    res.status(500).json({
      success: false,
      message: '알림 생성에 실패했습니다.'
    });
  }
});

// 루트 경로 - 모든 알림 조회 (테스트용)
router.get('/', async (req: Request, res: Response) => {
  try {
    const notifications = await notificationService.getAllNotifications();
    
    res.json({
      success: true,
      data: notifications,
      message: '모든 알림을 성공적으로 조회했습니다.'
    });
  } catch (error) {
    console.error('알림 조회 API 오류:', error);
    res.status(500).json({
      success: false,
      message: '알림 조회에 실패했습니다.'
    });
  }
});

// 사용자별 알림 조회
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { type, isRead, limit, offset } = req.query;
    
    const filters = {
      type: type as any,
      isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined
    };
    
    const notifications = await notificationService.getNotificationsByUser(userId, filters);
    
    res.json({
      success: true,
      data: notifications,
      message: '알림 목록을 성공적으로 조회했습니다.'
    });
  } catch (error) {
    console.error('알림 조회 API 오류:', error);
    res.status(500).json({
      success: false,
      message: '알림 조회에 실패했습니다.'
    });
  }
});

// 사용자별 읽지 않은 알림 개수 조회
router.get('/user/:userId/unread-count', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const count = await notificationService.getUnreadCount(userId);
    
    res.json({
      success: true,
      data: { count },
      message: '읽지 않은 알림 개수를 성공적으로 조회했습니다.'
    });
  } catch (error) {
    console.error('읽지 않은 알림 개수 조회 API 오류:', error);
    res.status(500).json({
      success: false,
      message: '읽지 않은 알림 개수 조회에 실패했습니다.'
    });
  }
});

// 특정 알림 조회 (ID 기반)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const notification = await notificationService.getNotificationById(id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: '알림을 찾을 수 없습니다.'
      });
    }
    
    res.json({
      success: true,
      data: notification,
      message: '알림을 성공적으로 조회했습니다.'
    });
  } catch (error) {
    console.error('알림 조회 API 오류:', error);
    res.status(500).json({
      success: false,
      message: '알림 조회에 실패했습니다.'
    });
  }
});

// 알림 읽음 처리
router.put('/:id/read', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const notification = await notificationService.markAsRead(id);
    
    res.json({
      success: true,
      data: notification,
      message: '알림이 읽음 처리되었습니다.'
    });
  } catch (error) {
    console.error('알림 읽음 처리 API 오류:', error);
    res.status(500).json({
      success: false,
      message: '알림 읽음 처리에 실패했습니다.'
    });
  }
});

// 사용자의 모든 알림 읽음 처리
router.put('/user/:userId/read-all', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const updatedCount = await notificationService.markAllAsRead(userId);
    
    res.json({
      success: true,
      data: { updatedCount },
      message: `${updatedCount}개의 알림이 읽음 처리되었습니다.`
    });
  } catch (error) {
    console.error('모든 알림 읽음 처리 API 오류:', error);
    res.status(500).json({
      success: false,
      message: '모든 알림 읽음 처리에 실패했습니다.'
    });
  }
});

// 읽지 않은 알림 개수 조회
router.get('/user/:userId/unread-count', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const count = await notificationService.getUnreadCount(userId);
    
    res.json({
      success: true,
      data: { count },
      message: '읽지 않은 알림 개수를 성공적으로 조회했습니다.'
    });
  } catch (error) {
    console.error('읽지 않은 알림 개수 조회 API 오류:', error);
    res.status(500).json({
      success: false,
      message: '읽지 않은 알림 개수 조회에 실패했습니다.'
    });
  }
});

// 알림 삭제
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await notificationService.deleteNotification(id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: '알림을 찾을 수 없습니다.'
      });
    }
    
    res.json({
      success: true,
      message: '알림이 성공적으로 삭제되었습니다.'
    });
  } catch (error) {
    console.error('알림 삭제 API 오류:', error);
    res.status(500).json({
      success: false,
      message: '알림 삭제에 실패했습니다.'
    });
  }
});

export { router as notificationRouter };
