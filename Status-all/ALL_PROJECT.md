# 🚀 Hippo 프로젝트 - 취업준비생 커뮤니티 플랫폼

## 📋 프로젝트 개요

### **프로젝트명**: Hippo (취업준비생 커뮤니티 플랫폼)
### **아키텍처**: 마이크로서비스 아키텍처 (MSA)
### **인프라**: AWS EKS (Kubernetes) + Terraform IaC
### **배포 환경**: 로컬 개발 환경, AWS 프로덕션 환경

---

## 🏗️ 시스템 아키텍처

### **프로덕션 아키텍처 (AWS)**

```
[사용자]
    ↓
[Route 53] - DNS 관리
    ↓
[CloudFront] - CDN (프론트엔드 정적 파일)
    ↓
[S3] - 프론트엔드 호스팅
    ↓
[API Gateway] - API 라우팅 및 CORS 관리
    ↓
[ALB] - Application Load Balancer (고가용성)
    ↓
[EKS Cluster] - Kubernetes (Multi-AZ)
    ├── [AZ 2a]
    │   ├── Backend Nodes (t3.medium)
    │   │   ├── community-board-api (Pod x2)
    │   │   ├── study-group-api (Pod x2)
    │   │   ├── notification-api (Pod x2)
    │   │   ├── ai-portfolio-api (Pod x2)
    │   │   ├── certificate-search-api (Pod x2)
    │   │   └── jobs-news-api (Pod x2)
    │   ├── Monitoring Node (t3.large)
    │   │   ├── Prometheus
    │   │   └── Grafana
    │   └── NAT Gateway 2a
    │
    └── [AZ 2c]
        ├── Backend Nodes (t3.medium)
        │   ├── community-board-api (Pod x2)
        │   ├── study-group-api (Pod x2)
        │   ├── notification-api (Pod x2)
        │   ├── ai-portfolio-api (Pod x2)
        │   ├── certificate-search-api (Pod x2)
        │   └── jobs-news-api (Pod x2)
        └── NAT Gateway 2c
    ↓
[RDS PostgreSQL] - Multi-AZ (통합 데이터베이스)
```

### **고가용성 (High Availability) 구성**
- ✅ **Multi-AZ 배포**: 2개의 가용 영역 (ap-northeast-2a, 2c)
- ✅ **Pod Anti-Affinity**: 각 서비스의 Pod가 서로 다른 AZ에 배치
- ✅ **Multi-AZ NAT Gateway**: 각 AZ마다 독립적인 NAT Gateway
- ✅ **Multi-AZ RDS**: Primary/Standby 자동 Failover
- ✅ **ALB 자동 라우팅**: 장애 발생 시 정상 Pod로만 트래픽 전달

---

## 🎨 구현된 서비스 (Microservices)

### **1. 커뮤니티 게시판 API** (`community-board-api-unified`)
- **포트**: 3002
- **언어**: Node.js + TypeScript
- **데이터베이스**: PostgreSQL (`board` 스키마)
- **주요 기능**:
  - 게시글 CRUD (생성, 조회, 수정, 삭제)
  - 댓글 시스템 (수정/삭제 포함)
  - 실시간 인기글 (추천 10개 이상)
  - 페이지네이션 (10개씩, 5페이지 그룹핑)
  - 검색 기능 (게시판별 + 통합검색)
  - 관리자 권한 시스템
  - 조회수 및 추천수 카운팅
  - 댓글 마일스톤 알림 (50단위)
  - Prometheus 메트릭 수집

### **2. 스터디 그룹 API** (`study-group-api`)
- **포트**: 3003
- **언어**: Node.js + TypeScript
- **데이터베이스**: PostgreSQL (`study` 스키마)
- **주요 기능**:
  - 스터디 그룹 CRUD
  - 멤버 관리 (가입/탈퇴/목록)
  - 모임 일정 관리 (생성/수정/삭제)
  - 출석 관리 시스템
  - 카테고리별 필터링 (IT, 어학, 자격증, 취업, 기타)
  - 지역 태그 기반 필터링
  - 고급 검색 기능
  - 알림 시스템 연동

### **3. 알림 서비스 API** (`notification-api`)
- **포트**: 3004
- **언어**: Node.js + TypeScript
- **데이터베이스**: PostgreSQL (`notification` 스키마)
- **주요 기능**:
  - 실시간 알림 관리
  - 읽음/삭제 기능
  - 알림 타입별 분류 (스터디, 게시판, 댓글)
  - HTTP 기반 알림 수신
  - 사용자별 알림 필터링
  - 주기적 폴링 지원

