const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
const xml2js = require('xml2js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { register, collectDefaultMetrics, Counter, Histogram, Gauge } = require('prom-client');

dotenv.config(); // Load environment variables from .env file

const app = express();
// 쿠버네티스 환경을 위한 포트 설정
const port = process.env.PORT || 5000;

// Prometheus 메트릭 설정
collectDefaultMetrics({ register });

// 커스텀 메트릭 정의
const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const certificateSearchesTotal = new Counter({
  name: 'certificate_searches_total',
  help: 'Total number of certificate searches',
  labelNames: ['search_type', 'status']
});

const aiRequestsTotal = new Counter({
  name: 'ai_requests_total',
  help: 'Total number of AI requests',
  labelNames: ['model', 'status']
});

// 쿠버네티스 환경을 위한 CORS 설정
app.use(cors({
    origin: true, // 모든 도메인 허용 (개발 환경용)
    credentials: true
}));
app.use(express.json());

// 메트릭 수집 미들웨어
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    
    httpRequestsTotal
      .labels(req.method, route, res.statusCode.toString())
      .inc();
    
    httpRequestDuration
      .labels(req.method, route, res.statusCode.toString())
      .observe(duration);
  });
  
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'certificate-search-api',
    timestamp: new Date().toISOString(),
    port: port
  });
});

// Prometheus 메트릭 엔드포인트
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    console.error('Error collecting metrics:', error);
    res.status(500).end('Error collecting metrics');
  }
});

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const QNET_API_KEY = process.env.QNET_API_KEY; // Q-net API 키
const ALADIN_TTB_KEY = process.env.ALADIN_TTB_KEY; // Aladin TTB Key

if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY not found in environment variables. Please set it in your .env file.');
    process.exit(1);
}

