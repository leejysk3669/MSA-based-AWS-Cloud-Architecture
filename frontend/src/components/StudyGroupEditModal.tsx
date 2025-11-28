import React, { useState, useEffect } from 'react';
import { X, Edit, Users, MapPin, FileText, Hash } from 'lucide-react';
import { StudyGroup, UpdateStudyGroupRequest, STUDY_GROUP_CATEGORIES } from '../types';
import { studyGroupAPI } from '../services/api';

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

interface StudyGroupEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  group: StudyGroup | null;
}

const StudyGroupEditModal: React.FC<StudyGroupEditModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  group
}) => {
  const [formData, setFormData] = useState<UpdateStudyGroupRequest>({
    name: '',
    description: '',
    category: '',
    maxMembers: 0,
    location: ''
  });
  const [selectedLocationTags, setSelectedLocationTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 지역 태그 추출 함수
  const extractLocationTags = (description: string): string[] => {
    const locationMatch = description.match(/📍 지역: (.+)/);
    if (locationMatch) {
      return locationMatch[1].split(', ').map(tag => tag.trim());
    }
    return [];
  };

  // 지역 태그를 제거한 설명 반환 함수
  const removeLocationTags = (description: string): string => {
    return description.replace(/\n\n📍 지역: .+/, '').trim();
  };

  useEffect(() => {
    if (group) {
      // 지역 태그 추출
      const locationTags = extractLocationTags(group.description);
      const descriptionWithoutLocation = removeLocationTags(group.description);
      
      setFormData({
        name: group.name,
        description: descriptionWithoutLocation,
        category: group.category,
        maxMembers: group.maxMembers,
        location: group.location || ''
      });
      setSelectedLocationTags(locationTags);
    }
  }, [group]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group) return;

    try {
      setLoading(true);
      setError(null);

      // 선택된 지역 태그들을 설명에 추가
      const locationTagsText = selectedLocationTags.length > 0 ? `\n\n📍 지역: ${selectedLocationTags.join(', ')}` : '';
      const descriptionWithLocation = formData.description.trim() + locationTagsText;

      const updateData = {
        ...formData,
        description: descriptionWithLocation
      };

      await studyGroupAPI.updateStudyGroup(group.id, updateData);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('스터디 그룹 수정 오류:', err);
      setError(err.response?.data?.error || '스터디 그룹 수정 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof UpdateStudyGroupRequest, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  if (!isOpen || !group) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Edit size={20} className="text-blue-600" />
            스터디 그룹 수정
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 에러 메시지 */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* 그룹명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <Hash size={14} />
              그룹명 *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="스터디 그룹명을 입력하세요"
              required
            />
          </div>

          {/* 카테고리 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              카테고리 *
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">카테고리를 선택하세요</option>
              {STUDY_GROUP_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* 최대 인원 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <Users size={14} />
              최대 인원 *
            </label>
            <input
              type="number"
              value={formData.maxMembers}
              onChange={(e) => handleInputChange('maxMembers', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="최대 인원수를 입력하세요"
              min="1"
              max="50"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              현재 {group.currentMembers}명이 가입되어 있습니다.
            </p>
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

          {/* 설명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <FileText size={14} />
              설명 *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="스터디 그룹에 대한 설명을 입력하세요"
              rows={4}
              required
            />
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-600/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '수정 중...' : '수정하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudyGroupEditModal;
