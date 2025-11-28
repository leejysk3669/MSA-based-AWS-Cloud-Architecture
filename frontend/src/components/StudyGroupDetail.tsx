import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Users, Calendar, MapPin, User, Clock, Plus, Edit, Trash2, X } from 'lucide-react';
import { StudyGroup, Meeting, MeetingAttendee } from '../types';
import { studyGroupAPI } from '../services/api';
import MeetingCreateModal from './MeetingCreateModal';
import MeetingEditModal from './MeetingEditModal';
import MeetingDetailModal from './MeetingDetailModal';
import MeetingFilter, { TimeFilter, AttendanceFilter, SortOption } from './MeetingFilter';
import { filterAndSortMeetings } from '../utils/meetingFilters';
import StudyGroupEditModal from './StudyGroupEditModal';
import { notificationService } from '../services/notificationService';
import { useAuth } from '../contexts/AuthContext';
import { getUserDisplayName } from '../utils/userDisplayName';


interface StudyGroupDetailProps {
  groupId: string;
  onBack: () => void;
  currentUserId?: string;
}

const StudyGroupDetail: React.FC<StudyGroupDetailProps> = ({
  groupId,
  onBack,
  currentUserId
}) => {
  const { user } = useAuth();
  const [group, setGroup] = useState<StudyGroup | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'members' | 'meetings'>('info');
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // 필터 상태
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [attendanceFilter, setAttendanceFilter] = useState<AttendanceFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date_asc');
  const [attendeesMap, setAttendeesMap] = useState<Map<string, MeetingAttendee[]>>(new Map());

  useEffect(() => {
    loadGroupDetail();
  }, [groupId]);

  // WebSocket 그룹 참여 처리




  const loadGroupDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [groupData, meetingsData] = await Promise.all([
        studyGroupAPI.getStudyGroupById(groupId),
        studyGroupAPI.getMeetings(groupId)
      ]);
      
      setGroup(groupData);
      setMeetings(meetingsData);
      
      // 참석자 정보 로드
      await loadAttendeesData(meetingsData);
    } catch (err) {
      console.error('스터디 그룹 상세 로드 오류:', err);
      setError('스터디 그룹 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadAttendeesData = async (meetingsData: Meeting[]) => {
    try {
      const attendeesPromises = meetingsData.map(async (meeting) => {
        const attendees = await studyGroupAPI.getMeetingAttendees(meeting.id);
        return { meetingId: meeting.id, attendees };
      });
      
      const attendeesResults = await Promise.all(attendeesPromises);
      const newAttendeesMap = new Map();
      
      attendeesResults.forEach(({ meetingId, attendees }) => {
        newAttendeesMap.set(meetingId, attendees);
      });
      
      setAttendeesMap(newAttendeesMap);
    } catch (err) {
      console.error('참석자 정보 로드 오류:', err);
    }
  };

  const handleMeetingSuccess = () => {
    loadGroupDetail(); // 일정 목록 새로고침
    alert('모임 일정이 성공적으로 생성되었습니다!');
  };

  const handleEditMeeting = (meeting: Meeting) => {
    console.log('✏️ 모임 수정 시작:', meeting);
    setSelectedMeeting(meeting);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    console.log('✅ 모임 수정 성공, 그룹 정보 새로고침 중...');
    loadGroupDetail();
    alert('모임 일정이 성공적으로 수정되었습니다!');
    
    // 그룹장에게 모임 변경 알림 전송
    if (group && currentUserId && currentUserId !== group.leader) {
      // 그룹장의 알림 서비스에 사용자 설정 (임시)
      const originalUserId = notificationService.getCurrentUser();
      notificationService.setCurrentUser(group.leader);
      
      notificationService.createStudyGroupNotification(
        group.leader,
        'meeting_change',
        group.id,
        group.name,
        '모임 일정이 수정되었습니다.'
      );
      
      // 원래 사용자로 복원
      if (originalUserId) {
        notificationService.setCurrentUser(originalUserId);
      }
    }
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    console.log('🗑️ 모임 삭제 시작:', meetingId);
    
    if (!confirm('정말로 이 모임 일정을 삭제하시겠습니까?')) {
      return;
    }

    try {
      console.log('🗑️ 모임 삭제 API 호출 중...');
      await studyGroupAPI.deleteMeeting(meetingId);
      console.log('✅ 모임 삭제 성공');
      loadGroupDetail();
      alert('모임 일정이 삭제되었습니다.');
    } catch (error) {
      console.error('❌ 모임 일정 삭제 오류:', error);
      alert('모임 일정 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleMeetingClick = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setShowDetailModal(true);
  };



  const handleAttendanceSuccess = () => {
    loadGroupDetail();
    alert('참석 상태가 업데이트되었습니다!');
    
    // 그룹장에게 참석 상태 변경 알림 전송
    if (group && currentUserId && currentUserId !== group.leader) {
      // 그룹장의 알림 서비스에 사용자 설정 (임시)
      const originalUserId = notificationService.getCurrentUser();
      notificationService.setCurrentUser(group.leader);
      
      notificationService.createStudyGroupNotification(
        group.leader,
        'attendance_update',
        group.id,
        group.name,
        '새로운 참석 상태 업데이트가 있습니다.'
      );
      
      // 원래 사용자로 복원
      if (originalUserId) {
        notificationService.setCurrentUser(originalUserId);
      }
    }
  };

  const handleEditGroupSuccess = () => {
    loadGroupDetail();
    alert('스터디 그룹 정보가 수정되었습니다!');
    
    // 모든 멤버에게 그룹 정보 변경 알림 전송
    if (group && currentUserId) {
      group.members.forEach(member => {
        if (member.userId !== currentUserId) {
          // 각 멤버의 알림 서비스에 사용자 설정 (임시)
          const originalUserId = notificationService.getCurrentUser();
          notificationService.setCurrentUser(member.userId);
          
          notificationService.createStudyGroupNotification(
            member.userId,
            'group_update',
            group.id,
            group.name,
            '그룹 정보가 변경되었습니다.'
          );
          
          // 원래 사용자로 복원
          if (originalUserId) {
            notificationService.setCurrentUser(originalUserId);
          }
        }
      });
    }
  };

  const handleJoinGroup = async () => {
    if (!group || !currentUserId) return;
    
    try {
      const result = await studyGroupAPI.joinStudyGroup(group.id, {
        userId: currentUserId,
        userName: getUserDisplayName(user) // 사용자 표시 이름 사용
      });
      
      if (result.success) {
        alert('스터디 그룹에 가입되었습니다!');
        loadGroupDetail(); // 그룹 정보 새로고침
      } else {
        alert(result.message || '가입에 실패했습니다.');
      }
    } catch (error) {
      console.error('스터디 그룹 가입 오류:', error);
      alert('스터디 그룹 가입 중 오류가 발생했습니다.');
    }
  };

  const handleLeaveGroup = async () => {
    if (!group || !currentUserId) return;
    
    if (!confirm('정말로 이 스터디 그룹을 탈퇴하시겠습니까?')) {
      return;
    }

    try {
      const result = await studyGroupAPI.leaveStudyGroup(group.id, currentUserId);
      
      if (result.success) {
        alert('스터디 그룹에서 탈퇴되었습니다.');
        onBack(); // 목록으로 돌아가기
      } else {
        alert(result.message || '탈퇴에 실패했습니다.');
      }
    } catch (error) {
      console.error('스터디 그룹 탈퇴 오류:', error);
      alert('스터디 그룹 탈퇴 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteGroup = async () => {
    if (!group) return;
    
    if (!confirm('정말로 이 스터디 그룹을 삭제하시겠습니까?\n삭제된 그룹은 복구할 수 없습니다.')) {
      return;
    }

    try {
      await studyGroupAPI.deleteStudyGroup(group.id);
      alert('스터디 그룹이 삭제되었습니다.');
      onBack(); // 목록으로 돌아가기
    } catch (error) {
      console.error('스터디 그룹 삭제 오류:', error);
      alert('스터디 그룹 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleKickMember = async (memberId: string, memberName: string) => {
    if (!group) return;
    
    if (!confirm(`"${memberName}"님을 정말로 추방하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    try {
      const result = await studyGroupAPI.kickMember(group.id, memberId);
      
      if (result.success) {
        alert(`${memberName}님이 추방되었습니다.`);
        loadGroupDetail(); // 그룹 정보 새로고침
      } else {
        alert(result.message || '멤버 추방에 실패했습니다.');
      }
    } catch (error) {
      console.error('멤버 추방 오류:', error);
      alert('멤버 추방 중 오류가 발생했습니다.');
    }
  };

  const isLeader = group?.members.some(member => 
    member.userId === currentUserId && member.role === 'leader'
  );

  const isMember = group?.members.some(member => 
    member.userId === currentUserId
  );

  // 필터링된 모임 목록 계산
  const filteredMeetings = useMemo(() => {
    if (!meetings.length || !currentUserId) return meetings;
    
    return filterAndSortMeetings(
      meetings,
      timeFilter,
      attendanceFilter,
      sortBy,
      currentUserId,
      attendeesMap
    );
  }, [meetings, timeFilter, attendanceFilter, sortBy, currentUserId, attendeesMap]);

  // 필터 핸들러들
  const handleTimeFilterChange = (filter: TimeFilter) => {
    setTimeFilter(filter);
  };

  const handleAttendanceFilterChange = (filter: AttendanceFilter) => {
    setAttendanceFilter(filter);
  };

  const handleSortChange = (sort: SortOption) => {
    setSortBy(sort);
  };

  const handleClearFilters = () => {
    setTimeFilter('all');
    setAttendanceFilter('all');
    setSortBy('date_asc');
  };

  const formatDate = (dateString: string) => {
    console.log('🕐 원본 날짜 문자열:', dateString);
    
    // 서버에서 받은 시간을 그대로 사용 (변환하지 않음)
    const date = new Date(dateString);
    console.log('🕐 파싱된 Date 객체:', date);
    console.log('🕐 로컬 시간:', date.toString());
    
    // 시간대 변환 없이 그대로 표시
    console.log('🕐 시간대 변환 없이 그대로 사용합니다');
    
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) + ' ' + date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // 지역 태그 추출
  const getLocationTags = () => {
    if (!group) return [];
    const locationMatch = group.description.match(/📍 지역: (.+)/);
    if (locationMatch) {
      return locationMatch[1].split(', ').map(tag => tag.trim());
    }
    return [];
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      '프로그래밍': 'bg-blue-100 text-blue-700',
      '자격증': 'bg-green-100 text-green-700',
      '언어': 'bg-purple-100 text-purple-700',
      '취업준비': 'bg-orange-100 text-orange-700',
      '프로젝트': 'bg-red-100 text-red-700',
      '기타': 'bg-gray-100 text-gray-700'
    };
    return colors[category] || colors['기타'];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">스터디 그룹 정보를 불러오는 중...</span>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-2">⚠️ {error || '스터디 그룹을 찾을 수 없습니다.'}</div>
        <button
          onClick={onBack}
          className="text-blue-600 hover:text-blue-800 underline"
        >
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <>
             <div className="max-w-4xl mx-auto">
                   {/* 헤더 */}
          <div className="mb-6 mt-8">
           <button
             onClick={onBack}
             className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors mb-4"
           >
             <ArrowLeft size={20} />
             목록으로
           </button>
           <div className="min-w-0">
             <h1 className="text-xl sm:text-2xl font-bold text-gray-900 break-words mb-3">{group.name}</h1>
           </div>
         </div>

        {/* 탭 네비게이션과 버튼 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 mb-6 gap-4">
          <div className="flex overflow-x-auto">
            {[
              { id: 'info', label: '그룹 정보', icon: User },
              { id: 'members', label: '멤버', icon: Users },
              { id: 'meetings', label: '모임 일정', icon: Calendar }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-3 border-b-2 font-medium transition-colors whitespace-nowrap ${
                  activeTab === id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
          
          {/* 가입/탈퇴/관리 버튼 */}
          <div className="flex gap-2 flex-wrap">
            {!isMember && group.currentMembers < group.maxMembers && (
              <button 
                onClick={handleJoinGroup}
                className="flex items-center gap-2 px-3 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-600/80 transition-colors text-sm"
              >
                <Users size={14} />
                가입하기
              </button>
            )}
            
            {isMember && !isLeader && (
              <button 
                onClick={handleLeaveGroup}
                className="flex items-center gap-2 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
              >
                <Users size={14} />
                탈퇴하기
              </button>
            )}
            
            {isLeader && (
              <>
                <button 
                  onClick={() => setShowEditGroupModal(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-600/80 transition-colors text-sm"
                >
                  <Edit size={14} />
                  그룹 수정
                </button>
                <button 
                  onClick={handleDeleteGroup}
                  className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  <Trash2 size={14} />
                  그룹 삭제
                </button>
              </>
            )}
          </div>
        </div>

        {/* 탭 컨텐츠 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {activeTab === 'info' && (
            <div className="space-y-6">
                             <div>
                 <div className="flex items-center justify-between mb-3">
                   <h3 className="text-lg font-semibold text-gray-900">스터디 그룹 정보</h3>
                   <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(group.category)}`}>
                     {group.category}
                   </span>
                 </div>
                 <div className="space-y-4">
                                     {/* 기본 정보 */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-3">
                       <div className="flex items-center gap-2">
                         <User size={16} className="text-gray-400" />
                         <span className="text-sm text-gray-600">그룹장:</span>
                         <span className="font-medium">{group.leader}</span>
                       </div>
                       <div className="flex items-center gap-2">
                         <Users size={16} className="text-gray-400" />
                         <span className="text-sm text-gray-600">멤버:</span>
                         <span className="font-medium">{group.currentMembers}/{group.maxMembers}명</span>
                       </div>
                                               <div className="flex items-center gap-2">
                          <Clock size={16} className="text-gray-400" />
                          <span className="text-sm text-gray-600">생성일:</span>
                          <span className="font-medium">{formatDate(group.createdAt)}</span>
                        </div>
                     </div>
                                         <div className="space-y-3">
                       <div className="flex items-center gap-2">
                         <MapPin size={16} className="text-gray-400" />
                         <span className="text-sm text-gray-600">장소:</span>
                         <span className="font-medium">{group.location || '온라인'}</span>
                       </div>
                                               {/* 지역 정보 */}
                        {getLocationTags().length > 0 && (
                          <div className="pt-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                              <MapPin size={16} className="text-gray-400" />
                              활동 지역:
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {getLocationTags().map((tag, index) => (
                                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                     </div>
                  </div>
                  
                  {/* 설명 섹션 */}
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="font-medium text-gray-900 mb-3">그룹 설명</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap break-words overflow-hidden">
                        {group.description.replace(/📍 지역: .+/, '').trim()}
                      </p>
                    </div>
                                     </div>
                 </div>
               </div>
             </div>
           )}

          {activeTab === 'members' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">멤버 목록</h3>
                <span className="text-sm text-gray-500">{group.members.length}명</span>
              </div>
              
              
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.members.map((member) => (
                  <div key={member.userId} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <User size={20} className="text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{member.userName}</span>
                        {member.role === 'leader' && (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                            👑 그룹장
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        가입일: {formatDate(member.joinedAt)}
                      </div>
                    </div>
                    {/* 그룹장만 다른 멤버를 추방할 수 있음 */}
                    {isLeader && member.role !== 'leader' && (
                      <button
                        onClick={() => handleKickMember(member.userId, member.userName)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="멤버 추방"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'meetings' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">모임 일정</h3>
                {isMember && (
                  <button 
                    onClick={() => setShowMeetingModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-600/80 transition-colors"
                  >
                    <Plus size={16} />
                    일정 추가
                  </button>
                )}
              </div>

              {/* 필터 컴포넌트 */}
              <MeetingFilter
                timeFilter={timeFilter}
                attendanceFilter={attendanceFilter}
                sortBy={sortBy}
                onTimeFilterChange={handleTimeFilterChange}
                onAttendanceFilterChange={handleAttendanceFilterChange}
                onSortChange={handleSortChange}
                onClearFilters={handleClearFilters}
              />

              {/* 필터 결과 통계 */}
              {currentUserId && (timeFilter !== 'all' || attendanceFilter !== 'all') && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">
                    전체 {meetings.length}개 중 <span className="font-medium text-blue-600">{filteredMeetings.length}개</span> 모임이 표시됩니다.
                  </div>
                </div>
              )}
              {filteredMeetings.length > 0 ? (
                <div className="space-y-4">
                  {filteredMeetings.map((meeting) => (
                    <div key={meeting.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => handleMeetingClick(meeting)}>
                      {/* 제목과 설명 */}
                      <div className="mb-3">
                        <h4 className="font-medium text-gray-900 mb-2 break-words line-clamp-2">{meeting.title}</h4>
                        {meeting.description && (
                          <p className="text-sm text-gray-600 break-words line-clamp-2">{meeting.description}</p>
                        )}
                      </div>
                      
                      {/* 날짜와 장소 정보 - 모바일에서 세로 배치 */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-500 mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} className="flex-shrink-0" />
                          {formatDate(meeting.date)}
                        </span>
                        {meeting.location && (
                          <span className="flex items-center gap-1">
                            <MapPin size={14} className="flex-shrink-0" />
                            <span className="break-words">{meeting.location}</span>
                          </span>
                        )}
                      </div>
                      
                      {/* 참석자 정보와 액션 버튼 - 모바일에서 세로 배치 */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="text-sm text-gray-500">
                          참석자: {meeting.attendees.length}명
                        </div>
                        {isMember && (
                          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleEditMeeting(meeting)}
                              className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded"
                              title="수정"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteMeeting(meeting.id)}
                              className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded"
                              title="삭제"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                              ) : (
                  <div className="text-center py-8 text-gray-500">
                    {meetings.length === 0 ? (
                      <>
                        아직 등록된 모임 일정이 없습니다.
                        {isMember && (
                          <div className="mt-2">
                            <button 
                              onClick={() => setShowMeetingModal(true)}
                              className="text-blue-600 hover:text-blue-800 underline"
                            >
                              첫 번째 모임 일정을 등록해보세요!
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        필터 조건에 맞는 모임이 없습니다.
                        <div className="mt-2">
                          <button 
                            onClick={handleClearFilters}
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            필터를 초기화해보세요
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
            </div>
          )}
        </div>
      </div>

      {/* 모임 일정 생성 모달 */}
      <MeetingCreateModal
        isOpen={showMeetingModal}
        onClose={() => setShowMeetingModal(false)}
        onSuccess={handleMeetingSuccess}
        groupId={groupId}
        currentUserId={currentUserId}
      />

      {/* 모임 일정 수정 모달 */}
      <MeetingEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedMeeting(null);
        }}
        onSuccess={handleEditSuccess}
        meeting={selectedMeeting}
      />

             

                        {/* 모임 상세보기 모달 */}
         <MeetingDetailModal
           isOpen={showDetailModal}
           onClose={() => {
             setShowDetailModal(false);
             setSelectedMeeting(null);
           }}
           meeting={selectedMeeting}
           attendees={selectedMeeting ? attendeesMap.get(selectedMeeting.id) || [] : []}
           currentUserId={currentUserId}
           currentUserName={group?.members.find(m => m.userId === currentUserId)?.userName}
           onAttendanceUpdate={handleAttendanceSuccess}
         />

        {/* 스터디 그룹 수정 모달 */}
        <StudyGroupEditModal
          isOpen={showEditGroupModal}
          onClose={() => setShowEditGroupModal(false)}
          onSuccess={handleEditGroupSuccess}
          group={group}
        />
     </>
   );
 };

export default StudyGroupDetail;