if (!ALADIN_TTB_KEY) {
    console.warn('⚠️  ALADIN_TTB_KEY not found in environment variables. Banner ads feature will be disabled.');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// 검색 결과 캐싱 (토큰 소모 방지)
const searchCache = new Map();
const CACHE_EXPIRY = 30 * 60 * 1000; // 30분 (1시간 → 30분으로 단축)

// 캐시 초기화 함수 (프롬프트 변경 시 사용)
const clearCache = () => {
    searchCache.clear();
    console.log('Search cache cleared');
}; 

// XML 응답을 JSON으로 파싱하는 헬퍼 함수
const parseXml = (xml) => {
    return new Promise((resolve, reject) => {
        xml2js.parseString(xml, { explicitArray: false }, (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
    });
};

// Q-net API 호출 헬퍼 함수
async function callQnetApi(operation, params = {}) {
    const baseUrl = 'http://openapi.q-net.or.kr/api/service/rest/';
    let apiUrl = '';

    switch (operation) {
        case 'getList': apiUrl = baseUrl + 'InquiryListNationalQualifcationSVC/getList'; break; // 종목 목록 조회
        case 'getPEList': apiUrl = baseUrl + 'InquiryTestInformationNTQSVC/getPEList'; break; // 기술사 시험 시행일정 조회
        case 'getMCList': apiUrl = baseUrl + 'InquiryTestInformationNTQSVC/getMCList'; break; // 기능장 시험 시행일정 조회
        case 'getEList': apiUrl = baseUrl + 'InquiryTestInformationNTQSVC/getEList'; break; // 기사, 산업기사 시험 시행일정 조회
        case 'getCList': apiUrl = baseUrl + 'InquiryTestInformationNTQSVC/getCList'; break; // 기능사 시험 시행일정 조회
        case 'getFeeList': apiUrl = baseUrl + 'InquiryTestInformationNTQSVC/getFeeList'; break; // 종목별 응시 수수료 조회
        case 'getJMList': apiUrl = baseUrl + 'InquiryTestInformationNTQSVC/getJMList'; break; // 종목별 시행일정 조회
        default:
            throw new Error(`Unknown Q-net API operation: ${operation}`);
    }

    console.log(`Calling Q-net API: ${operation} with params:`, params); // 로그 추가

    try {
        const response = await axios.get(apiUrl, {
            params: {
                serviceKey: QNET_API_KEY,
                ...params
            }
        });
        console.log(`Q-net API raw response for ${operation}:`, response.data); // 로그 추가
        console.log(`Q-net API Content-Type for ${operation}:`, response.headers['content-type']); // 로그 추가

        let parsedData;
        const contentType = response.headers['content-type'];

        if (typeof response.data === 'string') {
            if (contentType && contentType.includes('application/xml')) {
                parsedData = await parseXml(response.data);
            } else if (contentType && contentType.includes('application/json')) {
                parsedData = JSON.parse(response.data);
            } else { 
                try {
                    parsedData = await parseXml(response.data);
                } catch (xmlParseError) {
                    console.warn(`Failed to parse as XML, trying as JSON for ${operation}:`, xmlParseError.message);
                    parsedData = JSON.parse(response.data);
                }
            }
        } else { 
            parsedData = response.data;
        }
        
        console.log(`Q-net API parsed data for ${operation}:`, JSON.stringify(parsedData, null, 2)); // 로그 추가

        if (parsedData && parsedData.response && parsedData.response.body && parsedData.response.body.items) {
            return parsedData.response.body.items.item; 
        } else if (parsedData && parsedData.response && parsedData.response.header && parsedData.response.header.resultCode !== '00') {
            console.error(`Q-net API Error (${operation}): ${parsedData.response.header.resultMsg}`);
            return null;
        }
        return null;
    } catch (error) {
        console.error(`Error calling Q-net API (${operation}):`, error.message);
        return null;
    }
}

// 자격증 검색 API (Q-net API 연동 및 Gemini AI 활용 + 캐싱)
app.get('/api/search', async (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.status(400).json({ error: '검색어를 입력해주세요.' });
    }

    // 캐시 확인 (토큰 소모 방지)
    const cacheKey = query.toLowerCase();
    const cachedResult = searchCache.get(cacheKey);
    
    if (cachedResult && (Date.now() - cachedResult.timestamp) < CACHE_EXPIRY) {
        console.log(`Cache hit for query: ${query}`);
        return res.json(cachedResult.data);
    }
    
    console.log(`Cache miss for query: ${query}, calling Gemini API`);

    let qnetData = {};
    let jmCd = null;

    try {
        console.log(`Attempting to get jmCd for query: ${query}`);
        // 종목 목록 API를 통해 jmCd 동적 매핑 시도
        const jmList = await callQnetApi('getList', { jmNm: query }); // jmNm 파라미터로 검색
        console.log(`jmList for ${query}:`, JSON.stringify(jmList, null, 2));
        if (jmList && Array.isArray(jmList)) {
            const foundCert = jmList.find(item => item.jmfldnm === query); // 정확히 일치하는 종목명 찾기
            if (foundCert) {
                jmCd = foundCert.jmcd;
                console.log(`Found jmCd for ${query}: ${jmCd}`);
            } else {
                console.log(`No exact jmCd found for query: ${query} in jmList.`);
            }
        } else if (jmList && jmList.jmfldnm === query) { // 단일 결과일 경우
            jmCd = jmList.jmcd;
            console.log(`Found single jmCd for ${query}: ${jmCd}`);
        } else {
            console.log(`jmList is not an array or single result for query: ${query}.`);
        }
    } catch (error) {
        console.error('Error fetching jmCd from Q-net API:', error);
    }

    if (jmCd) { // jmCd를 찾은 경우 국가기술자격으로 간주하고 Q-net API 호출
        console.log(`jmCd found: ${jmCd}. Fetching schedule and fee info.`);
        try {
            // Q-net API 호출을 병렬로 처리하여 속도 향상
            const [jmSchedule, feeInfo] = await Promise.allSettled([
                callQnetApi('getJMList', { jmCd: jmCd }),
                callQnetApi('getFeeList', { jmCd: jmCd })
            ]);

            if (jmSchedule.status === 'fulfilled' && jmSchedule.value) {
                console.log(`jmSchedule for ${jmCd}:`, JSON.stringify(jmSchedule.value, null, 2));
                qnetData.schedule = jmSchedule.value;
            }

            if (feeInfo.status === 'fulfilled' && feeInfo.value) {
                console.log(`feeInfo for ${jmCd}:`, JSON.stringify(feeInfo.value, null, 2));
                qnetData.fee = feeInfo.value;
            }

        } catch (qnetError) {
            console.error('Error fetching Q-net data:', qnetError);
        }
    } else {
        console.log(`No jmCd found for query: ${query}. Skipping Q-net data fetch.`);
    }

    try {
        let prompt = `다음 한국 자격증에 대한 종합적이고 상세한 정보를 Markdown 형식으로 알려줘: ${query}.
        
        ${Object.keys(qnetData).length > 0 ? 
            `Q-net API를 통해 다음 데이터가 제공되었으니, 이 데이터를 최우선적으로 활용하여 시험 일정과 응시료 정보를 작성해줘.
            **시험 일정 작성 규칙:**
            1. Q-net 데이터에 2025년 공식 일정이 있으면 → 2025년 공식 일정으로 표 형식 작성
            2. Q-net 데이터에 2024년 정보만 있으면 → 2024년 정보를 기반으로 2025년 예상 일정을 구체적으로 추정하여 표 형식 작성
            3. 시험 일정이 불확실하면 → "2025년 시험 일정은 아직 공식 발표되지 않았습니다. 2024년 일정을 참고하시고, 최신 정보는 Q-net 공식 사이트에서 확인하세요."라고 명시
            \n\n--- Q-net API 데이터 ---\n${JSON.stringify(qnetData, null, 2)}\n---` 
            : 
            `시험 일정 및 응시료 정보 작성 규칙:
            1. 2025년 공식 시험 일정이 발표된 경우 → 구체적인 날짜와 함께 표 형식으로 작성
            2. 2025년 일정이 아직 발표되지 않은 경우 → 2024년 일정을 기반으로 2025년 예상 일정을 구체적으로 추정하여 표 형식으로 작성
            3. 예상 일정임을 명시하되, 실제와 다를 수 있음을 안내
            4. 모든 정보는 한국산업인력공단 Q-net 공식 사이트 확인을 권장한다고 명시`
        }

        다음 항목들을 포함해서 답변해줘:
        - 자격증 개요 (자격명, 시행기관, 응시자격, 직무범위 등)
        - 시험 구성 (필기, 실기 과목 및 형식, 합격 기준)
        - 시험 일정 및 응시료 (2025년 예정)
        - 출제 경향
        - 취득 방법
        - 합격률 및 중요 포인트
        - 검정 현황
        - 우대 현황
        
        답변은 각 항목별로 명확한 소제목(예: ### 자격증 개요, ### 시험 구성, ### 시험 일정 및 응시료)을 붙여서 구분해줘.
        
        **중요한 형식 규칙:**
        1. 각 섹션은 반드시 ### 헤더로 시작해야 합니다
        2. 리스트 항목은 - 로 시작하고 줄바꿈으로 구분해주세요
        3. 표는 Markdown 표 형식(| 구분)으로 작성해주세요
        4. 각 섹션 사이에는 빈 줄을 넣어주세요
        5. 응시자격과 직무범위는 반드시 리스트 형식으로 작성해주세요
        6. 시험 일정은 표 형식으로 정리해주세요
        
        **예시 형식:**
        ### 자격증 개요
        
        **자격명**: 정보처리기사
        **시행기관**: 한국산업인력공단
        
        **응시자격**:
        - 고등학교 졸업자 또는 동등 이상의 학력이 있는 자
        - 정보처리 관련 실무경력 1년 이상
        - 정보처리기능사 자격을 취득한 후 실무경력 2년 이상
        
        **직무범위**:
        - 컴퓨터 시스템의 설계, 개발, 운영 및 유지보수
        - 데이터베이스 설계 및 관리
        - 네트워크 시스템 구축 및 관리
        - 정보보안 시스템 구축 및 운영`;

        console.log('Final prompt sent to Gemini:', prompt); // 로그 추가

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const searchResult = [{ name: query, fullContent: text }];
        
        // 캐시에 저장 (토큰 소모 방지)
        searchCache.set(cacheKey, {
            data: searchResult,
            timestamp: Date.now()
        });
        
        console.log(`Cached result for query: ${query}`);

        res.json(searchResult);

    } catch (error) {
        console.error('Error during Gemini API call:', error);
        res.status(500).json({ error: '자격증 정보를 가져오는 데 실패했습니다. Gemini API 키를 확인하거나, 요청 할당량을 확인해주세요.' });
    }
});

// 자격증 목록 (로컬 데이터 - 토큰 소모 방지)
const certificateList = [
    // IT/컴퓨터 관련
    '정보처리기사', '정보처리기능사', '컴퓨터활용능력 1급', '컴퓨터활용능력 2급',
    'SQLD', 'SQLP', 'ADsP', 'ADP', '빅데이터분석기사', '데이터분석준전문가',
    '정보보안기사', '정보보안산업기사', '정보보안기능사',
    '네트워크관리사', '사무자동화산업기사', '컴퓨터그래픽스운용기능사',
    '멀티미디어콘텐츠제작전문가', '웹디자인기능사', 'ITQ', 'MOS',
    
    // AWS/클라우드 관련
    'AWS Solutions Architect', 'AWS Developer', 'AWS SysOps Administrator',
    'AWS DevOps Engineer', 'AWS Security', 'AWS Database',
    
    // 쿠버네티스/컨테이너
    'CKA', 'CKAD', 'CKS', 'Docker Certified Associate',
    
    // 네트워크/시스템
    'CCNA', 'CCNP', 'CCIE', 'LPIC', '리눅스마스터',
    
    // 데이터베이스
    'OCP', 'OCA', 'MongoDB Certified Developer', 'MongoDB Certified DBA',
    
    // 기타 IT
    'PMP', 'ITIL', 'CISSP', 'CEH', 'CompTIA A+', 'CompTIA Network+',
    
    // 산업/기술 관련
    '산림기사', '산림산업기사', '조경기사', '조경산업기사',
    '건축기사', '건축산업기사', '토목기사', '토목산업기사',
    '전기기사', '전기산업기사', '전자기사', '전자산업기사',
    '기계기사', '기계산업기사', '화학기사', '화학산업기사',
    '환경기사', '환경산업기사', '안전기사', '안전산업기사',
    
    // 금융/경영
    '공인회계사', '세무사', '관세사', '변리사', '법무사',
    '공인노무사', '공인중개사', '보험계리사', '손해사정사',
    
    // 의료/보건
    '의사', '치과의사', '한의사', '약사', '간호사',
    '물리치료사', '작업치료사', '임상병리사', '방사선사',
    
    // 교육
    '교사', '사서', '사서교사', '사서직', '도서관사서',
    
    // 기타
    '기상기사', '기상산업기사', '항공기사', '항공산업기사',
    '해양기사', '해양산업기사', '농업기사', '농업산업기사'
];

// 자격증 자동 완성 API (하이브리드 방식 - 로컬 + AI 보조)
app.get('/api/autocomplete', async (req, res) => {
    console.log('Autocomplete request received:', req.query);
    const query = req.query.q ? req.query.q.toLowerCase() : '';
    console.log('Processed query:', query);
    
    if (!query || query.length < 2) { // 2글자 미만은 요청하지 않음
        console.log('Query too short, returning empty array');
        return res.json([]);
    }

    try {
        // 1단계: 로컬 데이터에서 검색 (빠름, 토큰 소모 없음)
        const localSuggestions = certificateList
            .filter(cert => cert.toLowerCase().includes(query))
            .slice(0, 8); // 로컬에서 최대 8개로 증가 (AI 호출 감소)

        console.log(`Found ${localSuggestions.length} local suggestions for query: ${query}`);

        // 2단계: 로컬에서 충분한 결과가 없으면 AI 보조 (임계값 조정)
        if (localSuggestions.length < 1) {
            console.log(`Local suggestions insufficient (${localSuggestions.length}), calling AI for assistance`);
            
            try {
                const prompt = `'${query}'를 포함하는 한국어 또는 영어 자격증 이름을 5개만 추천해줘. 
                
                규칙:
                1. 자격증 이름만 나열하고 설명은 포함하지 마세요
                2. 각 자격증 이름은 쉼표(,)로 구분하세요
                3. 실제 존재하는 자격증만 추천하세요
                4. 이미 제안된 자격증은 제외하세요: ${localSuggestions.join(', ')}
                
                응답은 자격증 이름만 쉼표로 구분해서 나열하세요.`;
                
                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();

                // AI 응답 파싱
                const aiSuggestions = text.split(',')
                    .map(s => s.trim())
                    .filter(s => s.length > 0 && s.length < 50)
                    .filter(s => !localSuggestions.includes(s)) // 중복 제거
                    .slice(0, 5);

                console.log(`AI provided ${aiSuggestions.length} additional suggestions`);

                // 로컬 + AI 결과 합치기
                const allSuggestions = [...localSuggestions, ...aiSuggestions]
                    .filter((v, i, a) => a.indexOf(v) === i) // 중복 제거
                    .slice(0, 10);

                console.log(`Total suggestions: ${allSuggestions.length} (Local: ${localSuggestions.length}, AI: ${aiSuggestions.length})`);
                res.json(allSuggestions);

            } catch (aiError) {
                console.error('AI assistance failed:', aiError);
                console.log('Falling back to local suggestions only');
                res.json(localSuggestions);
            }
        } else {
            // 로컬 결과만 반환 (토큰 소모 없음)
            console.log(`Using local suggestions only: ${localSuggestions.length} results`);
            res.json(localSuggestions);
        }

    } catch (error) {
        console.error('Error during autocomplete:', error);
        res.status(500).json({ error: '자동 완성 추천을 가져오는 데 실패했습니다.' });
    }
});

// 호환용 별칭 라우트: /api/search/autocomplete → 기존 핸들러와 동일한 로직
app.get('/api/search/autocomplete', async (req, res) => {
    console.log('Autocomplete request received (search route):', req.query);
    const query = req.query.q ? req.query.q.toLowerCase() : '';
    console.log('Processed query (search route):', query);
    
    if (!query || query.length < 2) { // 2글자 미만은 요청하지 않음
        console.log('Query too short, returning empty array');
        return res.json([]);
    }

    try {
        // 1단계: 로컬 데이터에서 검색 (빠름, 토큰 소모 없음)
        const localSuggestions = certificateList
            .filter(cert => cert.toLowerCase().includes(query))
            .slice(0, 8); // 로컬에서 최대 8개로 증가 (AI 호출 감소)

        console.log(`Found ${localSuggestions.length} local suggestions for query: ${query}`);

        // 2단계: 로컬에서 충분한 결과가 없으면 AI 보조 (임계값 조정)
        if (localSuggestions.length < 1) {
            console.log(`Local suggestions insufficient (${localSuggestions.length}), calling AI for assistance`);
            
            try {
                const prompt = `'${query}'를 포함하는 한국어 또는 영어 자격증 이름을 5개만 추천해줘. 
                
                규칙:
                1. 자격증 이름만 나열하고 설명은 포함하지 마세요
                2. 각 자격증 이름은 쉼표(,)로 구분하세요
                3. 실제 존재하는 자격증만 추천하세요
                4. 이미 제안된 자격증은 제외하세요: ${localSuggestions.join(', ')}
                
                응답은 자격증 이름만 쉼표로 구분해서 나열하세요.`;
                
                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();

                // AI 응답 파싱
                const aiSuggestions = text.split(',')
                    .map(s => s.trim())
                    .filter(s => s.length > 0 && s.length < 50)
                    .filter(s => !localSuggestions.includes(s)) // 중복 제거
                    .slice(0, 5);

                console.log(`AI provided ${aiSuggestions.length} additional suggestions`);

                // 로컬 + AI 결과 합치기
                const allSuggestions = [...localSuggestions, ...aiSuggestions]
                    .filter((v, i, a) => a.indexOf(v) === i) // 중복 제거
                    .slice(0, 10);

                console.log(`Total suggestions: ${allSuggestions.length} (Local: ${localSuggestions.length}, AI: ${aiSuggestions.length})`);
                res.json(allSuggestions);

            } catch (aiError) {
                console.error('AI assistance failed:', aiError);
                console.log('Falling back to local suggestions only');
                res.json(localSuggestions);
            }
        } else {
            // 로컬 결과만 반환 (토큰 소모 없음)
            console.log(`Using local suggestions only: ${localSuggestions.length} results`);
            res.json(localSuggestions);
        }

    } catch (error) {
        console.error('Error during autocomplete:', error);
        res.status(500).json({ error: '자동 완성 추천을 가져오는 데 실패했습니다.' });
    }
});


// 쿠버네티스 환경을 위한 서버 시작
app.listen(port, '0.0.0.0', () => {
    console.log(`Backend server listening on port ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Allowed origins: ${process.env.ALLOWED_ORIGINS || 'http://localhost:3000'}`);
});

// 쿠버네티스 헬스체크 엔드포인트
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        service: 'certificate-search-api'
    });
});

