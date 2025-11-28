import React, { useState } from 'react';
import { X, Calendar, MapPin, FileText, Users, Clock, Edit } from 'lucide-react';
import { Meeting, MeetingAttendee } from '../types';
import { studyGroupAPI } from '../services/api';

interface MeetingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: Meeting | null;
  attendees: MeetingAttendee[];
  currentUserId?: string;
  currentUserName?: string;
  onAttendanceUpdate?: () => void;
}

const MeetingDetailModal: React.FC<MeetingDetailModalProps> = ({
  isOpen,
  onClose,
  meeting,
  attendees,
  currentUserId,
  currentUserName,
  onAttendanceUpdate
}) => {
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  
  // 디버깅용 로그
  console.log('MeetingDetailModal props:', { isOpen, meeting, currentUserId, currentUserName, attendees });
  
  if (!isOpen || !meeting) return null;

  const formatDate = (dateString: string) => {
    // 서버에서 받은 시간을 그대로 사용 (변환하지 않음)
    const date = new Date(dateString);
    
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

  const getAttendanceStatus = (attendee: MeetingAttendee) => {
    switch (attendee.status) {
      case 'attending':
        return { text: '참석', color: 'text-green-600 bg-green-100' };
      case 'not_attending':
        return { text: '불참', color: 'text-red-600 bg-red-100' };
      default:
        return { text: '불참', color: 'text-gray-600 bg-gray-100' };
    }
  };

  const handleAttendanceUpdate = async (status: 'attending' | 'not_attending') => {
    console.log('참석 상태 업데이트 시작:', { meeting, currentUserId, currentUserName, status });
    
    if (!meeting || !currentUserId || !currentUserName) {
      console.error('필수 정보 누락:', { meeting: !!meeting, currentUserId: !!currentUserId, currentUserName: !!currentUserName });
      alert('사용자 정보가 누락되었습니다.');
      return;
    }
    
    try {
      console.log('API 호출 시작:', { meetingId: meeting.id, userId: currentUserId, userName: currentUserName, status });
      
      const result = await studyGroupAPI.updateMeetingAttendance(meeting.id, {
        userId: currentUserId,
        userName: currentUserName,
        status: status
      });
      
      console.log('API 호출 성공:', result);
      
      if (onAttendanceUpdate) {
        onAttendanceUpdate();
      }
      setShowAttendanceModal(false);
      alert(`참석 상태가 ${status === 'attending' ? '참석' : '불참'}으로 업데이트되었습니다.`);
    } catch (error) {
      console.error('참석 상태 업데이트 오류:', error);
      alert('참석 상태 업데이트 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileText size={20} className="text-blue-600" />
            모임 일정 상세보기
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* 내용 */}
        <div className="p-6 space-y-6">
                     {/* 모임 제목 */}
           <div>
             <h3 className="text-lg font-semibold text-gray-900 mb-2 break-words">{meeting.title}</h3>
             {meeting.description && (
               <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap break-words overflow-hidden">
                 {meeting.description}
               </p>
             )}
           </div>

                     {/* 기본 정보 */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-3">
               <div className="flex items-center gap-2">
                 <Calendar size={16} className="text-gray-400 flex-shrink-0" />
                 <span className="text-sm text-gray-600 flex-shrink-0">모임 일시:</span>
                 <span className="font-medium break-words">{formatDate(meeting.date)}</span>
               </div>
                               {meeting.location && (
                  <div className="flex gap-2">
                    <MapPin size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-gray-600">모임 장소:</span>
                      <div className="font-medium break-words mt-1">{meeting.location}</div>
                    </div>
                  </div>
                )}
             </div>
             <div className="space-y-3">
               <div className="flex items-center gap-2">
                 <Users size={16} className="text-gray-400 flex-shrink-0" />
                 <span className="text-sm text-gray-600 flex-shrink-0">참석자:</span>
                 <span className="font-medium">{attendees.length}명</span>
               </div>
               <div className="flex items-center gap-2">
                 <Clock size={16} className="text-gray-400 flex-shrink-0" />
                 <span className="text-sm text-gray-600 flex-shrink-0">생성일:</span>
                 <span className="font-medium break-words">{formatDate(meeting.createdAt)}</span>
               </div>
             </div>
           </div>

                     {/* 참석자 목록 */}
           <div className="border-t border-gray-200 pt-4">
             <div className="flex items-center justify-between mb-3">
               <h4 className="font-medium text-gray-900 flex items-center gap-2">
                 <Users size={16} />
                 참석자 목록
               </h4>
                               {currentUserId && (
                  <button
                    onClick={() => {
                      console.log('참석 관리 버튼 클릭됨');
                      setShowAttendanceModal(true);
                    }}
                    className="flex items-center gap-2 px-3 py-1 text-sm bg-sky-600 text-white rounded-lg hover:bg-sky-600/80 transition-colors"
                  >
                    <Edit size={14} />
                    참석 관리
                  </button>
                )}
             </div>
             {attendees.length > 0 ? (
                               <div className="space-y-2">
                  {attendees.map((attendee, index) => {
                    const status = getAttendanceStatus(attendee);
                    return (
                      <div key={`${attendee.userId}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                       <div className="flex items-center gap-3 min-w-0 flex-1">
                         <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                           <span className="text-xs font-medium text-gray-600">
                             {attendee.userName.charAt(0)}
                           </span>
                         </div>
                         <span className="font-medium text-gray-900 truncate">{attendee.userName}</span>
                       </div>
                       <span className={`px-2 py-1 text-xs rounded-full font-medium flex-shrink-0 ${status.color}`}>
                         {status.text}
                       </span>
                     </div>
                   );
                 })}
               </div>
             ) : (
               <div className="text-center py-6 text-gray-500">
                 아직 참석자가 없습니다.
               </div>
             )}
           </div>

          {/* 참석자 통계 */}
          {attendees.length > 0 && (
            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-medium text-gray-900 mb-3">참석 현황</h4>
                             <div className="grid grid-cols-2 gap-4">
                 <div className="text-center p-3 bg-green-50 rounded-lg">
                   <div className="text-lg font-bold text-green-600">
                     {attendees.filter(a => a.status === 'attending').length}
                   </div>
                   <div className="text-xs text-green-600">참석</div>
                 </div>
                 <div className="text-center p-3 bg-red-50 rounded-lg">
                   <div className="text-lg font-bold text-red-600">
                     {attendees.filter(a => a.status === 'not_attending').length}
                   </div>
                   <div className="text-xs text-red-600">불참</div>
                 </div>
               </div>
            </div>
          )}
        </div>

        {/* 닫기 버튼 */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            닫기
          </button>
                 </div>
       </div>

       {/* 참석 관리 모달 */}
       {showAttendanceModal && meeting && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
           <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
             <div className="flex items-center justify-between p-4 border-b border-gray-200">
               <h3 className="text-lg font-semibold text-gray-900">참석 관리</h3>
               <button
                 onClick={() => setShowAttendanceModal(false)}
                 className="text-gray-400 hover:text-gray-600 transition-colors"
               >
                 <X size={20} />
               </button>
             </div>
                           <div className="p-4">
                <p className="text-gray-600 mb-4">
                  <strong className="truncate block">{meeting.title}</strong> 모임에 대한 참석 여부를 선택해주세요.
                </p>
                               <div className="space-y-3">
                  <button
                    onClick={() => handleAttendanceUpdate('attending')}
                    className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors"
                  >
                    <div className="font-medium text-green-600">✅ 참석</div>
                    <div className="text-sm text-gray-500">모임에 참석하겠습니다</div>
                  </button>
                  <button
                    onClick={() => handleAttendanceUpdate('not_attending')}
                    className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors"
                  >
                    <div className="font-medium text-red-600">❌ 불참</div>
                    <div className="text-sm text-gray-500">모임에 참석할 수 없습니다</div>
                  </button>
                </div>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 };

export default MeetingDetailModal;
