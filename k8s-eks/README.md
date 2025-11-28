# 🚀 EKS 애플리케이션 배포 가이드

## 📁 디렉토리 구조
```
k8s-eks/
├── 01-namespace/           # 네임스페이스
├── 02-secrets/            # 시크릿 및 ConfigMap
├── 03-backend/            # 백엔드 서비스들
├── 05-ingress/            # Ingress 설정
├── deploy.sh              # 배포 스크립트
└── README.md              # 이 파일
```

## 🔧 사전 준비사항

### 1. AWS CLI 설정
```bash
aws configure
```

### 2. kubectl 설치
```bash
# Windows
choco install kubernetes-cli

# macOS
brew install kubectl
```

### 3. EKS 클러스터 준비
- Terraform으로 EKS 클러스터 배포 완료
- AWS Load Balancer Controller 설치 완료

## 📝 배포 전 수정사항

### 1. 데이터베이스 시크릿 수정
`02-secrets/db-secret.yaml`에서:
```yaml
data:
  username: <base64-encoded-username>
  password: <base64-encoded-password>
```

### 2. RDS 엔드포인트 수정
`02-secrets/db-secret.yaml`에서:
```yaml
data:
  rds-endpoint: "실제-RDS-엔드포인트"
```

### 3. 프론트엔드 API URL 수정
프론트엔드는 S3 + CloudFront로 배포되므로, 프론트엔드 코드에서 API URL을 ALB DNS 이름으로 설정해야 합니다.

### 4. SSL 인증서 ARN 수정 (선택사항)
`05-ingress/ingress.yaml`에서:
```yaml
annotations:
  alb.ingress.kubernetes.io/certificate-arn: "실제-ACM-인증서-ARN"
```

## 🚀 배포 방법

### 방법 1: 스크립트 사용
```bash
cd k8s-eks
chmod +x deploy.sh
./deploy.sh
```

### 방법 2: 수동 배포
```bash
# 1. EKS 클러스터 연결
aws eks update-kubeconfig --name hippo-eks-dev --region ap-northeast-2

# 2. 순서대로 배포
kubectl apply -f 01-namespace/
kubectl apply -f 02-secrets/
kubectl apply -f 03-backend/
kubectl apply -f 05-ingress/
```

## 📊 모니터링

### Pod 상태 확인
```bash
kubectl get pods -n hippo-project
kubectl get pods -n hippo-project -w  # 실시간 모니터링
```

### 서비스 상태 확인
```bash
kubectl get services -n hippo-project
```

### Ingress 상태 확인
```bash
kubectl get ingress -n hippo-project
kubectl describe ingress hippo-ingress -n hippo-project
```

### 로그 확인
```bash
# 특정 Pod 로그
kubectl logs -f <pod-name> -n hippo-project

# 모든 Pod 로그
kubectl logs -f -l app=community-board -n hippo-project
```

## 🔍 문제 해결

### 1. Pod가 Running 상태가 아닌 경우
```bash
kubectl describe pod <pod-name> -n hippo-project
```

### 2. 서비스 연결 문제
```bash
kubectl get endpoints -n hippo-project
```

### 3. Ingress 문제
```bash
kubectl describe ingress hippo-ingress -n hippo-project
```

## 🗑️ 삭제

### 전체 삭제
```bash
kubectl delete namespace hippo-project
```

### 개별 삭제
```bash
kubectl delete -f 05-ingress/
kubectl delete -f 03-backend/
kubectl delete -f 02-secrets/
kubectl delete -f 01-namespace/
```

## 📋 체크리스트

- [ ] AWS CLI 설정 완료
- [ ] kubectl 설치 완료
- [ ] EKS 클러스터 배포 완료
- [ ] AWS Load Balancer Controller 설치 완료
- [ ] 데이터베이스 시크릿 수정
- [ ] RDS 엔드포인트 수정
- [ ] 프론트엔드 API URL 수정
- [ ] SSL 인증서 ARN 수정 (선택사항)
- [ ] Docker 이미지가 Docker Hub에 푸시됨
- [ ] 모든 매니페스트 파일 검토 완료
