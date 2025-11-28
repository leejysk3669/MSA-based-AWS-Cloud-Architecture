import React, { useState, useEffect } from 'react';

interface CommentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (content: string) => Promise<void>;
  initialContent: string;
  loading: boolean;
}

const CommentEditModal: React.FC<CommentEditModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialContent,
  loading
}) => {
  const [content, setContent] = useState(initialContent);

  useEffect(() => {
    if (isOpen) {
      setContent(initialContent);
    }
  }, [isOpen, initialContent]);

  const handleSubmit = async () => {
    if (!content.trim()) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }
    await onSubmit(content.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">댓글 수정</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            댓글 내용
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="댓글 내용을 입력하세요..."
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`px-4 py-2 text-sm rounded-lg ${
              loading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-sky-600 text-white hover:bg-sky-600/80'
            }`}
          >
            {loading ? '수정 중...' : '수정 완료'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentEditModal;
