import { Router } from 'express';
import { PostgresStudyGroupService } from '../services/postgresStudyGroupService';
import { authMiddleware, optionalAuthMiddleware, AuthenticatedRequest, adminMiddleware } from '../middleware/auth';
import { getUserDisplayName } from '../utils/userDisplayName';

const router = Router();
const studyGroupService = new PostgresStudyGroupService();

// 스터디 그룹 목록 조회
router.get('/', async (req, res) => {
  try {
    const { category = 'all', page = 1, limit = 20 } = req.query;
    const result = await studyGroupService.getStudyGroupsWithPagination(category as string, Number(page), Number(limit));
    res.json(result);
  } catch (error) {
    console.error('스터디 그룹 목록 조회 오류:', error);
    res.status(500).json({ error: '스터디 그룹 조회 중 오류가 발생했습니다.' });
  }
});

// 사용자별 스터디 그룹 조회 (만든 스터디)
router.get('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const groups = await studyGroupService.getUserStudyGroups(userId, Number(page), Number(limit));
    res.json(groups);
  } catch (error) {
    console.error('사용자별 스터디 그룹 조회 오류:', error);
    res.status(500).json({ error: '사용자별 스터디 그룹 조회 중 오류가 발생했습니다.' });
  }
});

// 사용자가 참여하고 있는 스터디 그룹 조회
router.get('/users/:userId/participating', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const groups = await studyGroupService.getUserParticipatingGroups(userId, Number(page), Number(limit));
    res.json(groups);
  } catch (error) {
    console.error('사용자 참여 스터디 그룹 조회 오류:', error);
    res.status(500).json({ error: '사용자 참여 스터디 그룹 조회 중 오류가 발생했습니다.' });
  }
});

// 스터디 그룹 상세 조회
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const group = await studyGroupService.getStudyGroupById(id);
    if (!group) {
      return res.status(404).json({ error: '스터디 그룹을 찾을 수 없습니다.' });
    }
    res.json(group);
  } catch (error) {
    console.error('스터디 그룹 상세 조회 오류:', error);
    res.status(500).json({ error: '스터디 그룹 조회 중 오류가 발생했습니다.' });
  }
});

// 스터디 그룹 생성
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { name, description, category, maxMembers, leader } = req.body;
    if (!name || !description || !category || !leader) {
      return res.status(400).json({ error: '필수 필드가 누락되었습니다.' });
    }

    // 사용자 표시 이름 생성
    const leaderName = getUserDisplayName(req.user);
    console.log('🔍 스터디 그룹 생성 - 사용자 정보:', req.user);
    console.log('📧 사용자 이메일:', req.user?.email);
    console.log('👤 사용자명:', req.user?.username);
    console.log('🆔 사용자 ID:', req.user?.sub);
    console.log('✏️ 생성된 그룹장명:', leaderName);

    const group = await studyGroupService.createStudyGroup({ name, description, category, maxMembers, leader, leaderName });
    res.status(201).json(group);
  } catch (error) {
    console.error('스터디 그룹 생성 오류:', error);
    res.status(500).json({ error: '스터디 그룹 생성 중 오류가 발생했습니다.' });
  }
});

// 스터디 그룹 수정
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, maxMembers } = req.body;
    const group = await studyGroupService.updateStudyGroup(id, { name, description, maxMembers });
    if (!group) {
      return res.status(404).json({ error: '스터디 그룹을 찾을 수 없습니다.' });
    }
    res.json(group);
  } catch (error) {
    console.error('스터디 그룹 수정 오류:', error);
    res.status(500).json({ error: '스터디 그룹 수정 중 오류가 발생했습니다.' });
  }
});

// 스터디 그룹 삭제
router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    // 그룹 정보 확인 및 권한 체크 (리더 또는 관리자)
    const group = await studyGroupService.getStudyGroupById(id);
    if (!group) {
      return res.status(404).json({ error: '스터디 그룹을 찾을 수 없습니다.' });
    }

    const leaderMember = (group.members || []).find(m => m.role === 'leader');
    const isLeader = leaderMember?.userId === req.user?.sub;
    const isAdmin = req.user?.groups?.includes('admin') || req.user?.groups?.includes('Admin');

    if (!isLeader && !isAdmin) {
      return res.status(403).json({ error: '권한이 없습니다. (리더 또는 관리자만 삭제 가능)' });
    }

    const success = await studyGroupService.deleteStudyGroup(id);
    if (!success) {
      return res.status(404).json({ error: '스터디 그룹을 찾을 수 없습니다.' });
    }
    res.json({ message: '스터디 그룹이 삭제되었습니다.' });
  } catch (error) {
    console.error('스터디 그룹 삭제 오류:', error);
    res.status(500).json({ error: '스터디 그룹 삭제 중 오류가 발생했습니다.' });
  }
});

// 스터디 그룹 가입
router.post('/:id/join', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: '사용자 ID가 필요합니다.' });
    }

    // 사용자 표시 이름 생성
    const userName = getUserDisplayName(req.user);
    console.log('🔍 스터디 그룹 가입 - 사용자 정보:', req.user);
    console.log('📧 사용자 이메일:', req.user?.email);
    console.log('👤 사용자명:', req.user?.username);
    console.log('🆔 사용자 ID:', req.user?.sub);
    console.log('✏️ 생성된 사용자명:', userName);

    const result = await studyGroupService.joinStudyGroup(id, { userId, userName });
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }
    res.json(result);
  } catch (error) {
    console.error('스터디 그룹 가입 오류:', error);
    res.status(500).json({ error: '스터디 그룹 가입 중 오류가 발생했습니다.' });
  }
});

