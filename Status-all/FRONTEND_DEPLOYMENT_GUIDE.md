# 🚀 프론트엔드 배포 가이드 - AWS EKS + API Gateway + S3 + CloudFront

## 📋 개요

이 가이드는 하이포 커뮤니티 플랫폼의 프론트엔드를 AWS EKS, API Gateway, S3, CloudFront를 활용하여 배포하는 방법을 설명합니다.

### **배포 아키텍처**
```
[사용자] 
    ↓
[CloudFront] (CDN + HTTPS)
    ↓
[S3] (정적 파일 저장)
    ↓
[API Gateway] (백엔드 API 프록시)
    ↓
[EKS ALB] (Application Load Balancer)
    ↓
[EKS Pods] (백엔드 서비스들)
```

---

## 🏗️ 1단계: API Gateway 설정

### **1.1 API Gateway 생성**

#### **AWS 콘솔에서 API Gateway 생성**
1. AWS 콘솔 → **API Gateway** 서비스로 이동
2. **"API 생성"** 클릭
3. **"REST API"** 선택 → **"구축"** 클릭
4. API 세부 정보 입력:
   ```
   API 이름: hippo-community-api
   설명: 하이포 커뮤니티 플랫폼 API Gateway
   엔드포인트 유형: 지역
   ```

### **1.2 리소스 및 메서드 생성**

#### **리소스 구조 (ANY 메소드 사용)**
```
/
├── /api
│   ├── /board
│   │   └── ANY (GET, POST, PUT, DELETE, OPTIONS 모두 처리)
│   │       ├── GET /api/board - 게시글 목록
│   │       ├── POST /api/board - 게시글 작성
│   │       ├── GET /api/board/{id} - 게시글 상세
│   │       ├── PUT /api/board/{id} - 게시글 수정
│   │       └── DELETE /api/board/{id} - 게시글 삭제
│   ├── /study-groups
│   │   └── ANY (GET, POST, PUT, DELETE, OPTIONS 모두 처리)
│   │       ├── GET /api/study-groups - 스터디 그룹 목록
│   │       ├── POST /api/study-groups - 스터디 그룹 생성
│   │       ├── GET /api/study-groups/{id} - 스터디 그룹 상세
│   │       ├── PUT /api/study-groups/{id} - 스터디 그룹 수정
│   │       └── DELETE /api/study-groups/{id} - 스터디 그룹 삭제
│   ├── /notifications
│   │   └── ANY (GET, POST, PUT, DELETE, OPTIONS 모두 처리)
│   │       ├── GET /api/notifications - 알림 목록
│   │       ├── PUT /api/notifications/{id}/read - 알림 읽음 처리
│   │       └── DELETE /api/notifications/{id} - 알림 삭제
│   ├── /jobs-news
│   │   └── ANY (GET, OPTIONS 처리)
│   │       └── GET /api/jobs-news - 취업 뉴스 목록
│   ├── /portfolio
│   │   └── ANY (POST, OPTIONS 처리)
│   │       └── POST /api/portfolio - AI 포트폴리오 피드백
│   └── /search
│       └── ANY (GET, POST, OPTIONS 처리)
│           ├── GET /api/search - 자격증 검색
│           ├── POST /api/search - 자격증 검색
│           ├── GET /api/autocomplete - 자격증 자동완성
│           └── GET /api/certificates - 자격증 목록
```

#### **리소스 생성 방법 (ANY 메소드)**
1. **루트 리소스 선택** → **"작업"** → **"리소스 생성"**
2. **리소스 이름**: `api` → **"리소스 생성"** (먼저 `/api` 리소스 생성)
3. **`/api` 리소스 선택** → **"작업"** → **"리소스 생성"**
4. **리소스 이름**: `board` → **"리소스 생성"**
5. 같은 방식으로 `study-groups`, `notifications`, `jobs-news`, `portfolio`, `search` 생성
6. 각 리소스에 `ANY` 메서드 추가 (모든 HTTP 메서드 처리)