### **4. AI 포트폴리오 피드백 API** (`ai-portfolio`)
- **포트**: 4000
- **언어**: Node.js + JavaScript
- **저장 방식**: In-memory
- **주요 기능**:
  - AI 기반 자기소개서 분석 (Gemini AI)
  - 구조화된 피드백 제공
  - NCS 직무 검색 연동
  - Perplexity AI 검색 기능
  - 메모리 오버플로우 방지
  - Health check 엔드포인트

### **5. 자격증 검색 API** (`certificate-search`)
- **포트**: 5000
- **언어**: Node.js + JavaScript
- **주요 기능**:
  - 자격증 정보 검색
  - Q-Net API 연동
  - Gemini AI 기반 자격증 추천
  - Health check 엔드포인트

### **6. 취업 뉴스 API** (`jobs-news-api`)
- **포트**: 3006
- **언어**: Node.js + TypeScript
- **주요 기능**:
  - RSS 피드 크롤링 (뉴스앤잡)
  - 워크넷 API 연동
  - 30분 캐싱 시스템
  - 강제 새로고침 지원 (`force=1`)
  - Health check 엔드포인트

---

## 🎨 프론트엔드 구현

### **기술 스택**
- React 18 + TypeScript
- Vite (빌드 도구)
- Tailwind CSS (스타일링)
- Axios (HTTP 클라이언트)

### **주요 페이지 및 기능**

#### **1. 메인 페이지 (홈)**
- 공지사항 슬라이더 (애니메이션)
- 실시간 인기글 위젯
- 스터디 모임 위젯 (실제 데이터 연동)
- 취업 뉴스 위젯 (30분 캐싱)
- AI 도구 바로가기
- 반응형 네비게이션 메뉴

#### **2. 게시판 페이지**
- 5개 카테고리 (공지사항, 자유게시판, 채용공고, 취업후기, 진로상담)
- 게시글 CRUD 기능
- 댓글 시스템 (수정/삭제)
- 페이지네이션 (10개씩)
- 검색 기능 (통합검색 + 게시판별)
- 실시간 인기글 표시
- 관리자 권한 시스템
- URL 상태 관리 (새로고침 대응)

#### **3. 스터디 모임 페이지**
- 스터디 그룹 목록 (카드형 UI)
- 상세 페이지 (정보/멤버/일정 탭)
- 스터디 그룹 생성/수정/삭제
- 멤버 가입/탈퇴
- 모임 일정 관리
- 출석 체크 시스템
- 고급 검색 및 필터링
- 페이지네이션 (9개씩)
- 모바일 최적화

#### **4. AI 포트폴리오 페이지**
- 텍스트 기반 자기소개서 입력
- AI 분석 및 피드백 표시
- 구조화된 결과 (강점/개선점/제안)
- 반응형 디자인

#### **5. 취업 뉴스 페이지**
- 뉴스 목록 (카드형 UI)
- 페이지네이션 (10개씩)
- 새로고침 기능
- 뉴스 개수 표시
- 전체 영역 클릭 가능

#### **6. 마이페이지**
- 내가 쓴 글 목록
- 내가 쓴 댓글 목록
- 내가 만든 스터디
- 내가 참여한 스터디
- 페이지네이션 지원

#### **7. 알림 시스템**
- 실시간 알림 드롭다운
- 읽음/삭제 기능
- 모든 알림 보기 모달
- 모든 알림 삭제
- 알림 클릭 시 페이지 이동

### **환경별 API 설정**
- **개발 환경**: `localhost` 기반 (Vite Proxy)
- **프로덕션 환경**: API Gateway 또는 ALB 기반
- **자동 환경 감지**: `VITE_USE_API_GATEWAY` 환경 변수

---

## 🗄️ 데이터베이스 구조

### **통합 PostgreSQL 데이터베이스**
- **데이터베이스명**: `hippo_unified_db`
- **사용자**: `hippo_user`
- **포트**: 5432
- **버전**: PostgreSQL 17.6 (프로덕션), 14 (로컬)

### **스키마별 구조**

