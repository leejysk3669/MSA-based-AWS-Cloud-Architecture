import React from 'react';
import { ArrowLeft, Sun, Cloud, Heart, Target, Users } from 'lucide-react';

interface AboutPageProps {
  onBack: () => void;
}

const AboutPage: React.FC<AboutPageProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-yellow-50">
      {/* 메인 콘텐츠 */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* 돌아가기 버튼 */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">돌아가기</span>
          </button>
        </div>
        {/* 히어로 섹션 */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
              <Sun size={40} className="text-white" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            시선집중
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            <span className="text-sky-600 font-semibold">See Sun</span>과 
            <span className="text-sky-600 font-semibold"> 시선</span>을 연결한<br />
            집중과 응원, 그리고 밝은 미래를 담은 이름입니다
          </p>
        </div>

        {/* 시선집중 소개 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center">
              <Target size={24} className="text-sky-600" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">시선집중이란?</h2>
          </div>
          
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-sky-50 to-blue-50 rounded-xl p-6">
              <p className="text-gray-700 text-lg leading-relaxed">
                <span className="font-semibold text-sky-700">'시선집중'</span>은 집중과 응원, 그리고 밝은 미래를 담은 이름입니다.
                영어 <span className="font-semibold text-sky-600">see sun</span>과 한글 
                <span className="font-semibold text-sky-600"> 시선</span>을 연결해, 
                해를 바라보며 목표에 집중하는 마음을 표현했습니다.
              </p>
            </div>

            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6">
              <p className="text-gray-700 text-lg leading-relaxed">
                이 이름은 단순히 주목을 받는 것을 넘어서,<br />
                <span className="font-semibold text-orange-600">"집중해서 해보자"</span>는 다짐과 
                <span className="font-semibold text-orange-600"> "해 뜨는 날처럼 희망적인 미래"</span>를 함께 전합니다.
              </p>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6">
              <p className="text-gray-700 text-lg leading-relaxed">
                서로를 응원하며 함께 성장하는 긍정적인 분위기,<br />
                그것이 바로 <span className="font-semibold text-green-600">'시선집중'</span>이 가진 힘입니다.
              </p>
            </div>
          </div>
        </div>

        {/* 팀명 소개 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Cloud size={24} className="text-purple-600" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">팀명: 구름먹는 하마</h2>
          </div>
          
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
              <p className="text-gray-700 text-lg leading-relaxed">
                우리 팀명 <span className="font-semibold text-purple-600">"구름먹는 하마"</span>는<br />
                흐린 하늘을 가린 구름을 먹어치우고 다시 태양을 드러내는 상징을 담고 있습니다.
              </p>
            </div>

            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6">
              <p className="text-gray-700 text-lg leading-relaxed">
                어려움을 이겨내고 밝은 미래를 만들어간다는 의미처럼,<br />
                유쾌하면서도 희망적인 에너지를 전하고자 합니다.
              </p>
            </div>
          </div>
        </div>

        {/* 비전 섹션 */}
        <div className="bg-gradient-to-br from-sky-100 via-white to-yellow-100 rounded-2xl shadow-lg p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <Heart size={24} className="text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">우리의 비전</h2>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6">
              <p className="text-gray-700 text-lg leading-relaxed text-center">
                <span className="font-semibold text-sky-600">'시선집중'</span>과 
                <span className="font-semibold text-purple-600"> '구름먹는 하마'</span>,<br />
                두 이름이 전하는 긍정의 메시지처럼, 우리는 도전 속에서도 웃으며 앞으로 나아갑니다.
              </p>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6">
              <p className="text-gray-700 text-lg leading-relaxed text-center">
                함께하는 여정이 더 즐겁고 빛날 수 있도록,<br />
                언제나 밝고 따뜻한 에너지를 전하겠습니다.
              </p>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="text-center mt-12">
          <div className="flex justify-center items-center gap-4 mb-4">
            <div className="w-8 h-8 bg-yellow-500 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">☀️</span>
            </div>
            <span className="text-xl font-bold text-gray-900">시선집중</span>
            <div className="w-8 h-8 bg-purple-500 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">🦛</span>
            </div>
          </div>
          <p className="text-gray-600">
            함께 성장하는 커뮤니티, 시선집중
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