#### **ANY 메소드 설정 방법**
1. **리소스 선택** → **"작업"** → **"메서드 생성"**
2. **HTTP 메서드**: `ANY` 선택
3. **통합 유형**: `HTTP 프록시` 선택
4. **HTTP 메서드**: `ANY` 선택
5. **엔드포인트 URL**: 백엔드 서비스 URL 입력

### **1.3 백엔드 서비스 연결**

#### **HTTP 프록시 통합 설정**
각 리소스의 메서드에 대해 HTTP 프록시 통합을 설정합니다:

| 리소스 | 백엔드 URL | 설명 |
|--------|------------|------|
| `/api/board` | `http://k8s-hippoapi-5ca1d6f5bb-347217567.ap-northeast-2.elb.amazonaws.com/api/board` | EKS ALB |
| `/api/study-groups` | `http://k8s-hippoapi-5ca1d6f5bb-347217567.ap-northeast-2.elb.amazonaws.com/api/study-groups` | EKS ALB |
| `/api/notifications` | `http://k8s-hippoapi-5ca1d6f5bb-347217567.ap-northeast-2.elb.amazonaws.com/api/notifications` | EKS ALB |
| `/api/jobs-news` | `http://k8s-hippoapi-5ca1d6f5bb-347217567.ap-northeast-2.elb.amazonaws.com/api/jobs-news` | EKS ALB |
| `/api/portfolio` | `http://k8s-hippoapi-5ca1d6f5bb-347217567.ap-northeast-2.elb.amazonaws.com/api/portfolio` | EKS ALB |
| `/api/search` | `http://k8s-hippoapi-5ca1d6f5bb-347217567.ap-northeast-2.elb.amazonaws.com/api/search` | EKS ALB |

#### **ANY 메소드 통합 설정 방법**
1. **ANY 메서드 선택** → **"통합 요청"** 클릭
2. **통합 유형**: `HTTP 프록시` 선택
3. **HTTP 메서드**: `ANY` 선택 (모든 HTTP 메서드 처리)
4. **엔드포인트 URL**: 백엔드 서비스 URL 입력
   ```
   예시: http://k8s-hippoapi-5ca1d6f5bb-347217567.ap-northeast-2.elb.amazonaws.com/api/board
   예시: http://k8s-hippoapi-5ca1d6f5bb-347217567.ap-northeast-2.elb.amazonaws.com/api/study-groups
   예시: http://k8s-hippoapi-5ca1d6f5bb-347217567.ap-northeast-2.elb.amazonaws.com/api/notifications
   예시: http://k8s-hippoapi-5ca1d6f5bb-347217567.ap-northeast-2.elb.amazonaws.com/api/jobs-news
   예시: http://k8s-hippoapi-5ca1d6f5bb-347217567.ap-northeast-2.elb.amazonaws.com/api/portfolio
   예시: http://k8s-hippoapi-5ca1d6f5bb-347217567.ap-northeast-2.elb.amazonaws.com/api/search
   ```

#### **ANY 메소드의 장점**
- **단순화**: 각 HTTP 메서드별로 별도 설정 불필요
- **유연성**: 모든 HTTP 메서드 자동 처리
- **확장성**: 새로운 엔드포인트 추가 시 자동 지원
- **CORS**: OPTIONS 요청 자동 처리

### **1.4 CORS 설정**

#### **CORS 활성화 (ANY 메소드용)**
각 리소스에 대해 CORS를 활성화합니다:

1. **리소스 선택** → **"작업"** → **"CORS 활성화"**
2. **액세스 제어 허용 헤더**: `Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token`
3. **액세스 제어 허용 메서드**: `GET,POST,PUT,DELETE,OPTIONS` (ANY 메소드이므로 모든 메소드 허용)
4. **액세스 제어 허용 원본**: `*` (개발 환경) 또는 특정 도메인
5. **"CORS 활성화 및 기존 CORS 헤더 교체"** 클릭

#### **ANY 메소드 CORS 장점**
- **OPTIONS 요청 자동 처리**: CORS preflight 요청 자동 처리
- **모든 메소드 지원**: GET, POST, PUT, DELETE, OPTIONS 모두 허용
- **단순한 설정**: 각 메소드별 CORS 설정 불필요