// 스터디 그룹 탈퇴
router.post('/:id/leave', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: '사용자 ID가 필요합니다.' });
    }
    const result = await studyGroupService.leaveStudyGroup(id, userId);
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }
    res.json(result);
  } catch (error) {
    console.error('스터디 그룹 탈퇴 오류:', error);
    res.status(500).json({ error: '스터디 그룹 탈퇴 중 오류가 발생했습니다.' });
  }
});

// 멤버 추방 (그룹장만 가능)
router.post('/:id/kick', async (req, res) => {
  try {
    const { id } = req.params;
    const { memberId } = req.body;
    if (!memberId) {
      return res.status(400).json({ error: '멤버 ID가 필요합니다.' });
    }
    const result = await studyGroupService.kickMember(id, memberId);
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }
    res.json(result);
  } catch (error) {
    console.error('멤버 추방 오류:', error);
    res.status(500).json({ error: '멤버 추방 중 오류가 발생했습니다.' });
  }
});

// 모임 일정 조회
router.get('/:id/meetings', async (req, res) => {
  try {
    const { id } = req.params;
    const meetings = await studyGroupService.getMeetings(id);
    res.json(meetings);
  } catch (error) {
    console.error('모임 일정 조회 오류:', error);
    res.status(500).json({ error: '모임 일정 조회 중 오류가 발생했습니다.' });
  }
});

// 모임 일정 생성
router.post('/:id/meetings', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { title, description, date, location } = req.body;
    if (!title || !date) {
      return res.status(400).json({ error: '필수 필드가 누락되었습니다.' });
    }
    const meeting = await studyGroupService.createMeeting(id, { title, description, date, location });
    res.status(201).json(meeting);
  } catch (error) {
    console.error('모임 일정 생성 오류:', error);
    res.status(500).json({ error: '모임 일정 생성 중 오류가 발생했습니다.' });
  }
});

// 모임 일정 수정 (테스트용 - 인증 미들웨어 일시 제거)
router.put('/meetings/:meetingId', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { title, description, date, location } = req.body;
    const meeting = await studyGroupService.updateMeeting(meetingId, { title, description, date, location });
    if (!meeting) {
      return res.status(404).json({ error: '모임 일정을 찾을 수 없습니다.' });
    }
    res.json(meeting);
  } catch (error) {
    console.error('모임 일정 수정 오류:', error);
    res.status(500).json({ error: '모임 일정 수정 중 오류가 발생했습니다.' });
  }
});

// 모임 일정 삭제 (테스트용 - 인증 미들웨어 일시 제거)
router.delete('/meetings/:meetingId', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const success = await studyGroupService.deleteMeeting(meetingId);
    if (!success) {
      return res.status(500).json({ error: '모임 일정 삭제 중 오류가 발생했습니다.' });
    }
    res.json({ message: '모임 일정이 삭제되었습니다.' });
    console.log('✅ 모임 삭제 성공:', meetingId);
  } catch (error) {
    console.error('모임 일정 삭제 오류:', error);
    res.status(500).json({ error: '모임 일정 삭제 중 오류가 발생했습니다.' });
  }
});

// 모임 참석 상태 업데이트
router.post('/meetings/:meetingId/attendance', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { meetingId } = req.params;
    const { userId, status } = req.body;
    
    if (!userId || !status) {
      return res.status(400).json({ error: '필수 필드가 누락되었습니다.' });
    }

    // 사용자 표시 이름 생성
    const userName = getUserDisplayName(req.user);
    console.log('🔍 모임 참석 - 사용자 정보:', req.user);
    console.log('📧 사용자 이메일:', req.user?.email);
    console.log('👤 사용자명:', req.user?.username);
    console.log('🆔 사용자 ID:', req.user?.sub);
    console.log('✏️ 생성된 사용자명:', userName);

    const attendee = await studyGroupService.updateMeetingAttendance(meetingId, { userId, userName, status });
    if (!attendee) {
      return res.status(404).json({ error: '모임 일정을 찾을 수 없습니다.' });
    }
    res.json(attendee);
  } catch (error) {
    console.error('참석 상태 업데이트 오류:', error);
    res.status(500).json({ error: '참석 상태 업데이트 중 오류가 발생했습니다.' });
  }
});

// 모임 참석자 목록 조회
router.get('/meetings/:meetingId/attendance', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const attendees = await studyGroupService.getMeetingAttendees(meetingId);
    res.json(attendees);
  } catch (error) {
    console.error('참석자 목록 조회 오류:', error);
    res.status(500).json({ error: '참석자 목록 조회 중 오류가 발생했습니다.' });
  }
});

// 카테고리 목록 조회
router.get('/categories', async (req, res) => {
  try {
    const categories = await studyGroupService.getCategories();
    res.json(categories);
  } catch (error) {
    console.error('카테고리 목록 조회 오류:', error);
    res.status(500).json({ error: '카테고리 조회 중 오류가 발생했습니다.' });
  }
});

export { router as studyGroupRouter };
