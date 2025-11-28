
SeeSun 아키텍처 프로젝트  
MSA 기반 AWS Cloud Architecture

본 레포지토리는 SeeSun 서비스의 **MSA 기반 AWS 클라우드 아키텍처**를 이해하고  
백엔드 API 흐름 및 서비스 구조 설계에 참여한 내용을 정리한 저장소입니다.

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

## 🧱 기술 스택

**Cloud / Infra**
- AWS (CloudFront, Route53, S3, API Gateway, RDS)  
- MSA 구조 이해  
- Docker / Kubernetes(EKS 구조 이해)

---

## 🚀 향후 계획

- 직접 EKS 배포 및 운영 구조 구현  
- API 구조 최적화 및 캐싱 고도화  