#### **1. board 스키마** (게시판)
- `categories` - 게시판 카테고리
- `posts` - 게시글 (view_count, like_count, comment_count, is_hot)
- `comments` - 댓글
- `likes` - 추천 (UNIQUE 제약조건으로 중복 방지)

#### **2. study 스키마** (스터디 그룹)
- `study_groups` - 스터디 그룹
- `group_members` - 멤버
- `meetings` - 모임 일정
- `meeting_attendees` - 출석

#### **3. notification 스키마** (알림)
- `notifications` - 알림 (user_id, type, title, message, is_read)

---

## ☁️ AWS 인프라 구성 (Terraform)

### **네트워크 (VPC)**
- **CIDR**: 10.0.0.0/16
- **가용 영역**: ap-northeast-2a, 2c (Multi-AZ)
- **Public Subnet**: 2개 (각 AZ마다 1개, ALB 배치)
- **Private Subnet**: 2개 (각 AZ마다 1개, EKS 노드 배치)
- **NAT Gateway**: 2개 (각 AZ마다 1개, 고가용성)
- **Elastic IP**: 2개 (NAT Gateway용)
- **Internet Gateway**: 1개

### **보안 그룹 (Security Groups)**
- **EKS Cluster SG**: EKS Control Plane용
- **EKS Worker SG**: Worker Node 및 Pod용 (Worker-to-Worker 통신 허용)
- **RDS SG**: PostgreSQL용 (Worker Node에서만 접근 가능)
- **ALB SG**: ALB Controller가 자동 생성/관리

### **컴퓨팅 (EKS)**
- **클러스터명**: `hippo-eks-dev`
- **Kubernetes 버전**: 1.28
- **노드 그룹**:
  - **Backend Nodes**: 2개 (t3.medium, 각 AZ에 1개씩)
  - **Monitoring Node**: 1개 (t3.large, 단일 AZ)
- **노드 라벨 및 Taint**: 
  - Backend: `node-type=backend`
  - Monitoring: `node-type=monitoring`
- **Pod 배치 전략**: Pod Anti-Affinity로 Multi-AZ 분산

### **데이터베이스 (RDS)**
- **엔진**: PostgreSQL 17.6
- **인스턴스**: db.t3.micro
- **Multi-AZ**: 활성화 (프로덕션)
- **백업**: 7일 보관
- **성능 모니터링**: Performance Insights 활성화
- **로그 내보내기**: CloudWatch Logs 연동

### **프론트엔드 (S3 + CloudFront)**
- **S3 버킷**: 정적 파일 호스팅
- **CloudFront**: CDN 배포
- **도메인**: `seesun.cloud`
- **SSL 인증서**: AWS Certificate Manager (ACM)

### **API Gateway**
- **타입**: REST API v1
- **CORS**: CloudFront 도메인 허용
- **백엔드 연동**: ALB DNS
- **엔드포인트**: `/api/*`
- **OpenAPI 백업**: 자동 백업 스크립트

### **로드 밸런싱 (ALB)**
- **타입**: Application Load Balancer
- **생성 방식**: ALB Controller가 Ingress 기반 자동 생성
- **배치**: Public Subnet (Multi-AZ)
- **헬스 체크**: `/health` 엔드포인트
- **보안**: ALB Controller가 보안 그룹 자동 관리

### **IAM 및 권한**
- **EKS Cluster Role**: EKS 관리 권한
- **EKS Node Group Role**: Worker Node 권한
- **ALB Controller Role**: OIDC Provider 기반 IRSA
- **ALB Controller Policy**: ELB, EC2, WAF 권한

---

## 🐳 컨테이너화 (Docker)

### **Docker Hub 이미지**
- `ball2550/community-board-api:latest`
- `ball2550/study-group-api:latest`
- `ball2550/notification-api:latest`
- `ball2550/ai-portfolio-api:latest`
- `ball2550/certificate-search-api:latest`
- `ball2550/jobs-news-api:latest`

### **Kubernetes 배포 전략**
- **Replicas**: 2개 (각 AZ에 1개씩)
- **Image Pull Policy**: `Always`
- **Image Pull Secret**: `docker-hub-secret`
- **Health Check**: liveness + readiness probe
- **Resource Limits**: CPU/Memory 제한 설정

---

## 📊 구현 현황

