import React, { useState } from 'react';
import { X, Plus, Calendar, MapPin, FileText, Clock } from 'lucide-react';
import { studyGroupAPI, CreateMeetingRequest } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { getUserDisplayName } from '../utils/userDisplayName';

interface MeetingCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  groupId: string;
  currentUserId?: string;
}

const MeetingCreateModal: React.FC<MeetingCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  groupId,
  currentUserId
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUserId) {
      setError('로그인이 필요합니다.');
      return;
    }

    if (!formData.title.trim()) {
      setError('모임 제목을 입력해주세요.');
      return;
    }

    if (!formData.date || !formData.time) {
      setError('모임 날짜와 시간을 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 날짜와 시간을 합쳐서 UTC 시간으로 변환
      const localDateTimeString = `${formData.date}T${formData.time}:00`;
      const localDate = new Date(localDateTimeString);
      const utcDateTimeString = localDate.toISOString();
      
      console.log('🕐 로컬 시간 문자열:', localDateTimeString);
      console.log('🕐 UTC 시간 문자열:', utcDateTimeString);

      const createData: CreateMeetingRequest = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        date: utcDateTimeString,
        location: formData.location.trim() || undefined
      };

      await studyGroupAPI.createMeeting(groupId, createData);
      
      // 폼 초기화
      setFormData({
        title: '',
        description: '',
        date: '',
        time: '',
        location: ''
      });
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error('모임 일정 생성 오류:', err);
      setError('모임 일정 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        title: '',
        description: '',
        date: '',
        time: '',
        location: ''
      });
      setError(null);
      onClose();
    }
  };

  // 오늘 날짜를 기본값으로 설정
  const today = new Date().toISOString().split('T')[0];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Plus size={20} className="text-blue-600" />
            새로운 모임 일정 만들기
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 에러 메시지 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-red-600 text-sm">{error}</div>
            </div>
          )}

          {/* 모임 제목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              모임 제목 *
            </label>
            <div className="relative">
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="예: React 스터디 3주차"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
                maxLength={100}
              />
              <FileText size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {formData.title.length}/100자
            </div>
          </div>

          {/* 날짜와 시간 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                모임 날짜 *
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  min={today}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
                <Calendar size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                모임 시간 *
              </label>
              <div className="relative">
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
                <Clock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>

          {/* 장소 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              모임 장소
            </label>
            <div className="relative">
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="예: 온라인 (Zoom), 서울 강남역 스터디카페"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
              <MapPin size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* 설명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              모임 설명
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="모임에 대한 상세한 설명을 입력해주세요. 예: React 컴포넌트 설계와 상태 관리에 대해 토론하고, 실습을 진행합니다."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none break-words"
              disabled={loading}
              maxLength={500}
            />
            <div className="text-xs text-gray-500 mt-1">
              {formData.description.length}/500자
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-600/80 transition-colors disabled:opacity-50 font-medium"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  생성 중...
                </div>
              ) : (
                '일정 만들기'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MeetingCreateModal;
