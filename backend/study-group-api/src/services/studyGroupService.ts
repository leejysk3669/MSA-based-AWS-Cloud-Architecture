import { v4 as uuidv4 } from 'uuid';

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

export class StudyGroupService {
  private studyGroups: StudyGroup[] = [];
  private meetings: Meeting[] = [];

  constructor() {
    this.initializeDemoData();
  }

  async getStudyGroups(category: string = 'all', page: number = 1, limit: number = 20): Promise<StudyGroup[]> {
    let filteredGroups = this.studyGroups.filter(group => group.isActive);

    if (category !== 'all') {
      filteredGroups = filteredGroups.filter(group => group.category === category);
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return filteredGroups
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(startIndex, endIndex);
  }

  async getStudyGroupById(id: string): Promise<StudyGroup | null> {
    return this.studyGroups.find(group => group.id === id && group.isActive) || null;
  }

  async createStudyGroup(groupData: CreateStudyGroupRequest): Promise<StudyGroup> {
    const now = new Date().toISOString();
    const group: StudyGroup = {
      id: uuidv4(),
      ...groupData,
      currentMembers: 1,
      members: [{
        userId: groupData.leader,
        userName: groupData.leader,
        joinedAt: now,
        role: 'leader'
      }],
      createdAt: now,
      updatedAt: now,
      isActive: true
    };

    this.studyGroups.push(group);
    return group;
  }

  async updateStudyGroup(id: string, updateData: UpdateStudyGroupRequest): Promise<StudyGroup | null> {
    const groupIndex = this.studyGroups.findIndex(g => g.id === id);
    if (groupIndex === -1) return null;

    this.studyGroups[groupIndex] = {
      ...this.studyGroups[groupIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    return this.studyGroups[groupIndex];
  }

  async deleteStudyGroup(id: string): Promise<boolean> {
    const groupIndex = this.studyGroups.findIndex(g => g.id === id);
    if (groupIndex === -1) return false;

    this.studyGroups[groupIndex].isActive = false;
    this.studyGroups[groupIndex].updatedAt = new Date().toISOString();
    
    return true;
  }

  async joinStudyGroup(groupId: string, joinData: JoinRequest): Promise<JoinResult> {
    const group = this.studyGroups.find(g => g.id === groupId && g.isActive);
    if (!group) {
      return { success: false, message: '스터디 그룹을 찾을 수 없습니다.' };
    }

    if (group.currentMembers >= group.maxMembers) {
      return { success: false, message: '스터디 그룹이 가득 찼습니다.' };
    }

    const isAlreadyMember = group.members.some(member => member.userId === joinData.userId);
    if (isAlreadyMember) {
      return { success: false, message: '이미 가입된 멤버입니다.' };
    }

    const newMember: GroupMember = {
      userId: joinData.userId,
      userName: joinData.userName,
      joinedAt: new Date().toISOString(),
      role: 'member'
    };

    group.members.push(newMember);
    group.currentMembers++;
    group.updatedAt = new Date().toISOString();

    return { success: true, message: '스터디 그룹에 가입되었습니다.', group };
  }

  async leaveStudyGroup(groupId: string, userId: string): Promise<JoinResult> {
    const group = this.studyGroups.find(g => g.id === groupId && g.isActive);
    if (!group) {
      return { success: false, message: '스터디 그룹을 찾을 수 없습니다.' };
    }

    const memberIndex = group.members.findIndex(member => member.userId === userId);
    if (memberIndex === -1) {
      return { success: false, message: '스터디 그룹 멤버가 아닙니다.' };
    }

    if (group.members[memberIndex].role === 'leader') {
      return { success: false, message: '스터디장은 탈퇴할 수 없습니다.' };
    }

    group.members.splice(memberIndex, 1);
    group.currentMembers--;
    group.updatedAt = new Date().toISOString();

    return { success: true, message: '스터디 그룹에서 탈퇴되었습니다.', group };
  }

  async getMeetings(groupId: string): Promise<Meeting[]> {
    return this.meetings
      .filter(meeting => meeting.groupId === groupId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  async createMeeting(groupId: string, meetingData: CreateMeetingRequest): Promise<Meeting> {
    const meeting: Meeting = {
      id: uuidv4(),
      groupId,
      ...meetingData,
      createdAt: new Date().toISOString(),
      attendees: []
    };

    this.meetings.push(meeting);
    return meeting;
  }

  async updateMeeting(meetingId: string, meetingData: UpdateMeetingRequest): Promise<Meeting | null> {
    const meetingIndex = this.meetings.findIndex(meeting => meeting.id === meetingId);
    if (meetingIndex === -1) {
      return null;
    }

    this.meetings[meetingIndex] = {
      ...this.meetings[meetingIndex],
      ...meetingData
    };

    return this.meetings[meetingIndex];
  }

  async deleteMeeting(meetingId: string): Promise<boolean> {
    const meetingIndex = this.meetings.findIndex(meeting => meeting.id === meetingId);
    if (meetingIndex === -1) {
      return false;
    }

    this.meetings.splice(meetingIndex, 1);
    return true;
  }

  async updateMeetingAttendance(meetingId: string, attendanceData: UpdateAttendanceRequest): Promise<MeetingAttendee | null> {
    const meeting = this.meetings.find(meeting => meeting.id === meetingId);
    if (!meeting) {
      return null;
    }

    // 기존 참석자 정보를 찾거나 새로 생성
    const attendee: MeetingAttendee = {
      userId: attendanceData.userId,
      userName: attendanceData.userName,
      status: attendanceData.status,
      updatedAt: new Date().toISOString()
    };

    // attendees 배열을 업데이트 (실제로는 별도 테이블이지만 여기서는 간단히 처리)
    const existingIndex = meeting.attendees.indexOf(attendanceData.userId);
    if (existingIndex !== -1) {
      meeting.attendees[existingIndex] = attendanceData.userId;
    } else {
      meeting.attendees.push(attendanceData.userId);
    }

    return attendee;
  }

  async getMeetingAttendees(meetingId: string): Promise<MeetingAttendee[]> {
    const meeting = this.meetings.find(meeting => meeting.id === meetingId);
    if (!meeting) {
      return [];
    }

    // 데모 데이터로 참석자 정보 반환
    return meeting.attendees.map((userId, index) => ({
      userId,
      userName: `사용자${index + 1}`,
      status: index % 3 === 0 ? 'attending' : index % 3 === 1 ? 'not_attending' : 'maybe',
      updatedAt: new Date(Date.now() - index * 3600000).toISOString()
    }));
  }

  async getCategories(): Promise<string[]> {
    return ['프로그래밍', '자격증', '언어', '취업준비', '프로젝트', '기타'];
  }

  // 멤버 추방 (그룹장만 가능)
  async kickMember(groupId: string, memberId: string): Promise<JoinResult> {
    try {
      const group = this.studyGroups.find(g => g.id === groupId);
      if (!group) {
        return { success: false, message: '스터디 그룹을 찾을 수 없습니다.' };
      }

      const member = group.members.find(m => m.userId === memberId);
      if (!member) {
        return { success: false, message: '멤버를 찾을 수 없습니다.' };
      }

      // 그룹장은 추방할 수 없음
      if (member.role === 'leader') {
        return { success: false, message: '그룹장은 추방할 수 없습니다.' };
      }

      // 멤버 제거
      group.members = group.members.filter(m => m.userId !== memberId);
      group.currentMembers = group.members.length;

      return { 
        success: true, 
        message: `${member.userName}님이 추방되었습니다.` 
      };
    } catch (error) {
      console.error('멤버 추방 오류:', error);
      return { success: false, message: '멤버 추방 중 오류가 발생했습니다.' };
    }
  }

  private initializeDemoData(): void {
    const demoGroups: StudyGroup[] = [
      {
        id: '1',
        name: 'React 스터디 그룹',
        description: 'React와 관련 기술들을 함께 공부하는 스터디 그룹입니다.',
        category: '프로그래밍',
        leader: 'React마스터',
        maxMembers: 8,
        currentMembers: 5,
        members: [
          { userId: 'React마스터', userName: 'React마스터', joinedAt: new Date(Date.now() - 86400000).toISOString(), role: 'leader' },
          { userId: 'user1', userName: '프론트엔드개발자', joinedAt: new Date(Date.now() - 82800000).toISOString(), role: 'member' },
          { userId: 'user2', userName: '웹개발자지망생', joinedAt: new Date(Date.now() - 79200000).toISOString(), role: 'member' }
        ],
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
        isActive: true
      },
      {
        id: '2',
        name: '정보처리기사 준비반',
        description: '정보처리기사 자격증 취득을 위한 스터디 그룹입니다.',
        category: '자격증',
        leader: '자격증전문가',
        maxMembers: 10,
        currentMembers: 7,
        members: [
          { userId: '자격증전문가', userName: '자격증전문가', joinedAt: new Date(Date.now() - 172800000).toISOString(), role: 'leader' },
          { userId: 'user3', userName: '취업준비생1', joinedAt: new Date(Date.now() - 169200000).toISOString(), role: 'member' },
          { userId: 'user4', userName: '취업준비생2', joinedAt: new Date(Date.now() - 165600000).toISOString(), role: 'member' }
        ],
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        updatedAt: new Date(Date.now() - 172800000).toISOString(),
        isActive: true
      },
      {
        id: '3',
        name: 'Node.js 백엔드 스터디',
        description: 'Node.js와 Express를 이용한 백엔드 개발을 학습하는 그룹입니다.',
        category: '프로그래밍',
        leader: '백엔드개발자',
        maxMembers: 6,
        currentMembers: 4,
        members: [
          { userId: '백엔드개발자', userName: '백엔드개발자', joinedAt: new Date(Date.now() - 259200000).toISOString(), role: 'leader' },
          { userId: 'user5', userName: '서버개발지망생', joinedAt: new Date(Date.now() - 255600000).toISOString(), role: 'member' }
        ],
        createdAt: new Date(Date.now() - 259200000).toISOString(),
        updatedAt: new Date(Date.now() - 259200000).toISOString(),
        isActive: true
      }
    ];

    const demoMeetings: Meeting[] = [
      {
        id: '1',
        groupId: '1',
        title: 'React Hooks 심화 학습',
        description: 'useEffect, useCallback, useMemo 등 고급 Hooks에 대해 학습합니다.',
        date: new Date(Date.now() + 86400000).toISOString(),
        location: '온라인 (Zoom)',
        createdAt: new Date(Date.now() - 43200000).toISOString(),
        attendees: ['React마스터', '프론트엔드개발자', '웹개발자지망생']
      },
      {
        id: '2',
        groupId: '2',
        title: '정보처리기사 실기 연습',
        description: '실기 시험 대비 문제 풀이 및 토론',
        date: new Date(Date.now() + 172800000).toISOString(),
        location: '서울 강남구 스터디룸',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        attendees: ['자격증전문가', '취업준비생1', '취업준비생2']
      }
    ];

    this.studyGroups = demoGroups;
    this.meetings = demoMeetings;
  }
}