### **1.5 API 배포**

#### **스테이지 생성**
1. **"작업"** → **"스테이지 배포"**
2. **스테이지 이름**: `dev`
3. **스테이지 설명**: `개발 환경`
4. **"배포"** 클릭

#### **API Gateway URL 확인**
배포 후 생성되는 URL 형식:
```
https://7d1opsumn9.execute-api.ap-northeast-2.amazonaws.com/dev/api/board
https://7d1opsumn9.execute-api.ap-northeast-2.amazonaws.com/dev/api/study-groups
https://7d1opsumn9.execute-api.ap-northeast-2.amazonaws.com/dev/api/notifications
https://7d1opsumn9.execute-api.ap-northeast-2.amazonaws.com/dev/api/jobs-news
https://7d1opsumn9.execute-api.ap-northeast-2.amazonaws.com/dev/api/portfolio
https://7d1opsumn9.execute-api.ap-northeast-2.amazonaws.com/dev/api/search
```

---

## ☁️ 2단계: S3 버킷 설정

### **2.1 S3 버킷 생성**

#### **버킷 생성**
1. AWS 콘솔 → **S3** 서비스로 이동
2. **"버킷 만들기"** 클릭
3. 버킷 세부 정보 입력:
   ```
   버킷 이름: hippo-community-frontend
   리전: ap-northeast-2 (서울)
   퍼블릭 액세스 차단: 해제 (정적 웹사이트 호스팅을 위해)
   ```

#### **정적 웹사이트 호스팅 활성화**
1. **버킷 선택** → **"속성"** 탭
2. **"정적 웹사이트 호스팅"** → **"편집"**
3. **정적 웹사이트 호스팅**: `활성화`
4. **인덱스 문서**: `index.html`
5. **오류 문서**: `index.html` (SPA 라우팅을 위해)
6. **"변경 사항 저장"**

### **2.2 버킷 정책 설정**

