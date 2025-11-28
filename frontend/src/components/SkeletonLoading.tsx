import React from 'react';

interface SkeletonLoadingProps {
  type?: 'card' | 'list' | 'text' | 'button';
  count?: number;
  className?: string;
}

const SkeletonLoading: React.FC<SkeletonLoadingProps> = ({
  type = 'card',
  count = 1,
  className = ''
}) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
            <div className="flex items-start justify-between mb-4">
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="flex items-center gap-6 mb-4">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
            <div className="flex gap-2 mb-4">
              <div className="h-6 bg-gray-200 rounded-full w-16"></div>
              <div className="h-6 bg-gray-200 rounded-full w-20"></div>
            </div>
            <div className="flex items-center justify-between">
              <div className="h-6 bg-gray-200 rounded w-24"></div>
              <div className="flex gap-2">
                <div className="h-8 bg-gray-200 rounded w-16"></div>
                <div className="h-8 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          </div>
        );

      case 'list':
        return (
          <div className="space-y-4">
            {Array.from({ length: count }, (_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-5 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-5 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'text':
        return (
          <div className="space-y-2">
            {Array.from({ length: count }, (_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: `${Math.random() * 40 + 60}%` }}></div>
            ))}
          </div>
        );

      case 'button':
        return (
          <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-24"></div>
        );

      default:
        return null;
    }
  };

  if (type === 'list' || type === 'text') {
    return (
      <div className={className}>
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className={i > 0 ? 'mt-4' : ''}>
            {renderSkeleton()}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          {renderSkeleton()}
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoading;
