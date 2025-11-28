# ALB 주소 업데이트 가이드

## 📋 개요
EKS 리소스를 새로 생성할 때 ALB DNS 주소가 변경되므로, 다음 파일들에서 ALB 주소를 업데이트해야 합니다.

## ✅ 완료된 수정사항

### 1. ALB Contq ller ServiceAccount 매니페스트
- **파일**: `k8s-eks/alb-controller-sa.yaml`
- **수정**: 하드코딩된 ARN을 `${ALB_CONTROLLER_ROLE_ARN}` 변수로 변경
- **상태**: ✅ 완료

### 2. API Gateway Integration 설정
- **파일**: `terraform/stages/07-api-gateway/integrations.tf`
- **수정**: 이미 `var.alb_dns_name` 변수 사용 중
- **상태**: ✅ 완료

### 3. API Gateway Outputs
- **파일**: `terraform/stages/07-api-gateway/outputs.tf`
- **수정**: ALB DNS 이름 출력 추가
- **상태**: ✅ 완료

## 🔄 새 EKS 리소스 생성 후 업데이트 필요

### 1. 백엔드 서비스 간 통신 설정

#### A. Kubernetes Secrets
- **파일**: `k8s-eks/02-secrets/backend-secrets.yaml`
- **현재**: `NOTIFICATION_API_URL: aHR0cDovL2s4cy1oaXBwb2FwaS01Y2ExZDZmNWJiLTM0NzIxNzU2Ny5hcC1ub3J0aGVhc3QtMi5lbGIuYW1hem9uYXdzLmNvbS9hcGkvbm90aWZpY2F0aW9ucw==`
- **업데이트**: 새 ALB 주소로 base64 인코딩하여 업데이트

#### B. 환경 변수 예시 파일
- **파일**: `backend/community-board-api-unified/env.example`
- **파일**: `backend/study-group-api/env.example`
- **현재**: `NOTIFICATION_API_URL=http://k8s-hippoapi-5ca1d6f5bb-347217567.ap-northeast-2.elb.amazonaws.com/api/notifications`
- **업데이트**: 새 ALB 주소로 변경

### 2. 모니터링 설정

#### A. API Gateway 모니터링 설정
- **파일**: `k8s-eks/05-monitoring/api-gateway-monitoring.tf`
- **현재**: 
  ```hcl
  uri = "http://k8s-hippoapi-5ca1d6f5bb-347217567.ap-northeast-2.elb.amazonaws.com/monitoring/grafana"
  uri = "http://k8s-hippoapi-5ca1d6f5bb-347217567.ap-northeast-2.elb.amazonaws.com/monitoring/prometheus"
  uri = "http://k8s-hippoapi-5ca1d6f5bb-347217567.ap-northeast-2.elb.amazonaws.com/monitoring/alertmanager"
  ```
- **업데이트**: 새 ALB 주소로 변경

### 3. 문서 및 가이드

#### A. 프론트엔드 배포 가이드
- **파일**: `FRONTEND_DEPLOYMENT_GUIDE.md`
- **현재**: 예시 URL들이 이전 ALB 주소 사용
- **업데이트**: 새 ALB 주소로 예시 URL 변경

#### B. 프로젝트 상태 문서
- **파일**: `Status-all/ALL_PROJECT.md`
- **파일**: `PROJECT_STATUS.md`
- **현재**: ALB DNS 주소가 문서에 기록됨
- **업데이트**: 새 ALB 주소로 업데이트

#### C. 작업 요약 문서
- **파일**: `workingday/08.28_WORK_SUMMARY.md`
- **현재**: ALB 주소와 API 엔드포인트 예시
- **업데이트**: 새 ALB 주소로 업데이트

## 🛠️ 업데이트 방법

### 1. 새 ALB 주소 확인
```bash
# EKS 클러스터 생성 후 ALB 주소 확인
kubectl get ingress -n hippo-project
# 또는
kubectl get svc -n hippo-project
```

### 2. Base64 인코딩 (Secrets용)
```bash
# 새 ALB 주소를 base64로 인코딩
echo -n "http://새-ALB-주소/api/notifications" | base64
```

### 3. 파일 업데이트 순서
1. **Kubernetes Secrets** (`k8s-eks/02-secrets/backend-secrets.yaml`)
2. **환경 변수 예시** (`backend/*/env.example`)
3. **모니터링 설정** (`k8s-eks/05-monitoring/api-gateway-monitoring.tf`)
4. **문서 업데이트** (가이드 및 상태 문서)

## 📝 참고사항

- **프론트엔드**: API Gateway URL 사용하므로 ALB 주소 직접 참조 없음
- **API Gateway**: Terraform 변수로 동적 참조하므로 자동 업데이트
- **백엔드 서비스**: 서비스 간 통신에만 ALB 주소 사용

## 🎯 우선순위

1. **높음**: Kubernetes Secrets (서비스 동작에 필수)
2. **중간**: 환경 변수 예시 파일 (개발 참고용)
3. **낮음**: 모니터링 설정, 문서 업데이트
