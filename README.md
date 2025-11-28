##SeeSun 아키텍처 프로젝트  
MSA 기반 AWS Cloud Architecture

본 레포지토리는 SeeSun 서비스의 **MSA 기반 AWS 클라우드 아키텍처**를 이해하고  
백엔드 API 흐름 및 서비스 구조 설계에 참여한 내용을 정리한 저장소입니다.

제가 담당했던 영역은 다음과 같습니다.

---

## 🏗 아키텍처 개요

본 프로젝트는 AWS 기반의 Cloud Native 구조로 설계되었습니다.

**주요 구성 요소**
- Route53  
- CloudFront  
- S3  
- API Gateway  
- Backend API  
- RDS(PostgreSQL)  
- EKS 기반 서비스(팀 인프라 담당자 구축)

**요청 흐름**
Client → CloudFront → S3 → API Gateway → Backend API → RDS

---

## 🧩 담당 역할 (Architecture 중심)

- 전체 AWS 기반 MSA 구조에 대한 이해  
- API Gateway → Backend → DB로 이어지는 서비스 흐름 정리  
- 백엔드 API 일부 구현  
  - 뉴스 크롤링 API  
  - AI 기반 자격증 검색 API  
- 데이터 처리/정제 로직 설계  
- 서비스 구조 설계 회의 참여 및 문서화  
- 인프라 담당자(EKS/CI-CD)와 협업

---

## 🧱 기술 스택

**Cloud / Infra**
- AWS (CloudFront, Route53, S3, API Gateway, RDS)  
- MSA 구조 이해  
- Docker / Kubernetes(EKS 구조 이해)

**Backend**
- Node.js / Express  
- Cheerio / Puppeteer  
- AI API(Gemini)  

---

## 📈 프로젝트를 통해 배운 점

- MSA 기반 서비스 분리 구조 이해  
- Cloud Native 아키텍처 개념 정립  
- API Gateway 라우팅 방식  
- 크롤링 및 데이터 정제 파이프라인  
- 인프라-백엔드 협업 프로세스  
- 분산 아키텍처 설계 시 고려사항

---

## 🚀 향후 계획

- 직접 EKS 배포 및 운영 구조 구현  
- CloudWatch 기반 로그/모니터링 추가  
- API 구조 최적화 및 캐싱 고도화  
