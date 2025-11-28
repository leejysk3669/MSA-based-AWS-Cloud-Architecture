#!/bin/bash

# 쿠버네티스 배포 스크립트
set -e

echo "🚀 쿠버네티스 배포 시작..."

# 네임스페이스 생성 (없는 경우)
kubectl create namespace certificate-search --dry-run=client -o yaml | kubectl apply -f -

# ConfigMap 적용
echo "📝 ConfigMap 적용 중..."
kubectl apply -f k8s-configmap.yaml -n certificate-search

# Secret 적용 (실제 값으로 교체 필요)
echo "🔐 Secret 적용 중..."
kubectl apply -f k8s-secrets.yaml -n certificate-search

# Deployment 적용
echo "📦 Deployment 적용 중..."
kubectl apply -f k8s-deployment.yaml -n certificate-search

# Service 적용
echo "🌐 Service 적용 중..."
kubectl apply -f k8s-service.yaml -n certificate-search

# HPA 적용
echo "📈 HPA 적용 중..."
kubectl apply -f k8s-hpa.yaml -n certificate-search

# Ingress 적용 (선택사항)
echo "🔗 Ingress 적용 중..."
kubectl apply -f k8s-ingress.yaml -n certificate-search

# 배포 상태 확인
echo "✅ 배포 완료! 상태 확인 중..."
kubectl get pods -n certificate-search
kubectl get services -n certificate-search
kubectl get ingress -n certificate-search

echo "🎉 배포가 완료되었습니다!"
echo "📊 모니터링: kubectl logs -f deployment/certificate-search-api -n certificate-search"
echo "🌐 서비스 접속: kubectl port-forward service/certificate-search-api-service-nodeport 8080:80 -n certificate-search"
