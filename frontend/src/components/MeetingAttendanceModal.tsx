import React, { useState, useEffect } from 'react';
import { X, Users, CheckCircle, XCircle, HelpCircle, Clock } from 'lucide-react';
import { studyGroupAPI, MeetingAttendee, UpdateAttendanceRequest, Meeting } from '../services/api';

interface MeetingAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  meeting: Meeting | null;
  currentUserId?: string;
  currentUserName?: string;
}

const MeetingAttendanceModal: React.FC<MeetingAttendanceModalProps> = ({
  isOpen, onClose, onSuccess, meeting, currentUserId, currentUserName
}) => {
  const [attendees, setAttendees] = useState<MeetingAttendee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userStatus, setUserStatus] = useState<'attending' | 'not_attending' | 'maybe' | null>(null);

  useEffect(() => {
    if (isOpen && meeting) {
      loadAttendees();
    }
  }, [isOpen, meeting]);

  const loadAttendees = async () => {
    if (!meeting) return;
    
    try {
      setLoading(true);
      const attendeesData = await studyGroupAPI.getMeetingAttendees(meeting.id);
      setAttendees(attendeesData);
      
      // 현재 사용자의 참석 상태 찾기
      const currentUserAttendee = attendeesData.find(attendee => attendee.userId === currentUserId);
      setUserStatus(currentUserAttendee?.status || null);
    } catch (err) {
      console.error('참석자 목록 로드 오류:', err);
      setError('참석자 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (status: 'attending' | 'not_attending' | 'maybe') => {
    if (!meeting || !currentUserId || !currentUserName) {
      setError('사용자 정보가 없습니다.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const attendanceData: UpdateAttendanceRequest = {
        userId: currentUserId,
        userName: currentUserName,
        status
      };

      await studyGroupAPI.updateMeetingAttendance(meeting.id, attendanceData);
      setUserStatus(status);
      
      // 참석자 목록 새로고침
      await loadAttendees();
      
      onSuccess();
    } catch (err) {
      console.error('참석 상태 업데이트 오류:', err);
      setError('참석 상태 업데이트 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      onClose();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'attending':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'not_attending':
        return <XCircle size={16} className="text-red-600" />;
      case 'maybe':
        return <HelpCircle size={16} className="text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'attending':
        return '참석';
      case 'not_attending':
        return '불참';
      case 'maybe':
        return '미정';
      default:
        return '미응답';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'attending':
        return 'bg-green-100 text-green-700';
      case 'not_attending':
        return 'bg-red-100 text-red-700';
      case 'maybe':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    // 서버에서 받은 시간을 그대로 사용 (변환하지 않음)
    const date = new Date(dateString);
    
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric'
    }) + ' ' + date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (!isOpen || !meeting) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users size={20} className="text-blue-600" />
            모임 참석 관리
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* 모임 정보 */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-2">{meeting.title}</h3>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {formatDate(meeting.date)}
            </span>
            {meeting.location && (
              <span>{meeting.location}</span>
            )}
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-600 text-sm">{error}</div>
          </div>
        )}

        {/* 현재 사용자 참석 상태 선택 */}
        {currentUserId && (
          <div className="p-6 border-b border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">내 참석 상태</h4>
            <div className="flex gap-2">
              <button
                onClick={() => handleStatusUpdate('attending')}
                disabled={loading || userStatus === 'attending'}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  userStatus === 'attending'
                    ? 'bg-green-100 border-green-300 text-green-700'
                    : 'border-gray-300 text-gray-700 hover:bg-green-50'
                } disabled:opacity-50`}
              >
                <CheckCircle size={16} />
                참석
              </button>
              <button
                onClick={() => handleStatusUpdate('not_attending')}
                disabled={loading || userStatus === 'not_attending'}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  userStatus === 'not_attending'
                    ? 'bg-red-100 border-red-300 text-red-700'
                    : 'border-gray-300 text-gray-700 hover:bg-red-50'
                } disabled:opacity-50`}
              >
                <XCircle size={16} />
                불참
              </button>
              <button
                onClick={() => handleStatusUpdate('maybe')}
                disabled={loading || userStatus === 'maybe'}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  userStatus === 'maybe'
                    ? 'bg-yellow-100 border-yellow-300 text-yellow-700'
                    : 'border-gray-300 text-gray-700 hover:bg-yellow-50'
                } disabled:opacity-50`}
              >
                <HelpCircle size={16} />
                미정
              </button>
            </div>
          </div>
        )}

        {/* 참석자 목록 */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">참석자 목록</h4>
            <span className="text-sm text-gray-500">{attendees.length}명</span>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">로딩 중...</span>
            </div>
          ) : attendees.length > 0 ? (
            <div className="space-y-3">
              {attendees.map((attendee) => (
                <div key={attendee.userId} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {attendee.userName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{attendee.userName}</div>
                      <div className="text-xs text-gray-500">
                        {formatDate(attendee.updatedAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(attendee.status)}
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(attendee.status)}`}>
                      {getStatusText(attendee.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              아직 참석 상태를 설정한 사람이 없습니다.
            </div>
          )}
        </div>

        {/* 버튼 */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            disabled={loading}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeetingAttendanceModal;