#### **퍼블릭 읽기 액세스 허용**
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::hippo-community-frontend/*"
        }
    ]
}
```

### **2.3 CORS 설정**

#### **S3 버킷 CORS 설정**
```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "HEAD"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": []
    }
]
```

---

## 🌐 3단계: CloudFront 배포

### **3.1 CloudFront 배포 생성**

#### **배포 생성**
1. AWS 콘솔 → **CloudFront** 서비스로 이동
2. **"배포 생성"** 클릭
3. **원본 도메인**: S3 버킷 선택 (`hippo-community-frontend.s3.ap-northeast-2.amazonaws.com`)
4. **뷰어 프로토콜 정책**: `Redirect HTTP to HTTPS`
5. **기본 캐시 정책**: `CachingOptimized`

#### **Origin 추가 (API Gateway용)**
1. **"Origins"** 탭에서 **"Origin 추가"** 클릭
2. **Origin Domain**: `7d1opsumn9.execute-api.ap-northeast-2.amazonaws.com`
3. **Protocol**: `HTTPS only`
4. **Origin Path**: `/dev`
5. **Origin ID**: `api-gateway-origin` (자동 생성됨)

### **3.2 캐시 동작 설정**

#### **기본 캐시 동작 (정적 파일용)**
- **경로 패턴**: `Default (*)`
- **Origin**: S3 버킷 (`hippo-community-frontend.s3.ap-northeast-2.amazonaws.com`)
- **Viewer Protocol Policy**: `HTTPS only`
- **Allowed HTTP Methods**: `GET, HEAD, OPTIONS`
- **Cache Policy**: `CachingOptimized`
- **Origin Request Policy**: `CORS-S3Origin`
- **Response Headers Policy**: 선택 안함
- **Automatically compress objects**: `Yes`

#### **API 요청 캐시 동작 (API Gateway용)**
- **경로 패턴**: `/api/*`
- **Origin**: API Gateway (`7d1opsumn9.execute-api.ap-northeast-2.amazonaws.com`)
- **Viewer Protocol Policy**: `HTTPS only`
- **Allowed HTTP Methods**: `GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE`
- **Cache Policy**: `CachingDisabled` (API Gateway 권장 정책)
- **Origin Request Policy**: `AllViewerExceptHostHeader` (API Gateway 권장 정책)
- **Response Headers Policy**: 선택 안함
- **Automatically compress objects**: `Yes`
- **Restrict viewer access**: `No`

#### **Lambda@Edge 함수 연결**
- **모든 함수**: `None` (설정하지 않음)
- **이유**: 단순한 API 프록시이므로 Lambda@Edge 불필요

### **3.3 오류 페이지 설정**

#### **SPA 라우팅을 위한 오류 페이지**
1. **"오류 페이지"** 탭 → **"오류 페이지 만들기"**
2. **HTTP 오류 코드**: `403`
3. **오류 페이지 경로**: `/index.html`
4. **HTTP 응답 코드**: `200`

---

## 🔧 4단계: 프론트엔드 빌드 및 배포

### **4.1 환경 변수 설정**

#### **프로덕션 환경 변수**
`frontend/.env.production` 파일 생성:
```env
# API Gateway URL (실제 배포된 URL)
VITE_API_GATEWAY_URL=https://7d1opsumn9.execute-api.ap-northeast-2.amazonaws.com/dev

# CloudFront URL (배포 완료 후 실제 URL로 변경)
VITE_CLOUDFRONT_URL=https://[CLOUDFRONT_DISTRIBUTION_ID].cloudfront.net

# Cognito 설정 (기존 설정 사용)
VITE_COGNITO_USER_POOL_ID=ap-northeast-2_VrMMVwNd8
VITE_COGNITO_CLIENT_ID=2b797ioh6lhc571p8k463n3fmt
VITE_COGNITO_REGION=ap-northeast-2

# API Gateway 사용 활성화
VITE_USE_API_GATEWAY=true

# 환경 설정
NODE_ENV=production
VITE_NODE_ENV=production
```

### **4.2 프론트엔드 빌드**

#### **빌드 명령어**
```bash
cd frontend
npm run build
```

#### **빌드 결과**
- `frontend/dist/` 폴더에 정적 파일들이 생성됩니다.

### **4.3 S3 업로드**

#### **AWS CLI를 사용한 업로드**
```bash
# AWS CLI 설치 및 설정
aws configure

# S3 버킷에 파일 업로드
aws s3 sync frontend/dist/ s3://hippo-community-frontend --delete

# 또는 특정 파일만 업로드
aws s3 cp frontend/dist/index.html s3://hippo-community-frontend/
```

#### **AWS 콘솔을 사용한 업로드**
1. S3 버킷 → **"업로드"** 클릭
2. `frontend/dist/` 폴더의 모든 파일 선택
3. **"업로드"** 클릭

---

## 🔐 5단계: Cognito 인증 연동

### **5.1 Cognito 설정 확인**

#### **기존 Cognito User Pool 정보**
- **User Pool ID**: `ap-northeast-2_VrMMVwNd8`
- **App Client ID**: `2b797ioh6lhc571p8k463n3fmt`

### **5.2 프론트엔드 Cognito SDK 설정**

#### **Cognito SDK 설치**
```bash
cd frontend
npm install amazon-cognito-identity-js
```

#### **Cognito 설정 파일**
`frontend/src/config/cognito.ts` 생성:
```typescript
import { CognitoUserPool } from 'amazon-cognito-identity-js';

export const cognitoConfig = {
  UserPoolId: 'ap-northeast-2_VrMMVwNd8',
  ClientId: '2b797ioh6lhc571p8k463n3fmt'
};

export const userPool = new CognitoUserPool(cognitoConfig);
```

### **5.3 인증 컴포넌트 구현**

#### **로그인 컴포넌트 예시**
```typescript
import { CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';
import { userPool } from '../config/cognito';

export const login = (username: string, password: string) => {
  return new Promise((resolve, reject) => {
    const authenticationDetails = new AuthenticationDetails({
      Username: username,
      Password: password,
    });

    const cognitoUser = new CognitoUser({
      Username: username,
      Pool: userPool,
    });

    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (result) => {
        resolve(result);
      },
      onFailure: (err) => {
        reject(err);
      },
    });
  });
};
```

---

## 🚀 6단계: 배포 완료 및 테스트

### **6.1 배포 확인**

#### **CloudFront URL 접속**
```
https://[CLOUDFRONT_DISTRIBUTION_ID].cloudfront.net
```

#### **API Gateway 직접 테스트**
```bash
# API Gateway 엔드포인트 직접 테스트
curl https://7d1opsumn9.execute-api.ap-northeast-2.amazonaws.com/dev/api/board
curl https://7d1opsumn9.execute-api.ap-northeast-2.amazonaws.com/dev/api/study-groups
curl https://7d1opsumn9.execute-api.ap-northeast-2.amazonaws.com/dev/api/notifications
curl https://7d1opsumn9.execute-api.ap-northeast-2.amazonaws.com/dev/api/jobs-news
curl https://7d1opsumn9.execute-api.ap-northeast-2.amazonaws.com/dev/api/portfolio
curl https://7d1opsumn9.execute-api.ap-northeast-2.amazonaws.com/dev/api/search
```

#### **CloudFront를 통한 API 테스트**
```bash
# CloudFront를 통한 API 엔드포인트 테스트
curl https://[CLOUDFRONT_DISTRIBUTION_ID].cloudfront.net/api/board
curl https://[CLOUDFRONT_DISTRIBUTION_ID].cloudfront.net/api/study-groups
curl https://[CLOUDFRONT_DISTRIBUTION_ID].cloudfront.net/api/notifications
curl https://[CLOUDFRONT_DISTRIBUTION_ID].cloudfront.net/api/jobs-news
curl https://[CLOUDFRONT_DISTRIBUTION_ID].cloudfront.net/api/portfolio
curl https://[CLOUDFRONT_DISTRIBUTION_ID].cloudfront.net/api/search
```

### **6.2 기능 테스트**

#### **테스트 체크리스트**
- [ ] 홈페이지 로딩 확인
- [ ] 게시판 기능 테스트
- [ ] 스터디 그룹 기능 테스트
- [ ] 알림 시스템 테스트
- [ ] AI 포트폴리오 기능 테스트
- [ ] 취업 뉴스 기능 테스트
- [ ] Cognito 로그인/로그아웃 테스트
- [ ] 모바일 반응형 테스트

---

## 📝 7단계: 환경 변수 업데이트

### **7.1 프론트엔드 API 설정 업데이트**

#### **API Gateway URL로 업데이트**
`frontend/src/config/api.ts` 파일의 `apiGateway` 섹션 업데이트:
```typescript
apiGateway: {
  baseURL: 'https://7d1opsumn9.execute-api.ap-northeast-2.amazonaws.com/dev',
  endpoints: {
    board: '/api/board',
    studyGroups: '/api/study-groups',
    notifications: '/api/notifications',
    jobsNews: '/api/jobs-news',
    search: '/api/search',
    autocomplete: '/api/autocomplete',
    portfolio: '/api/portfolio'
  }
}
```

### **7.2 환경 변수 활성화**
```bash
# 프론트엔드에서 API Gateway 사용하도록 설정
export VITE_USE_API_GATEWAY=true
npm run build
```

---

## 🔧 8단계: 문제 해결

### **8.1 일반적인 문제들**

#### **CORS 오류**
- API Gateway의 CORS 설정 확인
- S3 버킷의 CORS 설정 확인
- 프론트엔드 요청 헤더 확인

#### **404 오류 (SPA 라우팅)**
- CloudFront 오류 페이지 설정 확인
- S3 정적 웹사이트 호스팅 설정 확인

#### **API 연결 오류**
- API Gateway 엔드포인트 URL 확인
- EKS 백엔드 서비스 실행 상태 확인
- HTTP 프록시 통합 설정 확인

### **8.2 디버깅 명령어**

#### **CloudFront 캐시 무효화**
```bash
aws cloudfront create-invalidation --distribution-id [DISTRIBUTION_ID] --paths "/*"
```

#### **API Gateway 로그 확인**
- CloudWatch 로그에서 API Gateway 로그 확인
- EKS 백엔드 서비스 로그 확인

#### **EKS 서비스 상태 확인**
```bash
# EKS 클러스터 상태 확인
kubectl get pods -n hippo-project
kubectl get services -n hippo-project
kubectl get ingress -n hippo-project

# 특정 서비스 로그 확인
kubectl logs -f deployment/community-board-deployment -n hippo-project
kubectl logs -f deployment/study-group-deployment -n hippo-project
kubectl logs -f deployment/notification-deployment -n hippo-project
```

---

## 📊 9단계: 모니터링 및 최적화

### **9.1 CloudWatch 모니터링**

#### **설정할 메트릭**
- CloudFront 요청 수
- API Gateway 요청 수
- EKS 클러스터 메트릭
- 오류율
- 응답 시간

### **9.2 성능 최적화**

#### **CloudFront 최적화**
- 캐시 정책 조정
- 압축 설정 최적화
- 지리적 위치 기반 라우팅

#### **API Gateway 최적화**
- 캐싱 활성화
- 요청 제한 설정
- 로깅 최적화

#### **EKS 최적화**
- Pod 리소스 제한 설정
- Horizontal Pod Autoscaler 설정
- 클러스터 노드 최적화

---

## 🎯 완료 체크리스트

### **API Gateway**
- [x] API Gateway 생성 완료
- [x] 리소스 및 메서드 생성 완료
- [x] 백엔드 서비스 연결 완료
- [x] CORS 설정 완료
- [x] API 배포 완료

### **S3 + CloudFront**
- [x] S3 버킷 생성 완료
- [x] 정적 웹사이트 호스팅 활성화 완료
- [x] 버킷 정책 설정 완료
- [x] CloudFront 배포 생성 완료
- [x] 캐시 동작 설정 완료

### **프론트엔드**
- [x] 환경 변수 설정 완료
- [x] 프론트엔드 빌드 완료
- [x] S3 업로드 완료
- [x] Cognito 연동 완료

### **테스트**
- [x] 홈페이지 접속 테스트 완료
- [x] API 연결 테스트 완료
- [x] 인증 기능 테스트 완료
- [x] 모바일 반응형 테스트 완료

---

## 📞 연락처 및 참고사항

### **리소스 명명 규칙**
- **API Gateway**: `hippo-community-api`
- **S3 버킷**: `hippo-community-frontend`
- **CloudFront**: `hippo-community-cdn`
- **Cognito User Pool**: `ap-northeast-2_VrMMVwNd8`
- **EKS 클러스터**: `hippo-project`

### **리전 정보**
- **기본 리전**: `ap-northeast-2` (서울)
- **모든 리소스**: 동일한 리전에 배치

### **비용 예상**
- **API Gateway**: 요청당 과금
- **S3**: 스토리지 및 전송 비용
- **CloudFront**: 전송 비용
- **Cognito**: 사용자당 과금
- **EKS**: 노드 시간당 과금

---

## 🚨 현재 운영 상태 및 주의사항

### **✅ 완료된 작업**
- 프론트엔드 S3+CloudFront 배포 완료
- API Gateway 설정 및 연동 완료
- EKS 백엔드 서비스 배포 완료
- 알림 서비스 통합 완료
- 사용자 계정 관리 기능 완료

### **⚠️ 주의사항**
- API Gateway 엔드포인트는 `dev` 스테이지에 배포됨
- EKS ALB 엔드포인트는 동적으로 변경될 수 있음
- 프론트엔드 빌드 시 환경 변수 확인 필요

### **🔧 다음 단계**
- 프로덕션 환경으로 스테이지 전환 검토
- 모니터링 및 로깅 강화
- 성능 최적화 및 부하 테스트

---

*마지막 업데이트: 2025년 9월 2일*
*작성자: AI Assistant*
*프로젝트: 하이포 커뮤니티 플랫폼 - 프론트엔드 배포 가이드*
*현재 상태: 운영 중 (AWS EKS + API Gateway + S3 + CloudFront)*
