# 🚀 Hippo Project 모니터링 시스템

## 📋 개요

Hippo Project의 AWS CloudWatch와 Prometheus 기반 모니터링 시스템입니다.

### 🏗️ 모니터링 스택 구성

- **Prometheus**: 메트릭 수집 및 저장
- **Grafana**: 시각화 및 대시보드
- **AlertManager**: 알림 관리
- **CloudWatch Exporter**: AWS CloudWatch 메트릭 수집
- **CloudWatch**: AWS 서비스 모니터링 및 알림

## 📁 파일 구조

```
06-monitoring/
├── namespace.yaml                    # 모니터링 네임스페이스
├── prometheus-config.yaml           # Prometheus 설정
├── prometheus-deployment.yaml       # Prometheus 배포 (monitoring node)
├── grafana-deployment.yaml          # Grafana 배포 (monitoring node) ✅
├── grafana-dashboard-config.yaml    # Grafana 대시보드 설정
├── grafana-notification-channels.yaml # 알림 채널 설정
├── alertmanager-deployment.yaml     # AlertManager 배포 (monitoring node)
├── cloudwatch-exporter.yaml         # CloudWatch Exporter 배포
├── cloudwatch-exporter-iam.yaml     # IAM 권한 설정
├── monitoring-ingress.yaml          # Ingress 설정 (ALB)
├── deploy-monitoring.sh             # 배포 스크립트 (Linux/Mac)
├── deploy-monitoring.ps1            # 배포 스크립트 (Windows)
├── check-status.ps1                 # 상태 확인 스크립트
└── README.md                        # 이 파일
```

## 🚀 배포 방법

### 1. 사전 준비사항

- EKS 클러스터가 실행 중이어야 함
- kubectl이 설치되어 있어야 함
- AWS CLI가 설정되어 있어야 함

### 2. 배포 실행

#### Linux/Mac
```bash
cd k8s-eks/06-monitoring
chmod +x deploy-monitoring.sh
./deploy-monitoring.sh
```

#### Windows
```powershell
cd k8s-eks/06-monitoring
.\deploy-monitoring.ps1
```

### 3. 수동 배포
```bash
kubectl apply -f namespace.yaml
kubectl apply -f prometheus-config.yaml
kubectl apply -f prometheus-deployment.yaml
kubectl apply -f grafana-deployment.yaml
kubectl apply -f alertmanager-deployment.yaml
kubectl apply -f cloudwatch-exporter.yaml
kubectl apply -f cloudwatch-exporter-iam.yaml
kubectl apply -f monitoring-ingress.yaml
```

## 📊 접속 정보

### Grafana
- **URL**: `http://monitoring.hippo-project.com/grafana`
- **사용자명**: `admin`
- **비밀번호**: `admin123`

### Prometheus
- **URL**: `http://monitoring.hippo-project.com/prometheus`

### AlertManager
- **URL**: `http://monitoring.hippo-project.com/alertmanager`

## 🔍 모니터링 대상

### 애플리케이션 메트릭
- HTTP 요청률 (초당 요청 수)
- 응답 시간 (95th percentile)
- 에러율 (4xx, 5xx)
- 데이터베이스 연결 상태
- 게시글/댓글 수

### 인프라 메트릭
- Pod 상태
- CPU 사용률
- 메모리 사용률
- 네트워크 트래픽
- 디스크 사용률

### AWS CloudWatch 메트릭
- EKS 클러스터 CPU/메모리 사용률
- ALB 요청 수 및 응답 시간
- RDS CPU 사용률 및 연결 수

## 🚨 알림 설정

### 알림 조건
- **High Error Rate**: 에러율이 10% 초과 시
- **High Response Time**: 응답 시간이 1초 초과 시
- **Pod Down**: Pod가 다운된 상태일 때
- **High Memory Usage**: 메모리 사용률이 80% 초과 시

### 알림 채널
- Slack 웹훅
- 이메일
- Webhook (AlertManager 연동)

## 🔧 설정 수정

### 1. Grafana 비밀번호 변경
`grafana-deployment.yaml`에서 `GF_SECURITY_ADMIN_PASSWORD` 환경변수 수정

### 2. 알림 채널 설정
`grafana-notification-channels.yaml`에서 웹훅 URL 및 이메일 주소 수정

### 3. CloudWatch Exporter 설정
`cloudwatch-exporter.yaml`에서 수집할 메트릭 범위 수정

### 4. Ingress 도메인 변경
`monitoring-ingress.yaml`에서 호스트명 수정

## 📈 대시보드

### 1. Hippo Project - 전체 모니터링
- 애플리케이션 성능 지표
- 서비스 상태
- 데이터베이스 연결 상태
- 비즈니스 메트릭 (게시글/댓글 수)

### 2. Kubernetes 클러스터 모니터링
- Pod 상태
- 노드 리소스 사용률
- 클러스터 전체 상태

## 🔍 문제 해결

### 1. Pod가 시작되지 않는 경우
```bash
kubectl describe pod <pod-name> -n monitoring
kubectl logs <pod-name> -n monitoring
```

### 2. 메트릭이 수집되지 않는 경우
```bash
# Prometheus 타겟 상태 확인
curl http://prometheus:9090/api/v1/targets

# 백엔드 서비스 메트릭 엔드포인트 확인
curl http://community-board-service:3002/metrics
```

### 3. Grafana에 접속할 수 없는 경우
```bash
# Ingress 상태 확인
kubectl get ingress -n monitoring
kubectl describe ingress monitoring-ingress -n monitoring
```

## 📝 유지보수

### 1. 로그 로테이션
CloudWatch Log Groups는 7일 후 자동 삭제됩니다.

### 2. 메트릭 보존
- Prometheus: 200시간 (약 8일)
- CloudWatch: 15개월 (기본값)

### 3. 알림 정리
주기적으로 알림 규칙을 검토하고 불필요한 알림은 비활성화하세요.

## 🔗 관련 문서

- [Prometheus 공식 문서](https://prometheus.io/docs/)
- [Grafana 공식 문서](https://grafana.com/docs/)
- [AWS CloudWatch 문서](https://docs.aws.amazon.com/cloudwatch/)
- [Kubernetes 모니터링 가이드](https://kubernetes.io/docs/tasks/debug-application-cluster/resource-usage-monitoring/)

## 📞 지원

문제가 발생하거나 추가 설정이 필요한 경우, 프로젝트 관리자에게 문의하세요.




