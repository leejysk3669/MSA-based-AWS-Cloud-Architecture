import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { notificationService } from './notificationService';

export interface StudyGroup {
  id: string;
  name: string;
  description: string;
  category: string;
  leader: string;
  maxMembers: number;
  currentMembers: number;
  members: GroupMember[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface GroupMember {
  userId: string;
  userName: string;
  joinedAt: string;
  role: 'leader' | 'member';
}

export interface Meeting {
  id: string;
  groupId: string;
  title: string;
  description?: string;
  date: string;
  location?: string;
  createdAt: string;
  attendees: string[];
}

export interface MeetingAttendee {
  userId: string;
  userName: string;
  status: 'attending' | 'not_attending' | 'maybe';
  updatedAt: string;
}

export interface UpdateAttendanceRequest {
  userId: string;
  userName: string;
  status: 'attending' | 'not_attending' | 'maybe';
}

export interface CreateStudyGroupRequest {
  name: string;
  description: string;
  category: string;
  maxMembers: number;
  leader: string;
  leaderName?: string; // 사용자 이름 추가
}

export interface UpdateStudyGroupRequest {
  name?: string;
  description?: string;
  maxMembers?: number;
}

export interface JoinRequest {
  userId: string;
  userName: string;
}

export interface CreateMeetingRequest {
  title: string;
  description?: string;
  date: string;
  location?: string;
}

export interface UpdateMeetingRequest {
  title?: string;
  description?: string;
  date?: string;
  location?: string;
}

export interface JoinResult {
  success: boolean;
  message: string;
  group?: StudyGroup;
}

export class PostgresStudyGroupService {
  private pool: Pool;

  constructor() {
    this.pool = pool;
  }

  // 스터디 그룹 목록 조회 (페이지네이션 정보 포함)
  async getStudyGroupsWithPagination(category: string = 'all', page: number = 1, limit: number = 20): Promise<{ groups: StudyGroup[], total: number, totalPages: number }> {
    try {
      // 전체 개수 조회
      let countQuery = `
        SELECT COUNT(*) as total
        FROM study.study_groups sg
        WHERE sg.is_active = true
      `;
      
      const countParams: any[] = [];
      
      if (category !== 'all') {
        countQuery += ` AND sg.category = $${countParams.length + 1}`;
        countParams.push(category);
      }
      
      const countResult = await this.pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].total);
      
      // 페이지네이션된 데이터 조회
      let query = `
        SELECT 
          sg.id,
          sg.name,
          sg.description,
          sg.category,
          sg.leader,
          sg.max_members as "maxMembers",
          sg.current_members as "currentMembers",
          sg.is_active as "isActive",
          sg.created_at as "createdAt",
          sg.updated_at as "updatedAt"
        FROM study.study_groups sg
        WHERE sg.is_active = true
      `;
      
      const params: any[] = [];
      
      if (category !== 'all') {
        query += ` AND sg.category = $${params.length + 1}`;
        params.push(category);
      }
      
      query += ` ORDER BY sg.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, (page - 1) * limit);

      const result = await this.pool.query(query, params);
      
      // 각 그룹의 멤버 정보 조회
      const groupsWithMembers = await Promise.all(
        result.rows.map(async (row) => {
          const members = await this.getGroupMembers(row.id);
          
          // 그룹장의 이름을 멤버 목록에서 찾기
          const leaderMember = members.find(member => member.role === 'leader');
          const leaderName = leaderMember ? leaderMember.userName : row.leader;
          
          console.log('🔍 스터디 그룹 목록 조회 (페이지네이션) 디버그:');
          console.log('- 그룹 ID:', row.id);
          console.log('- 그룹명:', row.name);
          console.log('- 원본 leader:', row.leader);
          console.log('- 멤버 목록:', members);
          console.log('- 그룹장 멤버:', leaderMember);
          console.log('- 최종 leaderName:', leaderName);
          
          return {
            ...row,
            leader: leaderName, // 그룹장 이름으로 교체
            members
          };
        })
      );

      return {
        groups: groupsWithMembers,
        total,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('스터디 그룹 목록 조회 오류:', error);
      throw error;
    }
  }

  // 스터디 그룹 목록 조회 (기존 메서드 - 호환성 유지)
  async getStudyGroups(category: string = 'all', page: number = 1, limit: number = 20): Promise<StudyGroup[]> {
    try {
      let query = `
        SELECT 
          sg.id,
          sg.name,
          sg.description,
          sg.category,
          sg.leader,
          sg.max_members as "maxMembers",
          sg.current_members as "currentMembers",
          sg.is_active as "isActive",
          sg.created_at as "createdAt",
          sg.updated_at as "updatedAt"
        FROM study.study_groups sg
        WHERE sg.is_active = true
      `;
      
      const params: any[] = [];
      
      if (category !== 'all') {
        query += ` AND sg.category = $${params.length + 1}`;
        params.push(category);
      }
      
      query += ` ORDER BY sg.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, (page - 1) * limit);

      const result = await this.pool.query(query, params);
      
      // 각 그룹의 멤버 정보 조회
      const groupsWithMembers = await Promise.all(
        result.rows.map(async (row) => {
          const members = await this.getGroupMembers(row.id);
          
          // 그룹장의 이름을 멤버 목록에서 찾기
          const leaderMember = members.find(member => member.role === 'leader');
          const leaderName = leaderMember ? leaderMember.userName : row.leader;
          
          console.log('🔍 스터디 그룹 목록 조회 디버그:');
          console.log('- 그룹 ID:', row.id);
          console.log('- 그룹명:', row.name);
          console.log('- 원본 leader:', row.leader);
          console.log('- 멤버 목록:', members);
          console.log('- 그룹장 멤버:', leaderMember);
          console.log('- 최종 leaderName:', leaderName);
          
          return {
            ...row,
            leader: leaderName, // 그룹장 이름으로 교체
            members
          };
        })
      );

      return groupsWithMembers;
    } catch (error) {
      console.error('스터디 그룹 목록 조회 오류:', error);
      throw error;
    }
  }

  // 스터디 그룹 상세 조회
  async getStudyGroupById(id: string): Promise<StudyGroup | null> {
    try {
      const query = `
        SELECT 
          sg.id,
          sg.name,
          sg.description,
          sg.category,
          sg.leader,
          sg.max_members as "maxMembers",
          sg.current_members as "currentMembers",
          sg.is_active as "isActive",
          sg.created_at as "createdAt",
          sg.updated_at as "updatedAt"
        FROM study.study_groups sg
        WHERE sg.id = $1 AND sg.is_active = true
      `;
      
      const result = await this.pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const group = result.rows[0];
      const members = await this.getGroupMembers(id);
      
      // 그룹장의 이름을 멤버 목록에서 찾기
      const leaderMember = members.find(member => member.role === 'leader');
      const leaderName = leaderMember ? leaderMember.userName : group.leader;
      
      console.log('🔍 스터디 그룹 상세 조회 디버그:');
      console.log('- 그룹 ID:', id);
      console.log('- 원본 leader:', group.leader);
      console.log('- 멤버 목록:', members);
      console.log('- 그룹장 멤버:', leaderMember);
      console.log('- 최종 leaderName:', leaderName);
      
      return {
        ...group,
        leader: leaderName, // 그룹장 이름으로 교체
        members
      };
    } catch (error) {
      console.error('스터디 그룹 상세 조회 오류:', error);
      throw error;
    }
  }

  // 스터디 그룹 생성
  async createStudyGroup(data: CreateStudyGroupRequest): Promise<StudyGroup> {
    try {
      const id = uuidv4();
      const query = `
        INSERT INTO study.study_groups (id, name, description, category, leader, max_members)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      
      const result = await this.pool.query(query, [
        id,
        data.name,
        data.description,
        data.category,
        data.leader,
        data.maxMembers
      ]);

      // 그룹장을 멤버로 추가
      await this.addGroupMember(id, {
        userId: data.leader,
        userName: data.leaderName || data.leader, // 사용자 이름이 있으면 사용, 없으면 ID 사용
        role: 'leader'
      });

      // 현재 멤버 수 업데이트
      await this.updateCurrentMembers(id);

      return this.getStudyGroupById(id) as Promise<StudyGroup>;
    } catch (error) {
      console.error('스터디 그룹 생성 오류:', error);
      throw error;
    }
  }

  // 스터디 그룹 수정
  async updateStudyGroup(id: string, data: UpdateStudyGroupRequest): Promise<StudyGroup | null> {
    try {
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (data.name) {
        updateFields.push(`name = $${paramIndex++}`);
        values.push(data.name);
      }
      if (data.description) {
        updateFields.push(`description = $${paramIndex++}`);
        values.push(data.description);
      }
      if (data.maxMembers) {
        updateFields.push(`max_members = $${paramIndex++}`);
        values.push(data.maxMembers);
      }

      if (updateFields.length === 0) {
        return this.getStudyGroupById(id);
      }

      values.push(id);
      const query = `
        UPDATE study.study_groups 
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await this.pool.query(query, values);
      
      if (result.rows.length === 0) {
        return null;
      }

      return this.getStudyGroupById(id);
    } catch (error) {
      console.error('스터디 그룹 수정 오류:', error);
      throw error;
    }
  }

  // 스터디 그룹 삭제
  async deleteStudyGroup(id: string): Promise<boolean> {
    try {
      const query = `
        UPDATE study.study_groups 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `;
      
      const result = await this.pool.query(query, [id]);
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error('스터디 그룹 삭제 오류:', error);
      throw error;
    }
  }

  // 스터디 그룹 가입
  async joinStudyGroup(groupId: string, data: JoinRequest): Promise<JoinResult> {
    try {
      // 그룹 존재 여부 확인
      const group = await this.getStudyGroupById(groupId);
      if (!group) {
        return { success: false, message: '스터디 그룹을 찾을 수 없습니다.' };
      }

      // 이미 가입된 멤버인지 확인
      const existingMember = group.members.find(m => m.userId === data.userId);
      if (existingMember) {
        return { success: false, message: '이미 가입된 멤버입니다.' };
      }

      // 최대 인원 확인
      if (group.currentMembers >= group.maxMembers) {
        return { success: false, message: '최대 인원에 도달했습니다.' };
      }

      // 멤버 추가
      await this.addGroupMember(groupId, {
        userId: data.userId,
        userName: data.userName,
        role: 'member'
      });

      // 현재 멤버 수 업데이트
      await this.updateCurrentMembers(groupId);

      // 그룹장에게 멤버 가입 알림 발송
      try {
        // 그룹장의 실제 이름과 userId 찾기
        const leaderMember = group.members.find(member => member.role === 'leader');
        const leaderName = leaderMember ? leaderMember.userName : group.leader;
        const leaderUserId = leaderMember ? leaderMember.userId : group.leader;
        
        console.log('🔔 멤버 가입 알림 발송 시작:', {
          groupId,
          groupName: group.name,
          leaderId: group.leader,
          leaderName,
          leaderUserId,
          newMemberName: data.userName
        });
        
        await notificationService.sendMemberJoinNotification(
          groupId,
          group.name,
          leaderUserId, // 그룹장의 실제 userId (UUID)
          data.userName // 새 멤버의 사용자 이름
        );
        
        console.log('✅ 멤버 가입 알림 발송 완료');
      } catch (notificationError) {
        console.error('❌ 멤버 가입 알림 발송 실패:', notificationError);
        // 알림 실패해도 가입은 성공으로 처리
      }

      const updatedGroup = await this.getStudyGroupById(groupId);
      return {
        success: true,
        message: '스터디 그룹에 가입되었습니다.',
        group: updatedGroup as StudyGroup
      };
    } catch (error) {
      console.error('스터디 그룹 가입 오류:', error);
      throw error;
    }
  }

  // 스터디 그룹 탈퇴
  async leaveStudyGroup(groupId: string, userId: string): Promise<JoinResult> {
    try {
      // 그룹 존재 여부 확인
      const group = await this.getStudyGroupById(groupId);
      if (!group) {
        return { success: false, message: '스터디 그룹을 찾을 수 없습니다.' };
      }

      // 그룹장은 탈퇴할 수 없음
      if (group.leader === userId) {
        return { success: false, message: '그룹장은 탈퇴할 수 없습니다.' };
      }

      // 멤버 제거
      const query = `
        DELETE FROM study.group_members 
        WHERE group_id = $1 AND user_id = $2
      `;
      
      const result = await this.pool.query(query, [groupId, userId]);
      
      if (result.rowCount === 0) {
        return { success: false, message: '가입되지 않은 멤버입니다.' };
      }

      // 현재 멤버 수 업데이트
      await this.updateCurrentMembers(groupId);

      // 탈퇴하는 멤버 정보 가져오기
      const leavingMember = group.members.find(m => m.userId === userId);
      
      // 그룹장에게 멤버 탈퇴 알림 발송
      try {
        // 그룹장의 실제 이름과 userId 찾기
        const leaderMember = group.members.find(member => member.role === 'leader');
        const leaderName = leaderMember ? leaderMember.userName : group.leader;
        const leaderUserId = leaderMember ? leaderMember.userId : group.leader;
        
        await notificationService.sendMemberLeaveNotification(
          groupId,
          group.name,
          leaderUserId, // 그룹장의 실제 userId (UUID)
          leavingMember?.userName || '알 수 없는 사용자'
        );
      } catch (notificationError) {
        console.error('멤버 탈퇴 알림 발송 실패:', notificationError);
        // 알림 실패해도 탈퇴는 성공으로 처리
      }

      const updatedGroup = await this.getStudyGroupById(groupId);
      return {
        success: true,
        message: '스터디 그룹에서 탈퇴되었습니다.',
        group: updatedGroup as StudyGroup
      };
    } catch (error) {
      console.error('스터디 그룹 탈퇴 오류:', error);
      throw error;
    }
  }

  // 그룹 멤버 조회
  private async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    try {
      const query = `
        SELECT 
          user_id as "userId",
          user_name as "userName",
          joined_at as "joinedAt",
          role
        FROM study.group_members 
        WHERE group_id = $1
        ORDER BY joined_at ASC
      `;
      
      const result = await this.pool.query(query, [groupId]);
      return result.rows;
    } catch (error) {
      console.error('그룹 멤버 조회 오류:', error);
      throw error;
    }
  }

  // 그룹 멤버 추가
  private async addGroupMember(groupId: string, member: { userId: string; userName: string; role: string }): Promise<void> {
    try {
      const query = `
        INSERT INTO study.group_members (id, group_id, user_id, user_name, role)
        VALUES ($1, $2, $3, $4, $5)
      `;
      
      await this.pool.query(query, [
        uuidv4(),
        groupId,
        member.userId,
        member.userName,
        member.role
      ]);
    } catch (error) {
      console.error('그룹 멤버 추가 오류:', error);
      throw error;
    }
  }

  // 현재 멤버 수 업데이트
  private async updateCurrentMembers(groupId: string): Promise<void> {
    try {
      const query = `
        UPDATE study.study_groups 
        SET current_members = (
          SELECT COUNT(*) FROM study.group_members WHERE group_id = $1
        )
        WHERE id = $1
      `;
      
      await this.pool.query(query, [groupId]);
    } catch (error) {
      console.error('현재 멤버 수 업데이트 오류:', error);
      throw error;
    }
  }

  // 카테고리 목록 조회
  async getCategories(): Promise<string[]> {
    try {
      const query = `
        SELECT DISTINCT category 
        FROM study.study_groups 
        WHERE is_active = true 
        ORDER BY category
      `;
      
      const result = await this.pool.query(query);
      return result.rows.map(row => row.category);
    } catch (error) {
      console.error('카테고리 목록 조회 오류:', error);
      throw error;
    }
  }

  // 모임 일정 조회
  async getMeetings(groupId: string): Promise<Meeting[]> {
    try {
      const query = `
        SELECT 
          id,
          group_id as "groupId",
          title,
          description,
          date,
          location,
          created_at as "createdAt"
        FROM study.meetings 
        WHERE group_id = $1
        ORDER BY date ASC
      `;
      
      const result = await this.pool.query(query, [groupId]);
      
      // 각 모임의 출석자 목록 조회
      const meetingsWithAttendees = await Promise.all(
        result.rows.map(async (row) => {
          const attendees = await this.getMeetingAttendees(row.id);
          return {
            ...row,
            attendees: attendees.map(a => a.userId)
          };
        })
      );

      return meetingsWithAttendees;
    } catch (error) {
      console.error('모임 일정 조회 오류:', error);
      throw error;
    }
  }

  // 모임 일정 생성
  async createMeeting(groupId: string, data: CreateMeetingRequest): Promise<Meeting> {
    try {
      const id = uuidv4();
      const query = `
        INSERT INTO study.meetings (id, group_id, title, description, date, location)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      
      const result = await this.pool.query(query, [
        id,
        groupId,
        data.title,
        data.description,
        data.date,
        data.location
      ]);

      const meeting = {
        id,
        groupId,
        title: data.title,
        description: data.description,
        date: data.date,
        location: data.location,
        createdAt: result.rows[0].created_at,
        attendees: []
      };

      // 그룹 정보 가져오기
      const group = await this.getStudyGroupById(groupId);
      if (group) {
        // 그룹 전체에 모임 생성 알림 발송
        try {
          const memberIds = group.members.map(m => m.userId);
          await notificationService.sendMeetingCreatedNotification(
            groupId,
            group.name,
            data.title,
            memberIds
          );
        } catch (notificationError) {
          console.error('모임 생성 알림 발송 실패:', notificationError);
          // 알림 실패해도 모임 생성은 성공으로 처리
        }
      }

      return meeting;
    } catch (error) {
      console.error('모임 일정 생성 오류:', error);
      throw error;
    }
  }

  // 모임 일정 수정
  async updateMeeting(meetingId: string, data: UpdateMeetingRequest): Promise<Meeting | null> {
    try {
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (data.title) {
        updateFields.push(`title = $${paramIndex++}`);
        values.push(data.title);
      }
      if (data.description !== undefined) {
        updateFields.push(`description = $${paramIndex++}`);
        values.push(data.description);
      }
      if (data.date) {
        updateFields.push(`date = $${paramIndex++}`);
        values.push(data.date);
      }
      if (data.location !== undefined) {
        updateFields.push(`location = $${paramIndex++}`);
        values.push(data.location);
      }

      if (updateFields.length === 0) {
        return null;
      }

      values.push(meetingId);
      const query = `
        UPDATE meetings 
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await this.pool.query(query, values);
      
      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      const attendees = await this.getMeetingAttendees(meetingId);
      
      return {
        id: row.id,
        groupId: row.group_id,
        title: row.title,
        description: row.description,
        date: row.date,
        location: row.location,
        createdAt: row.created_at,
        attendees: attendees.map(a => a.userId)
      };
    } catch (error) {
      console.error('모임 일정 수정 오류:', error);
      throw error;
    }
  }

  // 모임 일정 삭제
  async deleteMeeting(meetingId: string): Promise<boolean> {
    try {
      const query = `DELETE FROM study.meetings WHERE id = $1`;
      const result = await this.pool.query(query, [meetingId]);
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error('모임 일정 삭제 오류:', error);
      throw error;
    }
  }

  // 출석 상태 업데이트
  async updateMeetingAttendance(meetingId: string, data: UpdateAttendanceRequest): Promise<MeetingAttendee> {
    try {
      const id = uuidv4();
      const query = `
        INSERT INTO meeting_attendees (id, meeting_id, user_id, user_name, status)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (meeting_id, user_id) 
        DO UPDATE SET 
          status = EXCLUDED.status,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `;
      
      const result = await this.pool.query(query, [
        id,
        meetingId,
        data.userId,
        data.userName,
        data.status
      ]);

      return {
        userId: result.rows[0].user_id,
        userName: result.rows[0].user_name,
        status: result.rows[0].status,
        updatedAt: result.rows[0].updated_at
      };
    } catch (error) {
      console.error('출석 상태 업데이트 오류:', error);
      throw error;
    }
  }

  // 모임 출석자 조회
  async getMeetingAttendees(meetingId: string): Promise<MeetingAttendee[]> {
    try {
      const query = `
        SELECT 
          user_id as "userId",
          user_name as "userName",
          status,
          updated_at as "updatedAt"
        FROM meeting_attendees 
        WHERE meeting_id = $1
        ORDER BY updated_at DESC
      `;
      
      const result = await this.pool.query(query, [meetingId]);
      return result.rows;
    } catch (error) {
      console.error('모임 출석자 조회 오류:', error);
      throw error;
    }
  }

  // 멤버 추방 (그룹장만 가능)
  async kickMember(groupId: string, memberId: string): Promise<JoinResult> {
    try {
      // 그룹 정보 조회
      const groupQuery = `
        SELECT leader FROM study.study_groups WHERE id = $1
      `;
      const groupResult = await this.pool.query(groupQuery, [groupId]);
      
      if (groupResult.rows.length === 0) {
        return { success: false, message: '스터디 그룹을 찾을 수 없습니다.' };
      }

      const group = groupResult.rows[0];
      
      // 멤버 정보 조회
      const memberQuery = `
        SELECT user_id, user_name, role FROM study.group_members 
        WHERE group_id = $1 AND user_id = $2
      `;
      const memberResult = await this.pool.query(memberQuery, [groupId, memberId]);
      
      if (memberResult.rows.length === 0) {
        return { success: false, message: '멤버를 찾을 수 없습니다.' };
      }

      const member = memberResult.rows[0];
      
      // 그룹장은 추방할 수 없음
      if (member.role === 'leader') {
        return { success: false, message: '그룹장은 추방할 수 없습니다.' };
      }

      // 멤버 추방 (삭제)
      const deleteQuery = `
        DELETE FROM study.group_members 
        WHERE group_id = $1 AND user_id = $2
      `;
      const deleteResult = await this.pool.query(deleteQuery, [groupId, memberId]);
      
      if (deleteResult.rowCount === 0) {
        return { success: false, message: '멤버 추방에 실패했습니다.' };
      }

      // 그룹의 현재 멤버 수 업데이트
      const updateQuery = `
        UPDATE study.study_groups 
        SET current_members = current_members - 1
        WHERE id = $1
      `;
      await this.pool.query(updateQuery, [groupId]);

      return { 
        success: true, 
        message: `${member.user_name}님이 추방되었습니다.` 
      };
    } catch (error) {
      console.error('멤버 추방 오류:', error);
      return { success: false, message: '멤버 추방 중 오류가 발생했습니다.' };
    }
  }

  // 사용자별 스터디 그룹 조회 (만든 스터디)
  async getUserStudyGroups(userId: string, page: number = 1, limit: number = 10): Promise<{ groups: StudyGroup[], pagination: any }> {
    try {
      const offset = (page - 1) * limit;

      // 사용자가 만든 스터디 그룹 조회 (그룹장인 경우) - 삭제된 그룹 제외
      const query = `
        SELECT 
          sg.id,
          sg.name,
          sg.description,
          sg.category,
          sg.leader,
          sg.max_members as "maxMembers",
          sg.current_members as "currentMembers",
          sg.created_at as "createdAt",
          sg.updated_at as "updatedAt",
          sg.is_active as "isActive"
        FROM study.study_groups sg
        WHERE sg.leader = $1 
          AND sg.is_active = true
        ORDER BY sg.created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await this.pool.query(query, [userId, limit, offset]);
      
      // 총 개수 조회 - 삭제된 그룹 제외
      const countQuery = `
        SELECT COUNT(*) as total FROM study.study_groups 
        WHERE leader = $1 
          AND is_active = true
      `;
      const countResult = await this.pool.query(countQuery, [userId]);
      const totalGroups = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(totalGroups / limit);

      // 멤버 정보 조회
      const groups = await Promise.all(result.rows.map(async (group) => {
        const membersQuery = `
          SELECT 
            user_id as "userId",
            user_name as "userName",
            joined_at as "joinedAt",
            role
          FROM group_members 
          WHERE group_id = $1
          ORDER BY joined_at ASC
        `;
        const membersResult = await this.pool.query(membersQuery, [group.id]);
        
        return {
          ...group,
          members: membersResult.rows
        };
      }));

      return {
        groups,
        pagination: {
          currentPage: page,
          totalPages,
          totalGroups,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('사용자별 스터디 그룹 조회 오류:', error);
      throw error;
    }
  }

        // 사용자가 참여하고 있는 스터디 그룹 조회
  async getUserParticipatingGroups(userId: string, page: number = 1, limit: number = 10): Promise<{ groups: StudyGroup[], pagination: any }> {
    try {
      const offset = (page - 1) * limit;

      // 사용자가 참여하고 있는 스터디 그룹 조회 (멤버인 경우) - 삭제된 그룹 제외
      const query = `
        SELECT 
          sg.id,
          sg.name,
          sg.description,
          sg.category,
          sg.leader,
          sg.max_members as "maxMembers",
          sg.current_members as "currentMembers",
          sg.created_at as "createdAt",
          sg.updated_at as "updatedAt",
          sg.is_active as "isActive"
        FROM study.study_groups sg
        INNER JOIN study.group_members gm ON sg.id = gm.group_id
        WHERE gm.user_id = $1 
          AND sg.leader != $1
          AND sg.is_active = true
        ORDER BY gm.joined_at DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await this.pool.query(query, [userId, limit, offset]);
      
      // 총 개수 조회 - 삭제된 그룹 제외
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM study.study_groups sg
        INNER JOIN study.group_members gm ON sg.id = gm.group_id
        WHERE gm.user_id = $1 
          AND sg.leader != $1
          AND sg.is_active = true
      `;
      const countResult = await this.pool.query(countQuery, [userId]);
      const totalGroups = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(totalGroups / limit);

      // 멤버 정보 조회
      const groups = await Promise.all(result.rows.map(async (group) => {
        const membersQuery = `
          SELECT 
            user_id as "userId",
            user_name as "userName",
            joined_at as "joinedAt",
            role
          FROM study.group_members 
          WHERE group_id = $1
          ORDER BY joined_at ASC
        `;
        const membersResult = await this.pool.query(membersQuery, [group.id]);
        
        return {
          ...group,
          members: membersResult.rows
        };
      }));

      return {
        groups,
        pagination: {
          currentPage: page,
          totalPages,
          totalGroups,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('사용자 참여 스터디 그룹 조회 오류:', error);
      throw error;
    }
  }
}
