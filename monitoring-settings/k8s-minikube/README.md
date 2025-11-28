# 🐳 Minikube 로컬 개발 환경

이 폴더는 로컬 개발을 위한 Minikube Kubernetes 환경 설정을 포함합니다.

## 📁 파일 구조

```
k8s-minikube/
├── README.md                    # 이 파일
├── namespace.yaml               # hippo-project 네임스페이스
├── postgres-deployment.yaml     # 로컬 PostgreSQL 데이터베이스
├── community-board-deployment.yaml  # 커뮤니티 게시판 API
├── study-group-deployment.yaml      # 스터디 그룹 API
├── notification-deployment.yaml     # 알림 API
├── jobs-news-deployment.yaml        # 취업 뉴스 API
├── certificate-search-deployment.yaml # 자격증 검색 API
├── ai-portfolio-deployment.yaml     # AI 포트폴리오 API
├── frontend-deployment-v3.yaml      # 프론트엔드 (정적 파일)
├── ingress.yaml                     # NGINX Ingress 설정
├── deploy.sh                        # Linux/Mac 배포 스크립트
├── deploy.ps1                       # Windows PowerShell 배포 스크립트
└── deploy.bat                       # Windows Batch 배포 스크립트
```

## 🚀 빠른 시작

### **Linux/Mac:**
```bash
cd k8s-minikube
./deploy.sh
```

### **Windows PowerShell:**
```powershell
cd k8s-minikube
.\deploy.ps1
```

### **Windows Command Prompt:**
```cmd
cd k8s-minikube
deploy.bat
```

## 🔧 사전 요구사항

- **Minikube** 설치 및 실행
- **kubectl** 설치
- **Docker** 설치 및 실행
- **Node.js** 및 **npm** (프론트엔드 빌드용)

## 📊 서비스 포트

| 서비스 | 포트 | 설명 |
|--------|------|------|
| community-board-service | 3002 | 커뮤니티 게시판 API |
| study-group-service | 3003 | 스터디 그룹 API |
| notification-service | 3004 | 알림 API |
| jobs-news-service | 3006 | 취업 뉴스 API |
| certificate-search-service | 5000 | 자격증 검색 API |
| ai-portfolio-service | 4000 | AI 포트폴리오 API |
| frontend-service | 3000 | 프론트엔드 (NodePort) |

## 🌐 접속 방법

### **프론트엔드:**
```bash
minikube service frontend-service -n hippo-project
```

### **API 엔드포인트:**
```bash
# Ingress를 통한 접근
kubectl get ingress api-ingress -n hippo-project

# 또는 직접 서비스 접근
kubectl port-forward service/community-board-service 3002:3002 -n hippo-project
```

## 🗄️ 데이터베이스

- **PostgreSQL** 13.4
- **포트**: 5432
- **데이터베이스**: hippo_unified_db
- **사용자**: hippo_user
- **비밀번호**: hippo_password

## 🔍 문제 해결

### **Pod 상태 확인:**
```bash
kubectl get pods -n hippo-project
kubectl describe pod <pod-name> -n hippo-project
```

### **로그 확인:**
```bash
kubectl logs <pod-name> -n hippo-project
```

### **서비스 상태 확인:**
```bash
kubectl get services -n hippo-project
kubectl get ingress -n hippo-project
```

### **Minikube 상태 확인:**
```bash
minikube status
minikube ip
```

## 🧹 정리

### **전체 환경 삭제:**
```bash
kubectl delete namespace hippo-project
minikube stop
```

### **Minikube 완전 삭제:**
```bash
minikube delete
```

## 📝 참고사항

- 이 환경은 **로컬 개발 전용**입니다
- 프로덕션 환경과는 다른 설정을 사용합니다
- 로컬 PostgreSQL을 사용하여 AWS RDS 대신합니다
- 모든 API 키는 개발용으로 설정되어 있습니다