### **✅ 백엔드 서비스**
- [x] 커뮤니티 게시판 API (완전 구현)
- [x] 스터디 그룹 API (완전 구현)
- [x] 알림 서비스 API (완전 구현)
- [x] AI 포트폴리오 피드백 API (완전 구현)
- [x] 자격증 검색 API (완전 구현)
- [x] 취업 뉴스 API (완전 구현)
- [x] 통합 PostgreSQL DB 마이그레이션
- [x] Docker 이미지 빌드 및 Docker Hub 배포
- [x] Prometheus 메트릭 수집

### **✅ 프론트엔드**
- [x] React + TypeScript + Vite 기반 SPA
- [x] 메인 페이지 (홈)
- [x] 게시판 페이지 (5개 카테고리)
- [x] 스터디 모임 페이지
- [x] AI 포트폴리오 페이지
- [x] 취업 뉴스 페이지
- [x] 마이페이지
- [x] 알림 시스템
- [x] 반응형 UI (모바일 최적화)
- [x] URL 상태 관리
- [x] S3 + CloudFront 배포

### **✅ 인프라 (Terraform)**
- [x] VPC 및 네트워크 구성 (Multi-AZ)
- [x] NAT Gateway 2개 (고가용성)
- [x] 보안 그룹 설정
- [x] EKS 클러스터 및 노드 그룹
- [x] RDS PostgreSQL (Multi-AZ)
- [x] ALB Controller 설정
- [x] S3 + CloudFront
- [x] API Gateway
- [x] Route 53 DNS
- [x] IAM 역할 및 정책

### **✅ Kubernetes 배포**
- [x] Namespace 설정
- [x] Secret 관리 (DB 연결, Docker Hub)
- [x] 백엔드 Deployment (6개 서비스)
- [x] Service 설정 (ClusterIP)
- [x] Ingress 설정 (ALB)
- [x] Pod Anti-Affinity (Multi-AZ 분산)
- [x] Resource Limits
- [x] Health Check

### **✅ CI/CD**
- [x] GitHub Actions 파이프라인
- [x] 프론트엔드 S3 자동 배포
- [x] 백엔드 Docker Hub 푸시
- [x] EKS Rolling Update
- [x] CloudFront 캐시 무효화

### **✅ 모니터링** (팀원 구현)
- [x] Prometheus 메트릭 수집
- [x] Grafana 대시보드
- [x] 서비스별 메트릭
- [x] 알림 규칙 설정

---

## 🎯 주요 기능

### **사용자 기능**
- ✅ 회원 관리 (임시 로그인 시스템)
- ✅ 게시글 작성/수정/삭제
- ✅ 댓글 작성/수정/삭제
- ✅ 게시글 추천 (중복 방지)
- ✅ 실시간 인기글 확인
- ✅ 게시판 검색 (통합검색 + 게시판별)
- ✅ 스터디 그룹 생성/참여
- ✅ 모임 일정 관리
- ✅ 출석 체크
- ✅ 실시간 알림 수신
- ✅ AI 포트폴리오 피드백
- ✅ 자격증 정보 검색
- ✅ 취업 뉴스 확인

### **관리자 기능**
- ✅ 모든 게시글 삭제 권한
- ✅ 공지사항 작성 권한
- ✅ 스터디 그룹 삭제 권한
- ✅ 중복 추천 가능 (테스트용)

### **시스템 기능**
- ✅ 자동 조회수 카운팅
- ✅ 자동 댓글 수 카운팅
- ✅ 실시간 인기글 플래그 (추천 10개 이상)
- ✅ 댓글 마일스톤 알림 (50단위)
- ✅ 추천수 마일스톤 알림 (50단위)
- ✅ 스터디 멤버 변동 알림
- ✅ 취업 뉴스 30분 캐싱
- ✅ Prometheus 메트릭 수집

---

## 🛠️ 로컬 개발 환경 실행

### **사전 요구사항**
- Docker & Docker Compose
- Node.js 18+ & npm
- PostgreSQL Client (선택사항)

### **데이터베이스 실행**
```bash
# PostgreSQL 실행
docker-compose -f docker-compose.db-only.yml up -d

# 초기화 스크립트 자동 실행 (init-unified-database.sql)
```

### **백엔드 서비스 실행**
```bash
# 커뮤니티 게시판
cd backend/community-board-api-unified
npm install && npm run build && npm start

# 스터디 그룹
cd backend/study-group-api
npm install && npm start

# 알림 서비스
cd backend/notification-api
npm install && npm start

# AI 포트폴리오
cd backend/ai-portfolio
npm install && npm start

# 자격증 검색
cd backend/certificate-search
npm install && npm start

# 취업 뉴스
cd backend/jobs-news-api
npm install && npm start
```

