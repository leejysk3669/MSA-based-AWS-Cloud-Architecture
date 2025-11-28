const piiService = require('../services/piiService');
const geminiService = require('../services/geminiService');
const dbService = require('../services/dbService');

const getFeedback = async (req, res) => {
  try {
    const { text } = req.body;
    
    // 입력 검증 추가
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ 
        error: "자기소개서 텍스트가 필요합니다.",
        received: req.body 
      });
    }
    
    const maskedText = piiService.maskPII(text);

    const initialGeminiPrompt = `아래 자기소개서에서 지원하는 회사명과 직무명을 추출하여 반드시 JSON 형식으로만 반환해줘.

**중요: JSON 객체만 반환하고, 다른 설명이나 텍스트는 포함하지 마세요.**

예시 형식:
{"company": "삼성전자", "job": "소프트웨어 엔지니어"}

자기소개서 내용:
${maskedText}

JSON 응답:`;
    const initialResponse = await geminiService.getAIFeedback(initialGeminiPrompt);

    // The geminiService now returns a JSON object or the raw text
    const targetCompany = initialResponse.company || '';
    const targetJob = initialResponse.job || '';

    if (!targetCompany || !targetJob) {
      console.error("Failed to extract company and job from text:", initialResponse);
      return res.status(400).json({ error: "자기소개서에서 회사명 또는 직무명을 추출할 수 없습니다." });
    }

    const comprehensiveGeminiPrompt = `[시스템 역할]
너는 최고의 커리어 컨설턴트다. 지원자의 자기소개서를 분석하여, 지원자가 지원하는 회사와 직무에 가장 적합한 자기소개서를 만들어줘야 한다.

[지원자 자기소개서 원본]
${maskedText}

[지원 회사]
${targetCompany}

[지원 직무]
${targetJob}

[요청 사항]
1.  **자기소개서 분석 및 평가:**
    *   [지원자 자기소개서 원본]의 강점과 약점을 분석해라.
    *   지원자가 해당 회사와 직무에 적합한지 평가해라.
2.  **완벽한 자기소개서 재작성 (가장 중요):**
    *   위 분석 내용을 바탕으로, [지원자 자기소개서 원본]을 완전히 새롭게 재작성해라.
    *   **지원자가 해당 회사와 직무에 대해 깊이 이해하고 준비된 인재임을 보여줘야 한다.**
    *   추상적인 표현은 구체적인 경험과 성과로 바꾸고, 지원자의 경험이 회사의 어떤 부분에 기여할 수 있을지 명확하게 서술해라.
    *   분량은 1000자 내외로 작성해라.

[AI 출력 포맷]
**반드시 아래 JSON 포맷을 엄격하게 지키고, JSON 객체 외에 다른 텍스트나 설명을 포함하지 마세요.**
{
  "target_company": "${targetCompany}",
  "target_job": "${targetJob}",
  "rubric": {
    "strength": "지원자의 강점 분석",
    "gap": "지원자의 보완점 분석",
    "improvement": "자기소개서 재작성 시 어떤 점을 개선했는지에 대한 구체적 설명"
  },
  "revised_text": "재작성된 자기소개서 (1000자 내외)"
}`;

    const finalOutput = await geminiService.getAIFeedback(comprehensiveGeminiPrompt);

    // Save feedback to the database
    const userId = 'anonymous'; // Placeholder until user authentication is implemented
    await dbService.saveFeedback(userId, text, finalOutput);

    const metadata = {
      company: finalOutput.company || targetCompany,
      job: finalOutput.job || targetJob,
      ttl: 3600,
      views: 1,
    };
    await dbService.saveMetadata(metadata);

    res.status(200).json(finalOutput);

  } catch (error) {
    console.error("Error processing portfolio feedback:", error);
    res.status(500).json({ error: "An internal server error occurred." });
  }
};

module.exports = {
  getFeedback,
};