// 캐시 초기화 엔드포인트 (개발용)
app.post('/api/clear-cache', (req, res) => {
    clearCache();
    res.status(200).json({ 
        status: 'success', 
        message: 'Search cache cleared',
        timestamp: new Date().toISOString()
    });
});

// 쿠버네티스 준비 상태 체크 엔드포인트
app.get('/ready', (req, res) => {
    // 필수 환경변수 체크
    if (!GEMINI_API_KEY || !QNET_API_KEY) {
        return res.status(503).json({ 
            status: 'not ready', 
            message: 'Required environment variables are not set',
            missing: {
                GEMINI_API_KEY: !GEMINI_API_KEY,
                QNET_API_KEY: !QNET_API_KEY
            }
        });
    }
    
    res.status(200).json({ 
        status: 'ready', 
        timestamp: new Date().toISOString(),
        service: 'certificate-search-api'
    });
});

// 알라딘 배너용 상위 2개 도서 정보 반환 API
app.get('/api/ads/banner', async (req, res) => {
  try {
    const keyword = (req.query.keyword || '').toString().trim();
    
    if (!keyword) {
      return res.status(400).json({ error: 'keyword is required' });
    }
    
    if (!ALADIN_TTB_KEY) {
      return res.status(500).json({ error: 'ALADIN_TTB_KEY is not configured' });
    }
    
    // 알라딘 API 호출
    const url = 'http://www.aladin.co.kr/ttb/api/ItemSearch.aspx';
    const params = {
      ttbkey: ALADIN_TTB_KEY,
      Query: keyword,
      QueryType: 'Title',
      SearchTarget: 'Book',
      Sort: 'SalesPoint',
      MaxResults: 10,
      Output: 'XML',
      Version: '20131101',
      Cover: 'MidBig'
    };
    
    const response = await axios.get(url, { params, timeout: 10000 });
    
    // XML 파싱
    let items = [];
    if (typeof response.data === 'string') {
      const parser = new xml2js.Parser();
      const parsed = await parser.parseStringPromise(response.data);
      
      if (parsed && parsed.object && parsed.object.item) {
        items = Array.isArray(parsed.object.item) ? parsed.object.item : [parsed.object.item];
      }
    }
    
    // 상위 2개 책 정보만 반환
    const top = (items || []).slice(0, 2).map(item => ({
      title: item.title?.[0] || '',
      link: item.link?.[0] || '',
      cover: item.cover?.[0] || item.coverimg?.[0] || ''
    }));
    
    return res.json({ keyword, items: top });
    
  } catch (err) {
    console.error('Error in /api/ads/banner:', err.message);
    return res.status(500).json({ error: 'Failed to fetch banner items' });
  }
});