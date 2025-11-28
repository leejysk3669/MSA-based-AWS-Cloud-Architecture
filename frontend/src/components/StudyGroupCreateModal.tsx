import React, { useState } from 'react';
import { X, Plus, Users, FileText, Tag, MapPin } from 'lucide-react';
import { STUDY_GROUP_CATEGORIES } from '../types';
import { studyGroupAPI, CreateStudyGroupRequest } from '../services/api';
import { getUserDisplayName } from '../utils/userDisplayName';
import { useAuth } from '../contexts/AuthContext';

// 지역 태그 옵션
const LOCATION_TAGS = [
  '서울',
  '경기',
  '인천',
  '부산',
  '대구',
  '광주',
  '대전',
  '울산',
  '세종',
  '강원',
  '충북',
  '충남',
  '전북',
  '전남',
  '경북',
  '경남',
  '제주',
  '온라인'
];

interface StudyGroupCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentUserId?: string;
}

const StudyGroupCreateModal: React.FC<StudyGroupCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentUserId
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '프로그래밍',
    maxMembers: 5,
    location: '온라인'
  });
  const [selectedLocationTags, setSelectedLocationTags] = useState<string[]>(['온라인']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'maxMembers' ? parseInt(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUserId) {
      setError('로그인이 필요합니다.');
      return;
    }

    if (!formData.name.trim()) {
      setError('스터디 그룹 이름을 입력해주세요.');
      return;
    }

    if (!formData.description.trim()) {
      setError('스터디 그룹 설명을 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 선택된 지역 태그들을 설명에 추가
      const locationTagsText = selectedLocationTags.length > 0 ? `\n\n📍 지역: ${selectedLocationTags.join(', ')}` : '';
      const descriptionWithLocation = formData.description.trim() + locationTagsText;

      const createData: CreateStudyGroupRequest = {
        name: formData.name.trim(),
        description: descriptionWithLocation,
        category: formData.category,
        maxMembers: formData.maxMembers,
        leader: currentUserId,
        leaderName: getUserDisplayName(user) // 사용자 표시 이름 사용
      };

      await studyGroupAPI.createStudyGroup(createData);
      
      // 폼 초기화
      setFormData({
        name: '',
        description: '',
        category: '프로그래밍',
        maxMembers: 5,
        location: '온라인'
      });
      setSelectedLocationTags(['온라인']);
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error('스터디 그룹 생성 오류:', err);
      setError('스터디 그룹 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        name: '',
        description: '',
        category: '프로그래밍',
        maxMembers: 5,
        location: '온라인'
      });
      setSelectedLocationTags(['온라인']);
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Plus size={20} className="text-blue-600" />
            새로운 스터디 그룹 만들기
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

          {/* 스터디 그룹 이름 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              스터디 그룹 이름 *
            </label>
            <div className="relative">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="예: React 스터디 그룹"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
                maxLength={100}
              />
              <FileText size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {formData.name.length}/100자
            </div>
          </div>

          {/* 카테고리 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              카테고리 *
            </label>
            <div className="relative">
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                disabled={loading}
              >
                {STUDY_GROUP_CATEGORIES.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <Tag size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* 지역 태그 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin size={16} className="inline mr-1" />
              스터디 지역 *
            </label>
            <div className="space-y-3">
              {/* 선택된 태그들 */}
              {selectedLocationTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedLocationTags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => setSelectedLocationTags(prev => prev.filter(t => t !== tag))}
                        className="ml-1 hover:text-blue-900"
                        disabled={loading}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              
              {/* 태그 선택 옵션 */}
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {LOCATION_TAGS.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      if (selectedLocationTags.includes(tag)) {
                        setSelectedLocationTags(prev => prev.filter(t => t !== tag));
                      } else {
                        setSelectedLocationTags(prev => [...prev, tag]);
                      }
                    }}
                    disabled={loading}
                    className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                      selectedLocationTags.includes(tag)
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              
              <div className="text-xs text-gray-500">
                여러 지역을 선택할 수 있습니다. (최소 1개 선택)
              </div>
            </div>
          </div>

          {/* 최대 인원 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              최대 인원 *
            </label>
            <div className="relative">
              <input
                type="number"
                name="maxMembers"
                value={formData.maxMembers}
                onChange={handleInputChange}
                min="2"
                max="50"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
              <Users size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              2명 ~ 50명 사이로 설정해주세요
            </div>
          </div>

          {/* 설명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              스터디 그룹 설명 *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="스터디 그룹에 대한 설명을 입력해주세요. 예: React와 관련 기술들을 함께 공부하는 스터디 그룹입니다. #React #JavaScript #프론트엔드"
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={loading}
              maxLength={500}
            />
            <div className="text-xs text-gray-500 mt-1">
              {formData.description.length}/500자 (해시태그 사용 가능: #React)
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
                '스터디 그룹 만들기'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudyGroupCreateModal;