### **프론트엔드 실행**
```bash
cd frontend
npm install
npm run dev
```

### **접속**
- 프론트엔드: http://localhost:5173
- 백엔드 API들: http://localhost:300X

---

## 🚀 AWS 배포 방법

### **1. Terraform 인프라 생성**
```bash
# 네트워크
cd terraform/stages/01-network
terraform init && terraform apply

# 보안 그룹
cd ../02-security
terraform init && terraform apply

# EKS
cd ../03-eks
terraform init && terraform apply

# ALB Controller
cd ../04-alb-controller
terraform init && terraform apply

# RDS
cd ../06-rds
terraform init && terraform apply

# 프론트엔드 (S3 + CloudFront)
cd ../05-frontend
terraform init && terraform apply

# API Gateway
cd ../07-api-gateway
terraform init && terraform apply
```

### **2. Kubernetes 배포**
```bash
# EKS 연결
aws eks update-kubeconfig --region ap-northeast-2 --name hippo-eks-dev

# 배포
kubectl apply -f k8s-eks/01-namespace/
kubectl apply -f k8s-eks/02-secrets/
kubectl apply -f k8s-eks/03-backend/
kubectl apply -f k8s-eks/04-ingress/

# 상태 확인
kubectl get pods -n hippo-project -o wide
kubectl get ingress -n hippo-project
```

### **3. 프론트엔드 배포**
```bash
cd frontend
npm run build
aws s3 sync dist/ s3://hippo-community-frontend
aws cloudfront create-invalidation --distribution-id ESYDE68D76JLM --paths "/*"
```

---

## 💰 비용 분석 (프로덕션 환경)

| 리소스 | 수량 | 월 예상 비용 |
|--------|------|-------------|
| EKS Cluster | 1개 | $72 |
| Backend Nodes (t3.medium) | 2개 | $60.74 |
| Monitoring Node (t3.large) | 1개 | $60.74 |
| NAT Gateway | 2개 | $65.70 |
| RDS PostgreSQL (t3.micro, Multi-AZ) | 1개 | $24.82 |
| S3 + CloudFront | - | ~$5 |
| Route 53 | 1개 | $0.50 |
| 데이터 전송 | 변동 | ~$20 |
| **합계** | - | **~$310/월** |

---

## 📚 관련 문서

- **`DATABASE_STRUCTURE.md`**: 통합 PostgreSQL DB 구조 설명
- **`FRONTEND_DEPLOYMENT_GUIDE.md`**: 프론트엔드 배포 가이드
- **`BACKUP_GUIDE.md`**: 백업 및 복원 가이드
- **`terraform/`**: Terraform IaC 코드
- **`k8s-eks/`**: Kubernetes 매니페스트 파일
- **`k8s-minikube/`**: 로컬 테스트용 매니페스트

---

## 🎓 프로젝트 특징

### **기술적 특징**
- ✅ 마이크로서비스 아키텍처 (MSA)
- ✅ 컨테이너 기반 배포 (Docker + Kubernetes)
- ✅ Infrastructure as Code (Terraform)
- ✅ Multi-AZ 고가용성 구성
- ✅ 자동 스케일링 준비
- ✅ 모니터링 시스템 (Prometheus + Grafana)
- ✅ CI/CD 파이프라인 (GitHub Actions)
- ✅ RESTful API 설계
- ✅ TypeScript 기반 타입 안정성

### **비즈니스 특징**
- ✅ 취업준비생 맞춤 커뮤니티
- ✅ 스터디 그룹 매칭 시스템
- ✅ AI 기반 포트폴리오 피드백
- ✅ 실시간 알림 시스템
- ✅ 취업 뉴스 자동 수집
- ✅ 자격증 정보 통합 검색

---

## 📞 프로젝트 정보

- **프로젝트명**: Hippo (취업준비생 커뮤니티 플랫폼)
- **아키텍처**: Microservices Architecture (MSA)
- **인프라**: AWS EKS + Terraform
- **개발 기간**: 2025년 8월 ~ 10월
- **팀 구성**: 5명 (프론트엔드 2명, 백엔드 3명)

---

*최종 업데이트: 2025년 10월 17일*
